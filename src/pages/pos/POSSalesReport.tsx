import { useState, useMemo } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, CreditCard, Banknote, Filter, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const getDateRange = (period: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case "today": return { from: today.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
    case "week": {
      const start = new Date(today);
      start.setDate(start.getDate() - start.getDay());
      return { from: start.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
    }
    case "month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: start.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
    }
    default: return { from: "", to: "" };
  }
};

export default function POSSalesReport() {
  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [status, setStatus] = useState("all");

  const handlePeriod = (p: string) => {
    setPeriod(p);
    if (p === "custom" || p === "all") {
      if (p === "all") { setDateFrom(""); setDateTo(""); }
    } else {
      const r = getDateRange(p);
      setDateFrom(r.from);
      setDateTo(r.to);
    }
  };

  const { data: sales = [] } = useQuery({
    queryKey: ["pos-sales-report"],
    queryFn: async () => {
      const { data } = await supabase.from("pos_sales").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    return sales.filter(s => {
      if (dateFrom && new Date(s.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(s.created_at) > new Date(dateTo + "T23:59:59")) return false;
      if (paymentMethod !== "all" && s.payment_method !== paymentMethod) return false;
      if (status !== "all" && s.status !== status) return false;
      return true;
    });
  }, [sales, dateFrom, dateTo, paymentMethod, status]);

  const totalSales = filtered.reduce((s, r) => s + (r.total_amount || 0), 0);
  const cashSales = filtered.filter(s => s.payment_method === "cash").reduce((s, r) => s + (r.total_amount || 0), 0);
  const mobileSales = filtered.filter(s => s.payment_method === "mobile_banking").reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalDiscount = filtered.reduce((s, r) => s + (r.discount_amount || 0), 0);

  const stats = [
    { title: "মোট বিক্রি", value: `৳${totalSales.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
    { title: "ক্যাশ বিক্রি", value: `৳${cashSales.toLocaleString()}`, icon: Banknote, color: "text-green-400" },
    { title: "মোবাইল ব্যাংকিং", value: `৳${mobileSales.toLocaleString()}`, icon: CreditCard, color: "text-blue-400" },
    { title: "মোট ডিসকাউন্ট", value: `৳${totalDiscount.toLocaleString()}`, icon: FileText, color: "text-orange-400" },
  ];

  const periods = [
    { value: "all", label: "সকল" },
    { value: "today", label: "আজ" },
    { value: "week", label: "এই সপ্তাহ" },
    { value: "month", label: "এই মাস" },
    { value: "custom", label: "কাস্টম" },
  ];

  return (
    <POSLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6" /> বিক্রি রিপোর্ট
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">সকল বিক্রির সামগ্রিক রিপোর্ট</p>
        </div>

        <Card>
          <CardHeader className="pb-3 px-3 sm:px-6">
            <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> ফিল্টার</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-3 sm:px-6">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {periods.map(p => (
                <Button
                  key={p.value}
                  size="sm"
                  variant={period === p.value ? "default" : "outline"}
                  onClick={() => handlePeriod(p.value)}
                  className="text-[10px] sm:text-xs px-2 sm:px-3 h-7 sm:h-8"
                >
                  <Calendar className="h-3 w-3 mr-1 hidden sm:inline" />
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">শুরুর তারিখ</Label>
                <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPeriod("custom"); }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">শেষ তারিখ</Label>
                <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPeriod("custom"); }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">পেমেন্ট মেথড</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল</SelectItem>
                    <SelectItem value="cash">ক্যাশ</SelectItem>
                    <SelectItem value="mobile_banking">মোবাইল ব্যাংকিং</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">স্ট্যাটাস</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল</SelectItem>
                    <SelectItem value="completed">সম্পন্ন</SelectItem>
                    <SelectItem value="refunded">রিফান্ড</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {stats.map(s => (
            <Card key={s.title}>
              <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
                <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                  <s.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${s.color}`} /> {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <p className="text-base sm:text-2xl font-bold truncate">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">মোট ট্রানজেকশন: {filtered.length}</CardTitle></CardHeader>
        </Card>
      </div>
    </POSLayout>
  );
}
