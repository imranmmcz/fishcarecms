import { useState, useEffect } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  TrendingUp, ShoppingCart, PlayCircle, ArrowRight,
  Banknote, Smartphone, Filter, X, Calendar,
  FileText, Package, RotateCcw, ArrowLeftRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

type QuickFilter = "today" | "yesterday" | "last7" | "last30" | "custom";

function getDateRange(filter: QuickFilter, customFrom: string, customTo: string) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  switch (filter) {
    case "today":
      return { from: today + "T00:00:00", to: today + "T23:59:59" };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yd = y.toISOString().split("T")[0];
      return { from: yd + "T00:00:00", to: yd + "T23:59:59" };
    }
    case "last7": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { from: d.toISOString().split("T")[0] + "T00:00:00", to: today + "T23:59:59" };
    }
    case "last30": {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { from: d.toISOString().split("T")[0] + "T00:00:00", to: today + "T23:59:59" };
    }
    case "custom":
      return {
        from: (customFrom || today) + "T00:00:00",
        to: (customTo || today) + "T23:59:59",
      };
  }
}

const quickFilterLabels: Record<QuickFilter, string> = {
  today: "আজ",
  yesterday: "গতকাল",
  last7: "শেষ ৭ দিন",
  last30: "শেষ ৩০ দিন",
  custom: "কাস্টম",
};

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  amount: string;
  subtitle?: string;
  subtitle2?: string;
}

function StatCard({ icon, iconBg, title, amount, subtitle, subtitle2 }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-950/90 to-teal-900/90 border border-emerald-700/30 p-5 transition-all hover:border-emerald-600/50 hover:shadow-lg hover:shadow-emerald-900/30">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full shadow-lg ${iconBg} shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/70 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">৳ {amount}</p>
          {subtitle && <p className="text-[11px] text-emerald-300/60 mt-1.5">{subtitle}</p>}
          {subtitle2 && <p className="text-[11px] text-emerald-300/60">{subtitle2}</p>}
        </div>
      </div>
    </div>
  );
}

export default function POSDashboard() {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<any>(null);
  const [todayStats, setTodayStats] = useState({
    totalSales: 0, totalTransactions: 0, cashSales: 0, mobileSales: 0,
    totalPurchase: 0, purchaseDue: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentShifts, setRecentShifts] = useState<any[]>([]);

  const [quickFilter, setQuickFilter] = useState<QuickFilter>("today");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) fetchActiveShift();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentSales();
      fetchRecentShifts();
    }
  }, [user, quickFilter, customFrom, customTo, paymentFilter]);

  const fetchActiveShift = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pos_shifts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")
      .maybeSingle();
    if (data) setActiveShift(data);
  };

  const fetchStats = async () => {
    const { from, to } = getDateRange(quickFilter, customFrom, customTo);
    let q = supabase
      .from("pos_sales")
      .select("total_amount, payment_method")
      .gte("created_at", from)
      .lte("created_at", to);

    if (paymentFilter !== "all") q = q.eq("payment_method", paymentFilter);

    const { data } = await q;

    // Fetch purchase data
    const { data: purchaseData } = await supabase
      .from("purchase_orders")
      .select("total_amount, status")
      .gte("created_at", from)
      .lte("created_at", to);

    const totalPurchase = purchaseData?.reduce((s, r) => s + (r.total_amount || 0), 0) || 0;
    const purchaseDue = purchaseData?.filter(r => r.status === "pending" || r.status === "ordered")
      .reduce((s, r) => s + (r.total_amount || 0), 0) || 0;

    if (data) {
      setTodayStats({
        totalSales: data.reduce((s, r) => s + (r.total_amount || 0), 0),
        totalTransactions: data.length,
        cashSales: data.filter(r => r.payment_method === "cash").reduce((s, r) => s + (r.total_amount || 0), 0),
        mobileSales: data.filter(r => r.payment_method === "mobile_banking").reduce((s, r) => s + (r.total_amount || 0), 0),
        totalPurchase,
        purchaseDue,
      });
    }
  };

  const fetchRecentSales = async () => {
    const { from, to } = getDateRange(quickFilter, customFrom, customTo);
    let q = supabase
      .from("pos_sales")
      .select("*")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false })
      .limit(10);

    if (paymentFilter !== "all") q = q.eq("payment_method", paymentFilter);

    const { data } = await q;
    if (data) setRecentSales(data);
  };

  const fetchRecentShifts = async () => {
    const { from, to } = getDateRange(quickFilter, customFrom, customTo);
    const { data } = await supabase
      .from("pos_shifts")
      .select("*")
      .gte("opened_at", from)
      .lte("opened_at", to)
      .order("opened_at", { ascending: false })
      .limit(5);
    if (data) setRecentShifts(data);
  };

  const resetFilters = () => {
    setQuickFilter("today");
    setPaymentFilter("all");
    setCustomFrom("");
    setCustomTo("");
  };

  const isFiltered = quickFilter !== "today" || paymentFilter !== "all";

  return (
    <POSLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">POS ড্যাশবোর্ড</h1>
            <p className="text-muted-foreground text-sm">
              {quickFilterLabels[quickFilter]} — বিক্রি সারসংক্ষেপ ও কার্যকলাপ
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {activeShift && (
              <Badge variant="default" className="gap-1 py-1.5 text-sm">
                <PlayCircle className="h-3.5 w-3.5" /> শিফট চলছে: {activeShift.shift_number}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
              <Filter className="h-4 w-4" /> ফিল্টার
              {isFiltered && <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">ON</Badge>}
            </Button>
            <Button asChild>
              <Link to="/pos/sell" className="gap-2">
                <ShoppingCart className="h-4 w-4" /> বিক্রি শুরু করুন <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end flex-wrap">
                <div className="space-y-1 min-w-[140px]">
                  <label className="text-xs font-medium text-muted-foreground">সময়কাল</label>
                  <Select value={quickFilter} onValueChange={(v) => setQuickFilter(v as QuickFilter)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(quickFilterLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {quickFilter === "custom" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">শুরু তারিখ</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                        <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-9 pl-8 w-[160px]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">শেষ তারিখ</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                        <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="h-9 pl-8 w-[160px]" />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1 min-w-[140px]">
                  <label className="text-xs font-medium text-muted-foreground">পেমেন্ট মেথড</label>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সব</SelectItem>
                      <SelectItem value="cash">নগদ</SelectItem>
                      <SelectItem value="mobile_banking">মোবাইল ব্যাংকিং</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isFiltered && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-destructive hover:text-destructive">
                    <X className="h-3.5 w-3.5" /> রিসেট
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards - Reference Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={<ShoppingCart className="h-6 w-6 text-white" />}
            iconBg="bg-[hsl(187,80%,55%)]"
            title="মোট বিক্রি"
            amount={todayStats.totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          />
          <StatCard
            icon={<FileText className="h-6 w-6 text-white" />}
            iconBg="bg-[hsl(40,85%,55%)]"
            title="ইনভয়েস বকেয়া"
            amount={todayStats.mobileSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          />
          <StatCard
            icon={<Banknote className="h-6 w-6 text-white" />}
            iconBg="bg-[hsl(200,75%,55%)]"
            title="মোট ক্রয়"
            amount={todayStats.totalPurchase.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            iconBg="bg-[hsl(350,75%,55%)]"
            title="ক্রয় বকেয়া"
            amount={todayStats.purchaseDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          />
          <StatCard
            icon={<RotateCcw className="h-6 w-6 text-white" />}
            iconBg="bg-[hsl(10,75%,55%)]"
            title="মোট ক্রয় রিটার্ন"
            amount="0.00"
            subtitle="ক্রয় রিটার্ন: ৳ 0.00"
            subtitle2="ক্রয় রিটার্ন পেইড: ৳ 0.00"
          />
          <StatCard
            icon={<ArrowLeftRight className="h-6 w-6 text-white" />}
            iconBg="bg-[hsl(340,75%,55%)]"
            title="মোট বিক্রি রিটার্ন"
            amount="0.00"
            subtitle="বিক্রি রিটার্ন: ৳ 0.00"
            subtitle2="বিক্রি রিটার্ন পেইড: ৳ 0.00"
          />
        </div>

        {/* Active Shift */}
        {activeShift && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <PlayCircle className="h-5 w-5 text-primary" /> চলমান শিফট
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">শিফট নং</p><p className="font-bold">{activeShift.shift_number}</p></div>
                <div><p className="text-muted-foreground text-xs">প্রারম্ভিক টাকা</p><p className="font-bold">৳{activeShift.opening_amount?.toLocaleString()}</p></div>
                <div><p className="text-muted-foreground text-xs">মোট বিক্রি</p><p className="font-bold text-primary">৳{activeShift.total_sales?.toLocaleString()}</p></div>
                <div><p className="text-muted-foreground text-xs">ট্রানজেকশন</p><p className="font-bold">{activeShift.total_transactions}</p></div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">সাম্প্রতিক বিক্রি</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/pos/history">সব দেখুন <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">রিসিপ্ট</TableHead>
                    <TableHead className="text-xs">পেমেন্ট</TableHead>
                    <TableHead className="text-xs text-right">মূল্য</TableHead>
                    <TableHead className="text-xs">সময়</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.slice(0, 5).map(sale => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs">{sale.sale_number}</TableCell>
                      <TableCell>
                        <Badge variant={sale.payment_method === "cash" ? "default" : "secondary"} className="text-[10px]">
                          {sale.payment_method === "cash" ? "নগদ" : "মোবাইল"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">৳{sale.total_amount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleTimeString("bn-BD")}</TableCell>
                    </TableRow>
                  ))}
                  {recentSales.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">কোনো বিক্রি নেই</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Shifts */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">সাম্প্রতিক শিফট</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/pos/shifts">সব দেখুন <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">শিফট</TableHead>
                    <TableHead className="text-xs">স্ট্যাটাস</TableHead>
                    <TableHead className="text-xs text-right">বিক্রি</TableHead>
                    <TableHead className="text-xs">তারিখ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentShifts.map(shift => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-mono text-xs">{shift.shift_number}</TableCell>
                      <TableCell>
                        <Badge variant={shift.status === "open" ? "default" : "secondary"} className="text-[10px]">
                          {shift.status === "open" ? "চলছে" : "বন্ধ"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">৳{shift.total_sales?.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(shift.opened_at).toLocaleDateString("bn-BD")}</TableCell>
                    </TableRow>
                  ))}
                  {recentShifts.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">কোনো শিফট নেই</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </POSLayout>
  );
}