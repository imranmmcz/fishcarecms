import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Fish, Search, Download, FileText, Loader2, DollarSign,
  Pill, ClipboardList, Package, CalendarIcon, Filter, X, BarChart3
} from "lucide-react";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
}

const EXPENSE_CATEGORIES = [
  { value: "all", bn: "সব ক্যাটাগরি", en: "All Categories" },
  { value: "খাবার", bn: "খাবার", en: "Feed" },
  { value: "ওষুধ", bn: "ওষুধ", en: "Medicine" },
  { value: "সার", bn: "সার", en: "Fertilizer" },
  { value: "শ্রমিক", bn: "শ্রমিক", en: "Labor" },
  { value: "পরিবহন", bn: "পরিবহন", en: "Transport" },
  { value: "অন্যান্য", bn: "অন্যান্য", en: "Others" },
];

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

export default function AdminFarmingReports() {
  const { language } = useLanguage();
  const t = (bn: string, en: string) => language === "bn" ? bn : en;

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
  const [samplings, setSamplings] = useState<any[]>([]);

  // Filters
  const [selectedUser, setSelectedUser] = useState("all");
  const [searchName, setSearchName] = useState("");
  const [selectedPond, setSelectedPond] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profilesRes, expensesRes, incomesRes, pondsRes, samplingsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email, mobile"),
        supabase.from("farmer_expenses").select("*"),
        supabase.from("farmer_incomes").select("*"),
        supabase.from("farmer_ponds").select("*"),
        supabase.from("farmer_samplings").select("*"),
      ]);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
      if (incomesRes.data) setIncomes(incomesRes.data);
      if (pondsRes.data) setPonds(pondsRes.data);
      if (samplingsRes.data) setSamplings(samplingsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: string) => {
    const p = profiles.find(p => p.user_id === userId);
    return p?.full_name || p?.email || t("অজানা", "Unknown");
  };

  // Filtered users based on search
  const filteredProfiles = useMemo(() => {
    if (!searchName) return profiles;
    const s = searchName.toLowerCase();
    return profiles.filter(p =>
      (p.full_name?.toLowerCase() || "").includes(s) ||
      (p.email?.toLowerCase() || "").includes(s) ||
      (p.mobile || "").includes(s)
    );
  }, [profiles, searchName]);

  // All unique pond names
  const allPondNames = useMemo(() => {
    const names = new Set<string>();
    ponds.forEach(p => names.add(p.name));
    expenses.forEach(e => { if (e.pond_name) names.add(e.pond_name); });
    incomes.forEach(i => { if (i.pond_name) names.add(i.pond_name); });
    return Array.from(names).sort();
  }, [ponds, expenses, incomes]);

  // Combined report data
  const reportData = useMemo(() => {
    let combined: any[] = [];

    // Add expenses
    expenses.forEach(e => {
      combined.push({
        id: e.id,
        type: "expense",
        user_id: e.user_id,
        farmer_name: getUserName(e.user_id),
        pond_name: e.pond_name || "-",
        category: e.category,
        amount: Number(e.amount),
        date: e.date,
        description: e.description || "-",
        product_used: e.category === "খাবার" ? t("ফিশ ফিড", "Fish Feed")
          : e.category === "ওষুধ" ? t("ওষুধ", "Medicine")
          : e.category === "সার" ? t("সার", "Fertilizer") : "-",
      });
    });

    // Add incomes
    incomes.forEach(i => {
      combined.push({
        id: i.id,
        type: "income",
        user_id: i.user_id,
        farmer_name: getUserName(i.user_id),
        pond_name: i.pond_name || "-",
        category: i.category,
        amount: Number(i.amount),
        date: i.date,
        description: i.description || "-",
        product_used: i.fish_type || "-",
      });
    });

    // Apply filters
    if (selectedUser !== "all") {
      combined = combined.filter(r => r.user_id === selectedUser);
    }
    if (selectedPond !== "all") {
      combined = combined.filter(r => r.pond_name === selectedPond);
    }
    if (selectedCategory !== "all") {
      combined = combined.filter(r => r.category === selectedCategory);
    }
    if (dateFrom) {
      combined = combined.filter(r => new Date(r.date) >= dateFrom);
    }
    if (dateTo) {
      const toEnd = new Date(dateTo);
      toEnd.setHours(23, 59, 59);
      combined = combined.filter(r => new Date(r.date) <= toEnd);
    }
    if (searchText) {
      const s = searchText.toLowerCase();
      combined = combined.filter(r =>
        r.farmer_name.toLowerCase().includes(s) ||
        r.pond_name.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s) ||
        r.category.toLowerCase().includes(s)
      );
    }

    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return combined;
  }, [expenses, incomes, selectedUser, selectedPond, selectedCategory, dateFrom, dateTo, searchText, profiles]);

  // Summary stats
  const stats = useMemo(() => {
    const expenseRows = reportData.filter(r => r.type === "expense");
    const totalFarmingCost = expenseRows.reduce((s, r) => s + r.amount, 0);
    const medicineRows = expenseRows.filter(r => r.category === "ওষুধ");
    const totalMedicine = medicineRows.reduce((s, r) => s + r.amount, 0);

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    expenseRows.forEach(r => {
      categoryMap[r.category] = (categoryMap[r.category] || 0) + r.amount;
    });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Most used product
    const productMap: Record<string, number> = {};
    expenseRows.forEach(r => {
      if (r.product_used !== "-") {
        productMap[r.product_used] = (productMap[r.product_used] || 0) + 1;
      }
    });
    const mostUsedProduct = Object.entries(productMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    // Pond report count
    const pondSet = new Set(reportData.map(r => r.pond_name).filter(n => n !== "-"));

    return { totalFarmingCost, totalMedicine, totalPondReports: pondSet.size, mostUsedProduct, categoryData };
  }, [reportData]);

  // Per-farmer breakdown for chart
  const farmerBreakdown = useMemo(() => {
    const map: Record<string, { name: string; expense: number; income: number }> = {};
    reportData.forEach(r => {
      if (!map[r.user_id]) {
        map[r.user_id] = { name: r.farmer_name, expense: 0, income: 0 };
      }
      if (r.type === "expense") map[r.user_id].expense += r.amount;
      else map[r.user_id].income += r.amount;
    });
    return Object.values(map).slice(0, 10);
  }, [reportData]);

  const clearFilters = () => {
    setSelectedUser("all");
    setSearchName("");
    setSelectedPond("all");
    setSelectedCategory("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchText("");
  };

  const hasFilters = selectedUser !== "all" || searchName || selectedPond !== "all" ||
    selectedCategory !== "all" || dateFrom || dateTo || searchText;

  // CSV Export
  const exportCSV = () => {
    let csv = "ধরন,কৃষক,পুকুর,ক্যাটাগরি,পণ্য,পরিমাণ,তারিখ,বিবরণ\n";
    reportData.forEach(r => {
      csv += `${r.type === "expense" ? "ব্যয়" : "আয়"},${r.farmer_name},${r.pond_name},${r.category},${r.product_used},${r.amount},${r.date},"${r.description}"\n`;
    });
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `farming_report_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("CSV ডাউনলোড হয়েছে", "CSV downloaded"));
  };

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Farming Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 14, 22);
    doc.text(`Total Records: ${reportData.length}`, 14, 28);
    doc.text(`Total Farming Cost: ${stats.totalFarmingCost.toLocaleString()}`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [["Type", "Farmer", "Pond", "Category", "Product", "Amount", "Date", "Description"]],
      body: reportData.map(r => [
        r.type === "expense" ? "Expense" : "Income",
        r.farmer_name,
        r.pond_name,
        r.category,
        r.product_used,
        r.amount.toLocaleString(),
        r.date,
        r.description.slice(0, 30),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`farming_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success(t("PDF ডাউনলোড হয়েছে", "PDF downloaded"));
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 px-1 sm:px-0">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Fish className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              {t("ফার্মিং রিপোর্ট ম্যানেজমেন্ট", "Farming Report Management")}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              {t("কৃষকদের ফার্মিং ডেটা বিশ্লেষণ ও রিপোর্ট", "Analyze and report farming data")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button onClick={exportPDF} variant="outline" size="sm" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-3 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("মোট ফার্মিং খরচ", "Total Farming Cost")}</p>
                  <p className="text-sm sm:text-xl font-bold mt-0.5 truncate">৳{stats.totalFarmingCost.toLocaleString()}</p>
                </div>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-500 to-red-600 shrink-0">
                  <DollarSign className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-3 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("মোট ওষুধ খরচ", "Total Medicine Cost")}</p>
                  <p className="text-sm sm:text-xl font-bold mt-0.5 truncate">৳{stats.totalMedicine.toLocaleString()}</p>
                </div>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shrink-0">
                  <Pill className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-3 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("পুকুর রিপোর্ট", "Pond Reports")}</p>
                  <p className="text-sm sm:text-xl font-bold mt-0.5">{stats.totalPondReports}</p>
                </div>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shrink-0">
                  <ClipboardList className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-3 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("সর্বাধিক ব্যবহৃত পণ্য", "Most Used Product")}</p>
                  <p className="text-sm sm:text-xl font-bold mt-0.5 truncate">{stats.mostUsedProduct}</p>
                </div>
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shrink-0">
                  <Package className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("ফিল্টার", "Filters")}
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs gap-1 text-destructive">
                  <X className="h-3 w-3" /> {t("ক্লিয়ার", "Clear")}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {/* User filter */}
              <div>
                <Label className="text-xs mb-1 block">{t("কৃষক", "Farmer")}</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={t("সব কৃষক", "All Farmers")} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5">
                      <Input
                        placeholder={t("নাম/মোবাইল সার্চ...", "Search name/mobile...")}
                        value={searchName}
                        onChange={e => setSearchName(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <SelectItem value="all">{t("সব কৃষক", "All Farmers")}</SelectItem>
                    {filteredProfiles.map(p => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.full_name || p.email || p.mobile || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pond filter */}
              <div>
                <Label className="text-xs mb-1 block">{t("পুকুর", "Pond")}</Label>
                <Select value={selectedPond} onValueChange={setSelectedPond}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={t("সব পুকুর", "All Ponds")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("সব পুকুর", "All Ponds")}</SelectItem>
                    {allPondNames.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category filter */}
              <div>
                <Label className="text-xs mb-1 block">{t("ক্যাটাগরি", "Category")}</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{t(c.bn, c.en)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <Label className="text-xs mb-1 block">{t("তারিখ থেকে", "Date From")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full h-9 justify-start text-sm font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {dateFrom ? format(dateFrom, "yyyy-MM-dd") : t("নির্বাচন", "Select")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div>
                <Label className="text-xs mb-1 block">{t("তারিখ পর্যন্ত", "Date To")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-full h-9 justify-start text-sm font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {dateTo ? format(dateTo, "yyyy-MM-dd") : t("নির্বাচন", "Select")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search */}
              <div>
                <Label className="text-xs mb-1 block">{t("সার্চ", "Search")}</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder={t("সার্চ করুন...", "Search...")}
                    className="h-9 pl-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">{t("ডেটা লোড হচ্ছে...", "Loading data...")}</span>
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
              {/* Farmer Breakdown */}
              {farmerBreakdown.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      {t("কৃষকভিত্তিক আয়-ব্যয়", "Farmer-wise Income vs Expense")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-1 sm:px-6">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={farmerBreakdown} margin={{ left: -15, right: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 9 }} width={45} />
                        <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="income" fill="#10b981" name={t("আয়", "Income")} />
                        <Bar dataKey="expense" fill="#ef4444" name={t("ব্যয়", "Expense")} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Category Pie */}
              {stats.categoryData.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 px-3 sm:px-6">
                    <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      {t("খরচের ক্যাটাগরি বিশ্লেষণ", "Expense Category Breakdown")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-1 sm:px-6">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={stats.categoryData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                          {stats.categoryData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Data Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    {t("রিপোর্ট ডেটা", "Report Data")}
                  </span>
                  <Badge variant="secondary">{reportData.length} {t("টি রেকর্ড", " records")}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("তারিখ", "Date")}</TableHead>
                        <TableHead>{t("ধরন", "Type")}</TableHead>
                        <TableHead>{t("কৃষক", "Farmer")}</TableHead>
                        <TableHead>{t("পুকুর", "Pond")}</TableHead>
                        <TableHead>{t("ক্যাটাগরি", "Category")}</TableHead>
                        <TableHead>{t("পণ্য", "Product")}</TableHead>
                        <TableHead className="text-right">{t("পরিমাণ", "Amount")}</TableHead>
                        <TableHead>{t("বিবরণ", "Description")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.slice(0, 100).map(r => (
                        <TableRow key={`${r.type}-${r.id}`}>
                          <TableCell className="text-xs whitespace-nowrap">{r.date}</TableCell>
                          <TableCell>
                            <Badge variant={r.type === "expense" ? "destructive" : "default"} className="text-[10px]">
                              {r.type === "expense" ? t("ব্যয়", "Expense") : t("আয়", "Income")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{r.farmer_name}</TableCell>
                          <TableCell className="text-sm">{r.pond_name}</TableCell>
                          <TableCell className="text-sm">{r.category}</TableCell>
                          <TableCell className="text-sm">{r.product_used}</TableCell>
                          <TableCell className="text-right font-medium">৳{r.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{r.description}</TableCell>
                        </TableRow>
                      ))}
                      {reportData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                            {t("কোনো রিপোর্ট ডেটা পাওয়া যায়নি", "No report data found")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {reportData.length > 100 && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      {t(`প্রথম ১০০টি দেখানো হচ্ছে। সম্পূর্ণ ডেটা এক্সপোর্ট করুন।`, `Showing first 100. Export for full data.`)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
