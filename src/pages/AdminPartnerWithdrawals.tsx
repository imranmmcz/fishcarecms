import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Wallet, Search, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["pending", "processing", "paid", "rejected", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

export default function AdminPartnerWithdrawals() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<{ row: any; action: "approve" | "reject" | "paid" } | null>(null);
  const [txn, setTxn] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("partner_withdrawals")
      .select("*, partners(full_name, mobile)").order("created_at", { ascending: false });
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => r.status === tab).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [r.partners?.full_name, r.partners?.mobile, r.account_number].some((v) => v && String(v).toLowerCase().includes(q));
  }), [rows, tab, search]);

  const totals = useMemo(() => STATUSES.reduce((acc, s) => {
    acc[s] = rows.filter((r) => r.status === s).reduce((a, r) => a + Number(r.amount || 0), 0);
    return acc;
  }, {} as Record<Status, number>), [rows]);

  const apply = async () => {
    if (!acting) return;
    const patch: any = { admin_notes: notes || null, processed_by: user?.id, processed_at: new Date().toISOString() };
    if (acting.action === "approve") patch.status = "processing";
    if (acting.action === "reject") patch.status = "rejected";
    if (acting.action === "paid") { patch.status = "paid"; patch.transaction_id = txn || null; }
    const { error } = await (supabase as any).from("partner_withdrawals").update(patch).eq("id", acting.row.id);
    if (error) return toast.error(error.message);
    toast.success("আপডেট হয়েছে");
    setActing(null); setTxn(""); setNotes(""); load();
  };

  const badge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700", processing: "bg-blue-100 text-blue-700",
      paid: "bg-emerald-100 text-emerald-700", rejected: "bg-rose-100 text-rose-700",
      cancelled: "bg-muted text-muted-foreground",
    };
    return <Badge className={`${map[s] || ""} capitalize`} variant="secondary">{s}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3"><Wallet className="h-6 w-6 text-primary" /><h1 className="text-2xl font-bold">উইথড্রয়াল রিকোয়েস্ট</h1></div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STATUSES.map((s) => (
            <Card key={s}><CardContent className="p-4">
              <div className="text-xs text-muted-foreground capitalize">{s}</div>
              <div className="text-xl font-bold">৳{totals[s].toFixed(2)}</div>
            </CardContent></Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
            <TabsList className="flex-wrap h-auto">
              {STATUSES.map((s) => <TabsTrigger key={s} value={s} className="capitalize">{s}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="পার্টনার, অ্যাকাউন্ট..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <Card><CardContent className="p-0">
          {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
          : filtered.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">কোনো রিকোয়েস্ট নেই</div>
          : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr><th className="p-3">পার্টনার</th><th className="p-3">পরিমাণ</th><th className="p-3 hidden sm:table-cell">মাধ্যম</th><th className="p-3 hidden md:table-cell">অ্যাকাউন্ট</th><th className="p-3">স্ট্যাটাস</th><th className="p-3 text-right">অ্যাকশন</th></tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{r.partners?.full_name}</div>
                      <div className="text-xs text-muted-foreground">{r.partners?.mobile}</div>
                    </td>
                    <td className="p-3 font-semibold">৳{Number(r.amount).toFixed(2)}</td>
                    <td className="p-3 hidden sm:table-cell capitalize">{r.method}</td>
                    <td className="p-3 hidden md:table-cell">
                      <div className="font-mono text-xs">{r.account_number}</div>
                      <div className="text-[10px] text-muted-foreground">{r.account_name}</div>
                    </td>
                    <td className="p-3">{badge(r.status)}</td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      {tab === "pending" && (<>
                        <Button size="sm" onClick={() => { setActing({ row: r, action: "approve" }); }}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />অনুমোদন</Button>
                        <Button size="sm" variant="destructive" onClick={() => { setActing({ row: r, action: "reject" }); }}><XCircle className="h-3.5 w-3.5 mr-1" />প্রত্যাখ্যান</Button>
                      </>)}
                      {tab === "processing" && (
                        <Button size="sm" onClick={() => { setActing({ row: r, action: "paid" }); }}>পেমেন্ট মার্ক</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
        </CardContent></Card>
      </div>

      <Dialog open={!!acting} onOpenChange={(o) => !o && setActing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>
            {acting?.action === "approve" && "অনুমোদন (প্রসেসিং)"}
            {acting?.action === "reject" && "প্রত্যাখ্যান"}
            {acting?.action === "paid" && "পেমেন্ট মার্ক"}
          </DialogTitle></DialogHeader>
          <div className="space-y-3">
            {acting?.action === "paid" && (
              <div><Label>ট্রানজ্যাকশন আইডি</Label><Input value={txn} onChange={(e) => setTxn(e.target.value)} /></div>
            )}
            <div><Label>অ্যাডমিন নোট</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActing(null)}>বাতিল</Button>
            <Button onClick={apply}>নিশ্চিত করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}