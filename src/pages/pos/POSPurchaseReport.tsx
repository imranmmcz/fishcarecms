import { useState, useMemo } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, ShoppingBag, TrendingUp, Clock, Filter, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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

export default function POSPurchaseReport() {
  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["pos-purchase-report"],
    queryFn: async () => {
      const { data } = await supabase.from("purchase_orders").select("total_amount, status, created_at, order_date");
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const d = o.order_date || o.created_at;
      if (dateFrom && new Date(d) < new Date(dateFrom)) return false;
      if (dateTo && new Date(d) > new Date(dateTo + "T23:59:59")) return false;
      if (status !== "all" && o.status !== status) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo, status]);

  const totalAmount = filtered.reduce((s, o) => s + (o.total_amount || 0), 0);
  const received = filtered.filter(o => o.status === "received");
  const receivedAmount = received.reduce((s, o) => s + (o.total_amount || 0), 0);
  const pending = filtered.filter(o => o.status === "pending");
  const pendingAmount = pending.reduce((s, o) => s + (o.total_amount || 0), 0);

  const cards = [
    { title: "মোট ক্রয় অর্ডার", value: filtered.length, amount: totalAmount, icon: ShoppingBag, color: "text-emerald-500" },
    { title: "গৃহীত অর্ডার", value: received.length, amount: receivedAmount, icon: TrendingUp, color: "text-blue-500" },
    { title: "অপেক্ষমান অর্ডার", value: pending.length, amount: pendingAmount, icon: Clock, color: "text-orange-500" },
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
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" /> ক্রয় রিপোর্ট
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">ক্রয় সম্পর্কিত সারসংক্ষেপ</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">শুরুর তারিখ</Label>
                <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPeriod("custom"); }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">শেষ তারিখ</Label>
                <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPeriod("custom"); }} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">স্ট্যাটাস</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল</SelectItem>
                    <SelectItem value="pending">অপেক্ষমান</SelectItem>
                    <SelectItem value="ordered">অর্ডারকৃত</SelectItem>
                    <SelectItem value="received">গৃহীত</SelectItem>
                    <SelectItem value="cancelled">বাতিল</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">লোড হচ্ছে...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {cards.map(card => (
              <Card key={card.title}>
                <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                  <div className="flex items-center gap-3">
                    <card.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${card.color} shrink-0`} />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground">{card.title}</p>
                      <p className="text-xl sm:text-2xl font-bold">{card.value}</p>
                      <p className="text-xs sm:text-sm font-semibold text-emerald-600">৳ {card.amount.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </POSLayout>
  );
}
