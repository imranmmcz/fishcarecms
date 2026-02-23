import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, ShoppingBag, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

export function HeroFeaturedProductAdmin() {
  const [enabled, setEnabled] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [enabledRes, productIdRes, productsRes] = await Promise.all([
        supabase.from("system_settings").select("setting_value").eq("setting_key", "hero_featured_product_enabled").single(),
        supabase.from("system_settings").select("setting_value").eq("setting_key", "hero_featured_product_id").single(),
        supabase.from("products").select("id, name, price, image_url").order("name"),
      ]);
      setEnabled(enabledRes.data?.setting_value === "true");
      setSelectedProductId(productIdRes.data?.setting_value || "");
      setProducts(productsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        supabase.from("system_settings").update({ setting_value: enabled ? "true" : "false" }).eq("setting_key", "hero_featured_product_enabled"),
        supabase.from("system_settings").update({ setting_value: selectedProductId }).eq("setting_key", "hero_featured_product_id"),
      ]);
      toast.success("ফিচার্ড প্রোডাক্ট সেটিংস সংরক্ষিত হয়েছে");
    } catch {
      toast.error("সংরক্ষণ করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag className="h-5 w-5" />
          হিরো ফিচার্ড প্রোডাক্ট
        </CardTitle>
        <CardDescription>হিরো স্লাইডারের ডান পাশে একটি প্রোডাক্ট কার্ড দেখান</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>ফিচার্ড প্রোডাক্ট চালু করুন</Label>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-2">
          <Label>প্রোডাক্ট নির্বাচন করুন</Label>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger>
              <SelectValue placeholder="সর্বশেষ প্রোডাক্ট (অটো)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">সর্বশেষ প্রোডাক্ট (অটো)</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — ৳{p.price}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            খালি রাখলে সর্বশেষ যুক্ত করা প্রোডাক্ট দেখাবে
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
        </Button>
      </CardContent>
    </Card>
  );
}
