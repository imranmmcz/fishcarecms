import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, CreditCard, Banknote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function POSSalesReport() {
  const { data: sales = [] } = useQuery({
    queryKey: ["pos-sales-report"],
    queryFn: async () => {
      const { data } = await supabase.from("pos_sales").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const totalSales = sales.reduce((s, r) => s + (r.total_amount || 0), 0);
  const cashSales = sales.filter(s => s.payment_method === "cash").reduce((s, r) => s + (r.total_amount || 0), 0);
  const mobileSales = sales.filter(s => s.payment_method === "mobile_banking").reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalDiscount = sales.reduce((s, r) => s + (r.discount_amount || 0), 0);

  const stats = [
    { title: "মোট বিক্রি", value: `৳${totalSales.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
    { title: "নগদ বিক্রি", value: `৳${cashSales.toLocaleString()}`, icon: Banknote, color: "text-green-400" },
    { title: "মোবাইল ব্যাংকিং", value: `৳${mobileSales.toLocaleString()}`, icon: CreditCard, color: "text-blue-400" },
    { title: "মোট ডিসকাউন্ট", value: `৳${totalDiscount.toLocaleString()}`, icon: FileText, color: "text-orange-400" },
  ];

  return (
    <POSLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" /> বিক্রি রিপোর্ট
          </h1>
          <p className="text-muted-foreground text-sm">সকল বিক্রির সামগ্রিক রিপোর্ট</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(s => (
            <Card key={s.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} /> {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">মোট ট্রানজেকশন: {sales.length}</CardTitle></CardHeader>
        </Card>
      </div>
    </POSLayout>
  );
}
