import { useEffect, useState } from "react";
import { PartnerLayout } from "@/components/PartnerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePartner } from "@/hooks/usePartner";
import { Copy, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PartnerCodes() {
  const { partner } = usePartner();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partner) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any).from("partner_referral_codes")
        .select("*").eq("partner_id", partner.id).order("created_at", { ascending: false });
      setCodes(data || []); setLoading(false);
    })();
  }, [partner?.id]);

  const link = (code: string) => `${window.location.origin}/?ref=${code}`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("কপি হয়েছে");
  };

  const share = async (code: string) => {
    const url = link(code);
    const text = `আমার রেফারাল কোড "${code}" ব্যবহার করে কেনাকাটায় ছাড় পান!`;
    if (navigator.share) {
      try { await navigator.share({ title: "Referral", text, url }); } catch {}
    } else { copy(`${text}\n${url}`); }
  };

  return (
    <PartnerLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">আমার রেফারাল কোড</h1>
        {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
        : codes.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">কোনো কোড বরাদ্দ হয়নি। অ্যাডমিনের সাথে যোগাযোগ করুন।</div>
        : <div className="grid gap-3 md:grid-cols-2">
            {codes.map((c) => (
              <Card key={c.id}><CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-xl font-bold tracking-wider">{c.code}</div>
                  <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><div className="text-muted-foreground">ডিসকাউন্ট</div><div className="font-medium">
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : c.discount_type === "fixed" ? `৳${c.discount_value}` : "ফ্রি শিপিং"}
                  </div></div>
                  <div><div className="text-muted-foreground">কমিশন</div><div className="font-medium">
                    {c.commission_type === "percentage" ? `${c.commission_value}%` : `৳${c.commission_value}`}
                  </div></div>
                  <div><div className="text-muted-foreground">ব্যবহৃত</div><div className="font-medium">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</div></div>
                </div>
                <div className="text-xs p-2 bg-muted rounded font-mono truncate">{link(c.code)}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copy(c.code)}><Copy className="h-3.5 w-3.5 mr-1" />কোড</Button>
                  <Button size="sm" variant="outline" onClick={() => copy(link(c.code))}><Copy className="h-3.5 w-3.5 mr-1" />লিংক</Button>
                  <Button size="sm" onClick={() => share(c.code)}><Share2 className="h-3.5 w-3.5 mr-1" />শেয়ার</Button>
                </div>
              </CardContent></Card>
            ))}
          </div>}
      </div>
    </PartnerLayout>
  );
}