import { useState, useEffect } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DollarSign, ShoppingCart, TrendingUp, Clock, PlayCircle, ArrowRight,
  Banknote, Smartphone, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export default function POSDashboard() {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<any>(null);
  const [todayStats, setTodayStats] = useState({ totalSales: 0, totalTransactions: 0, cashSales: 0, mobileSales: 0 });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentShifts, setRecentShifts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchActiveShift();
      fetchTodayStats();
      fetchRecentSales();
      fetchRecentShifts();
    }
  }, [user]);

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

  const fetchTodayStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("pos_sales")
      .select("total_amount, payment_method")
      .gte("created_at", today + "T00:00:00")
      .lte("created_at", today + "T23:59:59");
    if (data) {
      setTodayStats({
        totalSales: data.reduce((s, r) => s + (r.total_amount || 0), 0),
        totalTransactions: data.length,
        cashSales: data.filter(r => r.payment_method === "cash").reduce((s, r) => s + (r.total_amount || 0), 0),
        mobileSales: data.filter(r => r.payment_method === "mobile_banking").reduce((s, r) => s + (r.total_amount || 0), 0),
      });
    }
  };

  const fetchRecentSales = async () => {
    const { data } = await supabase
      .from("pos_sales")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setRecentSales(data);
  };

  const fetchRecentShifts = async () => {
    const { data } = await supabase
      .from("pos_shifts")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(5);
    if (data) setRecentShifts(data);
  };

  return (
    <POSLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">POS ড্যাশবোর্ড</h1>
            <p className="text-muted-foreground text-sm">আজকের বিক্রি সারসংক্ষেপ ও কার্যকলাপ</p>
          </div>
          <div className="flex gap-2">
            {activeShift ? (
              <Badge variant="default" className="gap-1 py-1.5 text-sm">
                <PlayCircle className="h-3.5 w-3.5" /> শিফট চলছে: {activeShift.shift_number}
              </Badge>
            ) : null}
            <Button asChild>
              <Link to="/pos/sell" className="gap-2">
                <ShoppingCart className="h-4 w-4" /> বিক্রি শুরু করুন <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Today Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">আজকের বিক্রি</p>
                  <p className="text-xl font-bold">৳{todayStats.totalSales.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ট্রানজেকশন</p>
                  <p className="text-xl font-bold">{todayStats.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-500/10">
                  <Banknote className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">নগদ বিক্রি</p>
                  <p className="text-xl font-bold">৳{todayStats.cashSales.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10">
                  <Smartphone className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">মোবাইল বিক্রি</p>
                  <p className="text-xl font-bold">৳{todayStats.mobileSales.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Shift Info */}
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
