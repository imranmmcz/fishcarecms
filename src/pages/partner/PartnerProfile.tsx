import { useEffect, useState } from "react";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePartner } from "@/hooks/usePartner";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function PartnerProfile() {
  const { partner, reload } = usePartner();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [docs, setDocs] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    if (partner) setForm({
      whatsapp: partner.whatsapp || "", email: partner.email || "",
      address: partner.address || "", bkash_number: partner.bkash_number || "",
      nagad_number: partner.nagad_number || "", bank_name: partner.bank_name || "",
      account_name: partner.account_name || "", account_number: partner.account_number || "",
      branch_name: partner.branch_name || "",
    });
  }, [partner?.id]);

  useEffect(() => {
    if (!partner) return;
    (async () => {
      const list: { name: string; url: string }[] = [];
      for (const [k, v] of Object.entries({
        "প্রোফাইল ছবি": partner.profile_photo_url,
        "NID সামনে": partner.nid_front_url,
        "NID পেছনে": partner.nid_back_url,
      })) {
        if (!v) continue;
        const { data } = await (supabase as any).storage.from("partner-documents")
          .createSignedUrl(String(v).replace(/^.*partner-documents\//, ""), 600);
        if (data?.signedUrl) list.push({ name: k, url: data.signedUrl });
      }
      setDocs(list);
    })();
  }, [partner?.id]);

  const save = async () => {
    if (!partner) return;
    setSaving(true);
    const { error } = await (supabase as any).from("partners").update(form).eq("id", partner.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("সংরক্ষিত");
    reload();
  };

  if (!partner) return <PartnerLayout><Loader2 className="animate-spin" /></PartnerLayout>;

  return (
    <PartnerLayout>
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-2xl font-bold">প্রোফাইল</h1>
        <Card>
          <CardHeader><CardTitle className="text-base">যোগাযোগ ও ঠিকানা</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>ঠিকানা</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">পেমেন্ট তথ্য</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>bKash</Label><Input value={form.bkash_number} onChange={(e) => setForm({ ...form, bkash_number: e.target.value })} /></div>
            <div><Label>Nagad</Label><Input value={form.nagad_number} onChange={(e) => setForm({ ...form, nagad_number: e.target.value })} /></div>
            <div><Label>ব্যাংক</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></div>
            <div><Label>শাখা</Label><Input value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })} /></div>
            <div><Label>অ্যাকাউন্ট নাম</Label><Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} /></div>
            <div><Label>অ্যাকাউন্ট নম্বর</Label><Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></div>
          </CardContent>
        </Card>
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}সংরক্ষণ</Button>

        <Card>
          <CardHeader><CardTitle className="text-base">আপলোডকৃত ডকুমেন্ট</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {docs.length === 0 ? <div className="text-sm text-muted-foreground">কোনো ডকুমেন্ট নেই</div>
            : docs.map((d) => (
              <a key={d.name} href={d.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded border hover:bg-muted text-sm">
                <FileText className="h-4 w-4 text-primary" />{d.name}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}