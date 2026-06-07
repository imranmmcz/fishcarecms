import { useEffect, useState } from "react";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { usePartner } from "@/hooks/usePartner";
import { Loader2 } from "lucide-react";

const STATUSES = ["all", "pending", "approved", "paid", "cancelled"] as const;

export default function PartnerCommissions() {
  const { partner } = usePartner();
  const [rows, setRows] = useState<any[]>([]);
  const [tab, setTab] = useState<(typeof STATUSES)[number]>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partner) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any).from("partner_commissions")
        .select("*").eq("partner_id", partner.id).order("created_at", { ascending: false });
      setRows(data || []); setLoading(false);
    })();
  }, [partner?.id]);

  const filtered = tab === "all" ? rows : rows.filter((r) => r.status === tab);

  const badge = (s: string) => {
    const map: Record<string, string> = { pending: "bg-amber-100 text-amber-700", approved: "bg-blue-100 text-blue-700", paid: "bg-emerald-100 text-emerald-700", cancelled: "bg-rose-100 text-rose-700" };
    return <Badge className={`${map[s] || ""} capitalize`} variant="secondary">{s}</Badge>;
  };

  return (
    <PartnerLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">কমিশন</h1>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="flex-wrap h-auto">
            {STATUSES.map((s) => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <Card><CardContent className="p-0">
          {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
          : filtered.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">কোনো কমিশন নেই</div>
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr><th className="p-3">কোড</th><th className="p-3 hidden sm:table-cell">সাবটোটাল</th><th className="p-3 hidden md:table-cell">ডিসকাউন্ট</th><th className="p-3">কমিশন</th><th className="p-3">স্ট্যাটাস</th><th className="p-3 hidden lg:table-cell">তারিখ</th></tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-mono">{r.code_used}</td>
                    <td className="p-3 hidden sm:table-cell">৳{Number(r.order_subtotal).toFixed(2)}</td>
                    <td className="p-3 hidden md:table-cell">৳{Number(r.discount_amount).toFixed(2)}</td>
                    <td className="p-3 font-semibold text-primary">৳{Number(r.commission_amount).toFixed(2)}</td>
                    <td className="p-3">{badge(r.status)}</td>
                    <td className="p-3 hidden lg:table-cell">{new Date(r.created_at).toLocaleDateString("bn-BD")}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
        </CardContent></Card>
      </div>
    </PartnerLayout>
  );
}