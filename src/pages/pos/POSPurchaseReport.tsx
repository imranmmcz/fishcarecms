import { useState } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ShoppingBag, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function POSPurchaseReport() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["pos-purchase-report"],
    queryFn: async () => {
      const { data: orders } = await supabase.from("purchase_orders").select("total_amount, status, created_at");
      const all = orders || [];
      const totalAmount = all.reduce((s, o) => s + (o.total_amount || 0), 0);
      const received = all.filter(o => o.status === "received");
      const receivedAmount = received.reduce((s, o) => s + (o.total_amount || 0), 0);
      const pending = all.filter(o => o.status === "pending");
      const pendingAmount = pending.reduce((s, o) => s + (o.total_amount || 0), 0);
      return {
        totalOrders: all.length,
        totalAmount,
        receivedCount: received.length,
        receivedAmount,
        pendingCount: pending.length,
        pendingAmount,
      };
    },
  });

  const cards = [
    { title: "মোট ক্রয় অর্ডার", value: stats?.totalOrders || 0, amount: stats?.totalAmount || 0, icon: ShoppingBag, color: "text-emerald-500" },
    { title: "গৃহীত অর্ডার", value: stats?.receivedCount || 0, amount: stats?.receivedAmount || 0, icon: TrendingUp, color: "text-blue-500" },
    { title: "অপেক্ষমান অর্ডার", value: stats?.pendingCount || 0, amount: stats?.pendingAmount || 0, icon: Clock, color: "text-orange-500" },
  ];

  return (
    <POSLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-500" /> ক্রয় রিপোর্ট
          </h1>
          <p className="text-muted-foreground text-sm">ক্রয় সম্পর্কিত সারসংক্ষেপ</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">লোড হচ্ছে...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {cards.map(card => (
              <Card key={card.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <card.icon className={`h-8 w-8 ${card.color}`} />
                    <div>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold">{card.value}</p>
                      <p className="text-sm font-semibold text-emerald-600">৳ {card.amount.toLocaleString("en-IN")}</p>
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
