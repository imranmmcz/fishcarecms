import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Search, CheckCircle2, XCircle, Eye, Handshake } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["pending", "approved", "rejected", "suspended"] as const;
type Status = (typeof STATUSES)[number];

const AdminPartners = () => {
  const { user } = useAuth();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Status>("pending");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<any>(null);
  const [rejectFor, setRejectFor] = useState<any>(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("partners").select("*").order("created_at", { ascending: false });
    setPartners(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const ensurePartnerRole = async (uid: string) => {
    await (supabase as any).from("user_roles")
      .upsert({ user_id: uid, role: "partner" }, { onConflict: "user_id,role", ignoreDuplicates: true });
  };

  const approve = async (p: any) => {
    const { error } = await (supabase as any).from("partners").update({
      status: "approved", approved_at: new Date().toISOString(), approved_by: user?.id, rejection_reason: null,
    }).eq("id", p.id);
    if (error) return toast.error(error.message);
    await ensurePartnerRole(p.user_id);
    // Auto-generate a referral code on first approval
    const { data: existing } = await (supabase as any)
      .from("partner_referral_codes").select("id").eq("partner_id", p.id).limit(1);
    if (!existing?.length) {
      const code = (p.full_name?.split(" ")[0] || "P").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
        + Math.floor(1000 + Math.random() * 9000);
      await (supabase as any).from("partner_referral_codes").insert({
        partner_id: p.id, code, discount_type: "percentage", discount_value: 5,
        commission_type: "percentage", commission_value: 5, is_active: true,
      });
    }
    toast.success("Partner approved");
    load();
  };

  const updateStatus = async (id: string, status: Status, rejection_reason?: string) => {
    const { error } = await (supabase as any).from("partners")
      .update({ status, rejection_reason: rejection_reason || null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  };

  const filtered = partners
    .filter((p) => p.status === tab)
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [p.full_name, p.mobile, p.email, p.district].some(
        (v) => v && String(v).toLowerCase().includes(q)
      );
    });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Handshake className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">পার্টনার ম্যানেজমেন্ট</h1>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="নাম, মোবাইল, ইমেইল..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            {STATUSES.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">
                {s} ({partners.filter((p) => p.status === s).length})
              </TabsTrigger>
            ))}
          </TabsList>

          {STATUSES.map((s) => (
            <TabsContent key={s} value={s}>
              <Card>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
                  ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">কোনো পার্টনার নেই</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="text-left">
                            <th className="p-3">নাম</th>
                            <th className="p-3 hidden sm:table-cell">মোবাইল</th>
                            <th className="p-3 hidden md:table-cell">জেলা</th>
                            <th className="p-3 hidden lg:table-cell">আবেদনের তারিখ</th>
                            <th className="p-3 text-right">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((p) => (
                            <tr key={p.id} className="border-t hover:bg-muted/30">
                              <td className="p-3">
                                <div className="font-medium">{p.full_name}</div>
                                <div className="text-xs text-muted-foreground sm:hidden">{p.mobile}</div>
                              </td>
                              <td className="p-3 hidden sm:table-cell">{p.mobile}</td>
                              <td className="p-3 hidden md:table-cell">{p.district || "—"}</td>
                              <td className="p-3 hidden lg:table-cell">
                                {new Date(p.created_at).toLocaleDateString("bn-BD")}
                              </td>
                              <td className="p-3 text-right">
                                <div className="inline-flex flex-wrap justify-end gap-1">
                                  <Button size="sm" variant="outline" onClick={() => setViewing(p)}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  {s === "pending" && (
                                    <>
                                      <Button size="sm" onClick={() => approve(p)}>
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />অনুমোদন
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => { setRejectFor(p); setReason(""); }}>
                                        <XCircle className="h-3.5 w-3.5 mr-1" />প্রত্যাখ্যান
                                      </Button>
                                    </>
                                  )}
                                  {s === "approved" && (
                                    <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "suspended")}>
                                      স্থগিত
                                    </Button>
                                  )}
                                  {(s === "suspended" || s === "rejected") && (
                                    <Button size="sm" onClick={() => approve(p)}>পুনরায় অনুমোদন</Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewing?.full_name}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ["মোবাইল", viewing.mobile], ["WhatsApp", viewing.whatsapp],
                ["Email", viewing.email], ["NID", viewing.nid_number],
                ["জন্ম তারিখ", viewing.date_of_birth],
                ["পিতা", viewing.father_name], ["মাতা", viewing.mother_name],
                ["ঠিকানা", viewing.address], ["জেলা/উপজেলা", `${viewing.district || ""} ${viewing.upazila || ""}`],
                ["কোম্পানি", viewing.company_name], ["bKash", viewing.bkash_number],
                ["Nagad", viewing.nagad_number], ["ব্যাংক", viewing.bank_name],
                ["অ্যাকাউন্ট", viewing.account_number],
                ["অভিজ্ঞতা", viewing.experience], ["নোট", viewing.notes],
              ].map(([k, v]) => v ? (
                <div key={k as string}>
                  <div className="text-xs text-muted-foreground">{k}</div>
                  <div>{v as string}</div>
                </div>
              ) : null)}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>প্রত্যাখ্যানের কারণ</DialogTitle></DialogHeader>
          <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="কারণ লিখুন..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={async () => {
              if (rejectFor) { await updateStatus(rejectFor.id, "rejected", reason); setRejectFor(null); }
            }}>প্রত্যাখ্যান করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPartners;