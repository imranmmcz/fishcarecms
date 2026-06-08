import { useEffect, useState } from "react";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { usePartner } from "@/hooks/usePartner";
import { Wallet, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const MIN_WITHDRAW = 500;

export default function PartnerWallet() {
  const { partner } = usePartner();
  const [wallet, setWallet] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", method: "bkash", account_number: "", account_name: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!partner) return;
    setLoading(true);
    const [{ data: w }, { data: wd }] = await Promise.all([
      (supabase as any).from("partner_wallets").select("*").eq("partner_id", partner.id).maybeSingle(),
      (supabase as any).from("partner_withdrawals").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false }),
    ]);
    setWallet(w); setWithdrawals(wd || []); setLoading(false);
  };

  useEffect(() => { load(); }, [partner?.id]);

  useEffect(() => {
    if (!partner) return;
    const channel = (supabase as any)
      .channel(`partner-wallet-${partner.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_wallets", filter: `partner_id=eq.${partner.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_withdrawals", filter: `partner_id=eq.${partner.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_commissions", filter: `partner_id=eq.${partner.id}` }, () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [partner?.id]);

  useEffect(() => {
    if (open && partner) {
      setForm((f) => ({
        ...f,
        account_number: partner.bkash_number || partner.account_number || "",
        account_name: partner.account_name || partner.full_name || "",
      }));
    }
  }, [open, partner?.id]);

  const submit = async () => {
    if (!partner) return;
    const amount = Number(form.amount);
    if (!amount || amount < MIN_WITHDRAW) return toast.error(`সর্বনিম্ন ৳${MIN_WITHDRAW}`);
    if (amount > Number(wallet?.available_balance || 0)) return toast.error("অপর্যাপ্ত ব্যালেন্স");
    if (!form.account_number) return toast.error("অ্যাকাউন্ট নম্বর দিন");
    setSubmitting(true);
    const { error } = await (supabase as any).from("partner_withdrawals").insert({
      partner_id: partner.id, amount, method: form.method,
      account_number: form.account_number, account_name: form.account_name, status: "pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("উইথড্রয়াল অনুরোধ জমা হয়েছে");
    setOpen(false); setForm({ amount: "", method: "bkash", account_number: "", account_name: "" });
    load();
  };

  const cancel = async (id: string) => {
    const { error } = await (supabase as any).from("partner_withdrawals")
      .update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("বাতিল করা হয়েছে"); load();
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
    <PartnerLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" />ওয়ালেট</h1>
          <Button onClick={() => setOpen(true)} disabled={!wallet || Number(wallet.available_balance) < MIN_WITHDRAW}>
            <Plus className="h-4 w-4 mr-1" />উইথড্র অনুরোধ
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "উপলব্ধ", v: wallet?.available_balance, c: "text-emerald-600" },
            { label: "পেন্ডিং কমিশন", v: wallet?.pending_balance, c: "text-amber-600" },
            { label: "মোট আয়", v: wallet?.total_earned, c: "text-primary" },
            { label: "মোট উত্তোলন", v: wallet?.total_paid, c: "text-blue-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className={`text-xl font-bold mt-1 ${s.c}`}>৳{Number(s.v || 0).toFixed(2)}</div>
            </CardContent></Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">উইথড্রয়াল ইতিহাস</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
            : withdrawals.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">কোনো উইথড্রয়াল নেই</div>
            : <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr><th className="p-3">তারিখ</th><th className="p-3">পরিমাণ</th><th className="p-3 hidden sm:table-cell">মাধ্যম</th><th className="p-3 hidden md:table-cell">অ্যাকাউন্ট</th><th className="p-3">স্ট্যাটাস</th><th className="p-3"></th></tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-t">
                      <td className="p-3 whitespace-nowrap">{new Date(w.created_at).toLocaleDateString("bn-BD")}</td>
                      <td className="p-3 font-semibold">৳{Number(w.amount).toFixed(2)}</td>
                      <td className="p-3 hidden sm:table-cell capitalize">{w.method}</td>
                      <td className="p-3 hidden md:table-cell font-mono text-xs">{w.account_number}</td>
                      <td className="p-3">{badge(w.status)}{w.admin_notes && <div className="text-[10px] text-muted-foreground mt-1">{w.admin_notes}</div>}</td>
                      <td className="p-3">{w.status === "pending" && <Button size="sm" variant="ghost" onClick={() => cancel(w.id)}>বাতিল</Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>উইথড্র অনুরোধ</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>পরিমাণ (৳)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder={`সর্বনিম্ন ${MIN_WITHDRAW}`} />
              <div className="text-xs text-muted-foreground mt-1">উপলব্ধ: ৳{Number(wallet?.available_balance || 0).toFixed(2)}</div>
            </div>
            <div>
              <Label>মাধ্যম</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="nagad">Nagad</SelectItem>
                  <SelectItem value="rocket">Rocket</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>অ্যাকাউন্ট নম্বর</Label><Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></div>
            <div><Label>অ্যাকাউন্ট নাম</Label><Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>বাতিল</Button>
            <Button onClick={submit} disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}জমা দিন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PartnerLayout>
  );
}