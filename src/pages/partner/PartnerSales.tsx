import { useEffect, useState } from "react";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePartner } from "@/hooks/usePartner";
import { Loader2 } from "lucide-react";

export default function PartnerSales() {
  const { partner } = usePartner();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partner) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any).from("orders")
        .select("id, order_number, customer_name, total_amount, status, referral_code, referral_discount, created_at")
        .eq("partner_id", partner.id).order("created_at", { ascending: false });
      setRows(data || []); setLoading(false);
    })();
  }, [partner?.id]);

  return (
    <PartnerLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">রেফারাল সেলস</h1>
        <Card><CardContent className="p-0">
          {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
          : rows.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">কোনো অর্ডার নেই</div>
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr><th className="p-3">অর্ডার</th><th className="p-3 hidden sm:table-cell">কাস্টমার</th><th className="p-3">টোটাল</th><th className="p-3 hidden md:table-cell">কোড</th><th className="p-3">স্ট্যাটাস</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-mono">{r.order_number}</td>
                    <td className="p-3 hidden sm:table-cell">{r.customer_name}</td>
                    <td className="p-3">৳{Number(r.total_amount).toFixed(2)}</td>
                    <td className="p-3 hidden md:table-cell font-mono">{r.referral_code}</td>
                    <td className="p-3"><Badge variant="secondary" className="capitalize">{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
        </CardContent></Card>
      </div>
    </PartnerLayout>
  );
}