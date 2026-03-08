import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProducts } from "@/contexts/ProductsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFlashSales, FlashSale, FlashSaleItem } from "@/hooks/useFlashSales";
import {
  Zap, Plus, Trash2, Edit, Calendar, Clock, Percent, DollarSign,
  Package, Loader2, Search, CheckCircle2, XCircle
} from "lucide-react";
import { format } from "date-fns";

const AdminFlashSales = () => {
  const { language } = useLanguage();
  const { flashSales, isLoading, refetch } = useFlashSales();
  const { products } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [saving, setSaving] = useState(false);
  const [saleItems, setSaleItems] = useState<FlashSaleItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // Form state
  const [form, setForm] = useState({
    title: "",
    title_bn: "",
    description: "",
    description_bn: "",
    discount_type: "percentage",
    discount_value: 10,
    start_time: "",
    end_time: "",
    is_active: true,
    max_quantity_per_user: "",
    banner_image_url: "",
  });

  const isBn = language === "bn";

  const resetForm = () => {
    setForm({
      title: "", title_bn: "", description: "", description_bn: "",
      discount_type: "percentage", discount_value: 10,
      start_time: "", end_time: "", is_active: true,
      max_quantity_per_user: "", banner_image_url: "",
    });
    setEditingSale(null);
    setSaleItems([]);
  };

  const openCreate = () => {
    resetForm();
    const now = new Date();
    const later = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setForm(f => ({
      ...f,
      start_time: format(now, "yyyy-MM-dd'T'HH:mm"),
      end_time: format(later, "yyyy-MM-dd'T'HH:mm"),
    }));
    setDialogOpen(true);
  };

  const openEdit = async (sale: FlashSale) => {
    setEditingSale(sale);
    setForm({
      title: sale.title,
      title_bn: sale.title_bn || "",
      description: sale.description || "",
      description_bn: sale.description_bn || "",
      discount_type: sale.discount_type,
      discount_value: sale.discount_value,
      start_time: format(new Date(sale.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(sale.end_time), "yyyy-MM-dd'T'HH:mm"),
      is_active: sale.is_active,
      max_quantity_per_user: sale.max_quantity_per_user?.toString() || "",
      banner_image_url: sale.banner_image_url || "",
    });
    // Load items
    setLoadingItems(true);
    const { data } = await supabase
      .from("flash_sale_items")
      .select("*")
      .eq("flash_sale_id", sale.id);
    setSaleItems((data || []) as unknown as FlashSaleItem[]);
    setLoadingItems(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.start_time || !form.end_time) {
      toast.error("শিরোনাম, শুরু ও শেষ সময় আবশ্যক");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        title_bn: form.title_bn || null,
        description: form.description || null,
        description_bn: form.description_bn || null,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        is_active: form.is_active,
        max_quantity_per_user: form.max_quantity_per_user ? parseInt(form.max_quantity_per_user) : null,
        banner_image_url: form.banner_image_url || null,
      };

      let saleId = editingSale?.id;

      if (editingSale) {
        const { error } = await supabase
          .from("flash_sales")
          .update(payload as any)
          .eq("id", editingSale.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("flash_sales")
          .insert(payload as any)
          .select("id")
          .single();
        if (error) throw error;
        saleId = (data as any).id;
      }

      // Save items
      if (saleId) {
        // Delete existing items for this sale
        await supabase.from("flash_sale_items").delete().eq("flash_sale_id", saleId);
        
        if (saleItems.length > 0) {
          const itemsPayload = saleItems.map(item => ({
            flash_sale_id: saleId!,
            product_id: item.product_id,
            override_discount_type: item.override_discount_type || null,
            override_discount_value: item.override_discount_value ?? null,
            stock_limit: item.stock_limit || null,
          }));
          const { error: itemsErr } = await supabase
            .from("flash_sale_items")
            .insert(itemsPayload as any);
          if (itemsErr) throw itemsErr;
        }
      }

      toast.success(editingSale ? "ফ্ল্যাশ সেল আপডেট হয়েছে" : "ফ্ল্যাশ সেল তৈরি হয়েছে");
      setDialogOpen(false);
      resetForm();
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই ফ্ল্যাশ সেল মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("flash_sales").delete().eq("id", id);
    if (error) toast.error("মুছতে সমস্যা হয়েছে");
    else { toast.success("মুছে ফেলা হয়েছে"); refetch(); }
  };

  const addProduct = (productId: string) => {
    if (saleItems.find(i => i.product_id === productId)) return;
    setSaleItems(prev => [...prev, {
      id: crypto.randomUUID(),
      flash_sale_id: editingSale?.id || "",
      product_id: productId,
      override_discount_type: null,
      override_discount_value: null,
      stock_limit: null,
      sold_count: 0,
    }]);
  };

  const removeProduct = (productId: string) => {
    setSaleItems(prev => prev.filter(i => i.product_id !== productId));
  };

  const updateItem = (productId: string, field: string, value: any) => {
    setSaleItems(prev => prev.map(i =>
      i.product_id === productId ? { ...i, [field]: value } : i
    ));
  };

  const getSaleStatus = (sale: FlashSale) => {
    const now = new Date();
    const start = new Date(sale.start_time);
    const end = new Date(sale.end_time);
    if (!sale.is_active) return { label: "নিষ্ক্রিয়", variant: "secondary" as const };
    if (now < start) return { label: "আসন্ন", variant: "outline" as const };
    if (now >= start && now < end) return { label: "চলমান", variant: "default" as const };
    return { label: "শেষ", variant: "destructive" as const };
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
    !saleItems.find(i => i.product_id === p.id)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-amber-500" />
              {isBn ? "ফ্ল্যাশ সেল" : "Flash Sales"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isBn ? "সময়-সীমিত বিশেষ অফার পরিচালনা করুন" : "Manage time-limited special offers"}
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {isBn ? "নতুন ফ্ল্যাশ সেল" : "New Flash Sale"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : flashSales.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            {isBn ? "কোনো ফ্ল্যাশ সেল নেই" : "No flash sales yet"}
          </CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {flashSales.map(sale => {
              const status = getSaleStatus(sale);
              return (
                <Card key={sale.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-amber-500" />
                          <h3 className="font-semibold text-lg">{isBn && sale.title_bn ? sale.title_bn : sale.title}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(sale.start_time), "dd/MM/yyyy HH:mm")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(sale.end_time), "dd/MM/yyyy HH:mm")}
                          </span>
                          <span className="flex items-center gap-1">
                            {sale.discount_type === "percentage" ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                            {sale.discount_value}{sale.discount_type === "percentage" ? "%" : "৳"} {isBn ? "ছাড়" : "off"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(sale)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(sale.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                {editingSale ? (isBn ? "ফ্ল্যাশ সেল সম্পাদনা" : "Edit Flash Sale") : (isBn ? "নতুন ফ্ল্যাশ সেল" : "New Flash Sale")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{isBn ? "শিরোনাম (ইংরেজি)" : "Title (English)"}</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Flash Sale" />
                </div>
                <div>
                  <Label>{isBn ? "শিরোনাম (বাংলা)" : "Title (Bangla)"}</Label>
                  <Input value={form.title_bn} onChange={e => setForm(f => ({ ...f, title_bn: e.target.value }))} placeholder="ফ্ল্যাশ সেল" />
                </div>
                <div>
                  <Label>{isBn ? "বিবরণ (ইংরেজি)" : "Description"}</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <Label>{isBn ? "বিবরণ (বাংলা)" : "Description (Bangla)"}</Label>
                  <Input value={form.description_bn} onChange={e => setForm(f => ({ ...f, description_bn: e.target.value }))} />
                </div>
              </div>

              {/* Discount & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>{isBn ? "ডিসকাউন্ট ধরন" : "Discount Type"}</Label>
                  <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">{isBn ? "শতাংশ (%)" : "Percentage (%)"}</SelectItem>
                      <SelectItem value="fixed">{isBn ? "নির্দিষ্ট (৳)" : "Fixed (৳)"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isBn ? "ডিসকাউন্ট পরিমাণ" : "Discount Value"}</Label>
                  <Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>{isBn ? "শুরু সময়" : "Start Time"}</Label>
                  <Input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div>
                  <Label>{isBn ? "শেষ সময়" : "End Time"}</Label>
                  <Input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <Label>{isBn ? "সক্রিয়" : "Active"}</Label>
                </div>
                <div className="flex-1">
                  <Label>{isBn ? "ব্যানার ইমেজ URL" : "Banner Image URL"}</Label>
                  <Input value={form.banner_image_url} onChange={e => setForm(f => ({ ...f, banner_image_url: e.target.value }))} placeholder="https://..." />
                </div>
              </div>

              <Separator />

              {/* Product Selection */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {isBn ? "পণ্য নির্বাচন" : "Select Products"}
                </h3>

                {/* Search products */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder={isBn ? "পণ্য খুঁজুন..." : "Search products..."}
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>

                {productSearch && filteredProducts.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto mb-4">
                    {filteredProducts.slice(0, 10).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer" onClick={() => addProduct(p.id)}>
                        <div className="flex items-center gap-2">
                          {p.image_url && <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                          <span className="text-sm">{p.name}</span>
                          <span className="text-xs text-muted-foreground">৳{p.price}</span>
                        </div>
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected products */}
                {saleItems.length > 0 && (
                  <div className="space-y-2">
                    {saleItems.map(item => {
                      const p = products.find(pr => pr.id === item.product_id);
                      if (!p) return null;
                      return (
                        <div key={item.product_id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                          {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">৳{p.price}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24">
                              <Input
                                type="number"
                                placeholder={isBn ? "কাস্টম %" : "Custom %"}
                                className="h-8 text-xs"
                                value={item.override_discount_value ?? ""}
                                onChange={e => updateItem(item.product_id, "override_discount_value", e.target.value ? parseFloat(e.target.value) : null)}
                              />
                            </div>
                            <div className="w-20">
                              <Input
                                type="number"
                                placeholder={isBn ? "সীমা" : "Limit"}
                                className="h-8 text-xs"
                                value={item.stock_limit ?? ""}
                                onChange={e => updateItem(item.product_id, "stock_limit", e.target.value ? parseInt(e.target.value) : null)}
                              />
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeProduct(item.product_id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {saleItems.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    {isBn ? "পণ্য যোগ করুন (খালি রাখলে সকল পণ্যে প্রযোজ্য হবে)" : "Add products (leave empty for all products)"}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {isBn ? "বাতিল" : "Cancel"}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingSale ? (isBn ? "আপডেট" : "Update") : (isBn ? "তৈরি করুন" : "Create")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminFlashSales;
