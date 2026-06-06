import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Copy, Ticket } from "lucide-react";
import { toast } from "sonner";

const blank = {
  partner_id: "", code: "", discount_type: "percentage", discount_value: 5,
  commission_type: "percentage", commission_value: 5, usage_limit: "",
  valid_from: "", valid_until: "", is_active: true,
};

const AdminPartnerCodes = () => {
  const [codes, setCodes] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const [c, p] = await Promise.all([
      (supabase as any).from("partner_referral_codes").select("*, partners(full_name)").order("created_at", { ascending: false }),
      (supabase as any).from("partners").select("id, full_name").eq("status", "approved"),
    ]);
    setCodes(c.data || []);
    setPartners(p.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit) return;
    const payload: any = {
      partner_id: edit.partner_id,
      code: edit.code.trim().toUpperCase(),
      discount_type: edit.discount_type,
      discount_value: Number(edit.discount_value) || 0,
      commission_type: edit.commission_type,
      commission_value: Number(edit.commission_value) || 0,
      usage_limit: edit.usage_limit ? Number(edit.usage_limit) : null,
      valid_from: edit.valid_from || null,
      valid_until: edit.valid_until || null,
      is_active: edit.is_active,
    };
    if (!payload.code || !payload.partner_id) return toast.error("Code & partner required");
    const q = edit.id
      ? (supabase as any).from("partner_referral_codes").update(payload).eq("id", edit.id)
      : (supabase as any).from("partner_referral_codes").insert(payload);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEdit(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    const { error } = await (supabase as any).from("partner_referral_codes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const toggle = async (c: any) => {
    await (supabase as any).from("partner_referral_codes").update({ is_active: !c.is_active }).eq("id", c.id);
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Ticket className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">রেফারেল কোড</h1>
          </div>
          <Button onClick={() => setEdit({ ...blank })}><Plus className="h-4 w-4 mr-1" />নতুন কোড</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : codes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">কোনো কোড নেই</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="p-3">কোড</th>
                      <th className="p-3 hidden sm:table-cell">পার্টনার</th>
                      <th className="p-3">ডিসকাউন্ট</th>
                      <th className="p-3 hidden md:table-cell">কমিশন</th>
                      <th className="p-3 hidden lg:table-cell">ব্যবহার</th>
                      <th className="p-3">স্ট্যাটাস</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((c) => (
                      <tr key={c.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-mono font-semibold">
                          {c.code}
                          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1"
                            onClick={() => { navigator.clipboard.writeText(c.code); toast.success("কপি হয়েছে"); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </td>
                        <td className="p-3 hidden sm:table-cell">{c.partners?.full_name || "—"}</td>
                        <td className="p-3">
                          {c.discount_type === "percentage" ? `${c.discount_value}%`
                            : c.discount_type === "fixed" ? `৳${c.discount_value}`
                            : "Free Shipping"}
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          {c.commission_type === "percentage" ? `${c.commission_value}%` : `৳${c.commission_value}`}
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          {c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}
                        </td>
                        <td className="p-3"><Switch checked={c.is_active} onCheckedChange={() => toggle(c)} /></td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setEdit({
                            ...c,
                            valid_from: c.valid_from?.slice(0, 16) || "",
                            valid_until: c.valid_until?.slice(0, 16) || "",
                          })}>সম্পাদনা</Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
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

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit?.id ? "কোড সম্পাদনা" : "নতুন কোড"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div>
                <Label>পার্টনার</Label>
                <Select value={edit.partner_id} onValueChange={(v) => setEdit({ ...edit, partner_id: v })}>
                  <SelectTrigger><SelectValue placeholder="পার্টনার নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>কোড</Label>
                <Input value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value })} placeholder="SAVE10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>ডিসকাউন্ট টাইপ</Label>
                  <Select value={edit.discount_type} onValueChange={(v) => setEdit({ ...edit, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="free_shipping">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ডিসকাউন্ট মান</Label>
                  <Input type="number" value={edit.discount_value}
                    onChange={(e) => setEdit({ ...edit, discount_value: e.target.value })} />
                </div>
                <div>
                  <Label>কমিশন টাইপ</Label>
                  <Select value={edit.commission_type} onValueChange={(v) => setEdit({ ...edit, commission_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>কমিশন মান</Label>
                  <Input type="number" value={edit.commission_value}
                    onChange={(e) => setEdit({ ...edit, commission_value: e.target.value })} />
                </div>
                <div>
                  <Label>ব্যবহারের সীমা</Label>
                  <Input type="number" value={edit.usage_limit}
                    onChange={(e) => setEdit({ ...edit, usage_limit: e.target.value })} placeholder="Unlimited" />
                </div>
                <div className="flex items-end gap-2"><Switch checked={edit.is_active}
                  onCheckedChange={(v) => setEdit({ ...edit, is_active: v })} /><Label>সক্রিয়</Label></div>
                <div>
                  <Label>শুরু</Label>
                  <Input type="datetime-local" value={edit.valid_from}
                    onChange={(e) => setEdit({ ...edit, valid_from: e.target.value })} />
                </div>
                <div>
                  <Label>শেষ</Label>
                  <Input type="datetime-local" value={edit.valid_until}
                    onChange={(e) => setEdit({ ...edit, valid_until: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>বাতিল</Button>
            <Button onClick={save}>সংরক্ষণ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPartnerCodes;