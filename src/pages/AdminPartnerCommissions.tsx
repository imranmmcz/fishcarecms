import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["pending", "approved", "paid", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const AdminPartnerCommissions = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("partner_commissions")
      .select("*, partners(full_name, mobile)")
      .order("created_at", { ascending: false });
    setRows(data || []);
    setSelected(new Set());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows
    .filter((r) => r.status === tab)
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [r.code_used, r.partners?.full_name, r.partners?.mobile]
        .some((v) => v && String(v).toLowerCase().includes(q));
    }), [rows, tab, search]);

  const totals = useMemo(() => STATUSES.reduce((acc, s) => {
    acc[s] = rows.filter((r) => r.status === s).reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);
    return acc;
  }, {} as Record<Status, number>), [rows]);

  const bulk = async (status: Status) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const patch: any = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status === "paid") patch.paid_at = new Date().toISOString();
    const { error } = await (supabase as any).from("partner_commissions").update(patch).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} updated`);
    load();
  };

  const toggle = (id: string) => {
    setSelected((s) => {
      const ns = new Set(s);
      ns.has(id) ? ns.delete(id) : ns.add(id);
      return ns;
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">কমিশন ব্যবস্থাপনা</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUSES.map((s) => (
            <Card key={s}><CardContent className="p-4">
              <div className="text-xs text-muted-foreground capitalize">{s}</div>
              <div className="text-2xl font-bold">৳{totals[s].toFixed(2)}</div>
            </CardContent></Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as Status); setSelected(new Set()); }}>
            <TabsList>
              {STATUSES.map((s) => (
                <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 w-56" placeholder="পার্টনার, কোড..." value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
            {tab === "pending" && (
              <Button size="sm" disabled={selected.size === 0} onClick={() => bulk("approved")}>
                <CheckCircle2 className="h-4 w-4 mr-1" />অনুমোদন ({selected.size})
              </Button>
            )}
            {tab === "approved" && (
              <Button size="sm" disabled={selected.size === 0} onClick={() => bulk("paid")}>
                পেমেন্ট মার্ক ({selected.size})
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">কোনো কমিশন নেই</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="p-3 w-10"></th>
                      <th className="p-3">পার্টনার</th>
                      <th className="p-3 hidden sm:table-cell">কোড</th>
                      <th className="p-3 hidden md:table-cell">অর্ডার সাবটোটাল</th>
                      <th className="p-3">কমিশন</th>
                      <th className="p-3 hidden lg:table-cell">তারিখ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t hover:bg-muted/30">
                        <td className="p-3">
                          <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{r.partners?.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{r.partners?.mobile}</div>
                        </td>
                        <td className="p-3 hidden sm:table-cell font-mono">{r.code_used}</td>
                        <td className="p-3 hidden md:table-cell">৳{Number(r.order_subtotal).toFixed(2)}</td>
                        <td className="p-3 font-semibold text-primary">৳{Number(r.commission_amount).toFixed(2)}</td>
                        <td className="p-3 hidden lg:table-cell">
                          {new Date(r.created_at).toLocaleDateString("bn-BD")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPartnerCommissions;