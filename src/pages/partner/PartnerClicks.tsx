import { useEffect, useState } from "react";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { usePartner } from "@/hooks/usePartner";
import { Loader2 } from "lucide-react";

export default function PartnerClicks() {
  const { partner } = usePartner();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partner) return;
    (async () => {
      setLoading(true);
      const { data: codes } = await (supabase as any).from("partner_referral_codes").select("code").eq("partner_id", partner.id);
      const codeList = (codes || []).map((c: any) => c.code);
      if (codeList.length === 0) { setRows([]); setLoading(false); return; }
      const { data } = await (supabase as any).from("partner_referral_clicks")
        .select("*").in("code", codeList).order("clicked_at", { ascending: false }).limit(500);
      setRows(data || []); setLoading(false);
    })();
  }, [partner?.id]);

  return (
    <PartnerLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">রেফারাল ক্লিক</h1>
        <Card><CardContent className="p-0">
          {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
          : rows.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">কোনো ক্লিক রেকর্ড নেই</div>
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr><th className="p-3">কোড</th><th className="p-3 hidden sm:table-cell">রেফারার</th><th className="p-3 hidden md:table-cell">ল্যান্ডিং</th><th className="p-3">সময়</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-mono">{r.code}</td>
                    <td className="p-3 hidden sm:table-cell truncate max-w-[200px]">{r.referrer || "—"}</td>
                    <td className="p-3 hidden md:table-cell truncate max-w-[260px]">{r.landing_url || "—"}</td>
                    <td className="p-3 whitespace-nowrap">{new Date(r.clicked_at).toLocaleString("bn-BD")}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
        </CardContent></Card>
      </div>
    </PartnerLayout>
  );
}