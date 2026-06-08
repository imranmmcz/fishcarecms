import { useEffect, useState } from "react";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { usePartner } from "@/hooks/usePartner";
import { DollarSign, Wallet, ShoppingBag, MousePointerClick, Clock, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function PartnerDashboard() {
  const { partner } = usePartner();
  const [stats, setStats] = useState({ clicks: 0, sales: 0, pending: 0, approved: 0, paid: 0, available: 0 });
  const [chart, setChart] = useState<{ date: string; commission: number }[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  const load = async () => {
    if (!partner) return;
      const [{ data: commissions }, { data: wallet }, { count: clickCount }, { count: salesCount }] = await Promise.all([
        (supabase as any).from("partner_commissions").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false }),
        (supabase as any).from("partner_wallets").select("*").eq("partner_id", partner.id).maybeSingle(),
        (supabase as any).from("partner_referral_clicks").select("*", { count: "exact", head: true })
          .in("code", (await (supabase as any).from("partner_referral_codes").select("code").eq("partner_id", partner.id)).data?.map((c: any) => c.code) || ["___none___"]),
        (supabase as any).from("orders").select("*", { count: "exact", head: true }).eq("partner_id", partner.id),
      ]);
      const sum = (s: string) => (commissions || []).filter((c: any) => c.status === s).reduce((a: number, c: any) => a + Number(c.commission_amount || 0), 0);
      setStats({
        clicks: clickCount || 0,
        sales: salesCount || 0,
        pending: sum("pending"),
        approved: sum("approved"),
        paid: sum("paid"),
        available: Number(wallet?.available_balance || 0),
      });
      // chart: last 30 days
      const map = new Map<string, number>();
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        map.set(d.toISOString().slice(0, 10), 0);
      }
      (commissions || []).forEach((c: any) => {
        const k = String(c.created_at).slice(0, 10);
        if (map.has(k)) map.set(k, (map.get(k) || 0) + Number(c.commission_amount || 0));
      });
      setChart(Array.from(map.entries()).map(([date, commission]) => ({ date: date.slice(5), commission })));
      setRecent((commissions || []).slice(0, 5));
  };

  useEffect(() => { load(); }, [partner?.id]);

  useEffect(() => {
    if (!partner) return;
    const channel = (supabase as any)
      .channel(`partner-dashboard-${partner.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_wallets", filter: `partner_id=eq.${partner.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_commissions", filter: `partner_id=eq.${partner.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_withdrawals", filter: `partner_id=eq.${partner.id}` }, () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [partner?.id]);

  const cards = [
    { label: "উপলব্ধ ব্যালেন্স", value: stats.available, icon: Wallet, color: "text-emerald-600" },
    { label: "পেন্ডিং কমিশন", value: stats.pending, icon: Clock, color: "text-amber-600" },
    { label: "অনুমোদিত", value: stats.approved, icon: TrendingUp, color: "text-blue-600" },
    { label: "প্রদত্ত", value: stats.paid, icon: DollarSign, color: "text-primary" },
  ];

  return (
    <PartnerLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">স্বাগতম, {partner?.full_name}</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((c) => (
            <Card key={c.label}><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <div className="text-xl font-bold mt-1">৳{c.value.toFixed(2)}</div>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">মোট ক্লিক</div>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">{stats.clicks}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">রেফারাল অর্ডার</div>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mt-1">{stats.sales}</div>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">৩০ দিনের কমিশন</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="commission" stroke="hsl(var(--primary))" fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">সাম্প্রতিক কমিশন</CardTitle></CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">এখনো কোনো কমিশন নেই</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr><th className="p-2">কোড</th><th className="p-2">পরিমাণ</th><th className="p-2">স্ট্যাটাস</th><th className="p-2">তারিখ</th></tr>
                  </thead>
                  <tbody>
                    {recent.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-2 font-mono">{r.code_used}</td>
                        <td className="p-2">৳{Number(r.commission_amount).toFixed(2)}</td>
                        <td className="p-2 capitalize">{r.status}</td>
                        <td className="p-2">{new Date(r.created_at).toLocaleDateString("bn-BD")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}