import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Layers, Plus, Pencil, Trash2, Package, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

const UNIT_OPTIONS = [
  { value: "kg", label: "কেজি (kg)" },
  { value: "g", label: "গ্রাম (g)" },
  { value: "liter", label: "লিটার (L)" },
  { value: "ml", label: "মিলিলিটার (ml)" },
  { value: "pcs", label: "পিস (pcs)" },
  { value: "packet", label: "প্যাকেট" },
  { value: "bag", label: "বস্তা/ব্যাগ" },
  { value: "box", label: "বক্স" },
  { value: "dozen", label: "ডজন" },
  { value: "ton", label: "টন" },
  { value: "quintal", label: "কুইন্টাল" },
  { value: "maund", label: "মণ" },
  { value: "seer", label: "সের" },
];

// Preset weight/volume options per unit type
const WEIGHT_PRESETS: Record<string, { value: number; unit: string; label: string }[]> = {
  kg: [
    { value: 100, unit: "g", label: "১০০ গ্রাম" },
    { value: 200, unit: "g", label: "২০০ গ্রাম" },
    { value: 250, unit: "g", label: "২৫০ গ্রাম" },
    { value: 500, unit: "g", label: "৫০০ গ্রাম" },
    { value: 1, unit: "kg", label: "১ কেজি" },
    { value: 2, unit: "kg", label: "২ কেজি" },
    { value: 5, unit: "kg", label: "৫ কেজি" },
    { value: 10, unit: "kg", label: "১০ কেজি" },
    { value: 25, unit: "kg", label: "২৫ কেজি" },
  ],
  g: [
    { value: 100, unit: "g", label: "১০০ গ্রাম" },
    { value: 200, unit: "g", label: "২০০ গ্রাম" },
    { value: 250, unit: "g", label: "২৫০ গ্রাম" },
    { value: 500, unit: "g", label: "৫০০ গ্রাম" },
    { value: 1, unit: "kg", label: "১ কেজি" },
    { value: 2, unit: "kg", label: "২ কেজি" },
    { value: 5, unit: "kg", label: "৫ কেজি" },
    { value: 10, unit: "kg", label: "১০ কেজি" },
    { value: 25, unit: "kg", label: "২৫ কেজি" },
  ],
  liter: [
    { value: 100, unit: "ml", label: "১০০ মিলি" },
    { value: 200, unit: "ml", label: "২০০ মিলি" },
    { value: 250, unit: "ml", label: "২৫০ মিলি" },
    { value: 500, unit: "ml", label: "৫০০ মিলি" },
    { value: 1, unit: "liter", label: "১ লিটার" },
    { value: 2, unit: "liter", label: "২ লিটার" },
    { value: 5, unit: "liter", label: "৫ লিটার" },
    { value: 10, unit: "liter", label: "১০ লিটার" },
    { value: 25, unit: "liter", label: "২৫ লিটার" },
  ],
  ml: [
    { value: 100, unit: "ml", label: "১০০ মিলি" },
    { value: 200, unit: "ml", label: "২০০ মিলি" },
    { value: 250, unit: "ml", label: "২৫০ মিলি" },
    { value: 500, unit: "ml", label: "৫০০ মিলি" },
    { value: 1, unit: "liter", label: "১ লিটার" },
    { value: 2, unit: "liter", label: "২ লিটার" },
    { value: 5, unit: "liter", label: "৫ লিটার" },
    { value: 10, unit: "liter", label: "১০ লিটার" },
    { value: 25, unit: "liter", label: "২৫ লিটার" },
  ],
};

interface Variation {
  id: string;
  product_id: string;
  variation_name: string;
  unit: string;
  weight_value: number;
  price: number;
  cost_price: number;
  stock_quantity: number;
  sku: string | null;
  is_active: boolean;
}

const defaultForm = {
  product_id: "",
  variation_name: "",
  unit: "kg",
  weight_value: 1,
  price: 0,
  cost_price: 0,
  stock_quantity: 0,
  sku: "",
  is_active: true,
};

export default function POSVariations() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-variations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, category")
        .order("name");
      return data || [];
    },
  });

  const { data: variations = [], isLoading } = useQuery({
    queryKey: ["product-variations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_variations")
        .select("id, product_id, variation_name, sku, price, stock_quantity, unit, weight_value, is_active, created_at, updated_at")
        .order("created_at", { ascending: false });
      const { data: costs } = await supabase.rpc("get_product_variations_cost_map");
      const costMap = new Map<string, number>((costs || []).map((c: { id: string; cost_price: number | null }) => [c.id, Number(c.cost_price) || 0]));
      return ((data || []).map((v: any) => ({ ...v, cost_price: costMap.get(v.id) ?? 0 }))) as Variation[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: typeof defaultForm & { id?: string }) => {
      const payload = {
        product_id: formData.product_id,
        variation_name: formData.variation_name,
        unit: formData.unit,
        weight_value: formData.weight_value,
        price: formData.price,
        cost_price: formData.cost_price,
        stock_quantity: formData.stock_quantity,
        sku: formData.sku || null,
        is_active: formData.is_active,
      };

      if (formData.id) {
        const { error } = await supabase
          .from("product_variations")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("product_variations")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variations"] });
      toast.success(editingId ? "ভ্যারিয়েশন আপডেট হয়েছে" : "ভ্যারিয়েশন যোগ হয়েছে");
      resetForm();
    },
    onError: () => toast.error("সমস্যা হয়েছে"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_variations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variations"] });
      toast.success("ভ্যারিয়েশন মুছে ফেলা হয়েছে");
    },
    onError: () => toast.error("মুছতে সমস্যা হয়েছে"),
  });

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setDialogOpen(false);
  };

  const openEdit = (v: Variation) => {
    setForm({
      product_id: v.product_id,
      variation_name: v.variation_name,
      unit: v.unit,
      weight_value: v.weight_value,
      price: v.price,
      cost_price: v.cost_price,
      stock_quantity: v.stock_quantity,
      sku: v.sku || "",
      is_active: v.is_active,
    });
    setEditingId(v.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.product_id || !form.variation_name) {
      toast.error("পণ্য ও ভ্যারিয়েশনের নাম দিন");
      return;
    }
    saveMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  const getProductName = (pid: string) => products.find((p: any) => p.id === pid)?.name || "—";
  const getUnitLabel = (val: string) => UNIT_OPTIONS.find((u) => u.value === val)?.label || val;

  const filtered = variations.filter((v) => {
    const pName = getProductName(v.product_id).toLowerCase();
    const matchSearch = !searchTerm || pName.includes(searchTerm.toLowerCase()) || v.variation_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProduct = filterProduct === "all" || v.product_id === filterProduct;
    return matchSearch && matchProduct;
  });

  // Group by product
  const grouped = filtered.reduce((acc: Record<string, Variation[]>, v) => {
    const key = v.product_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  return (
    <POSLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" /> পণ্যের ভ্যারিয়েশন
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">ওজন, আয়তন ও প্যাকেজ ভিন্নতা ব্যবস্থাপনা</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" /> ভ্যারিয়েশন যোগ করুন
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "ভ্যারিয়েশন এডিট" : "নতুন ভ্যারিয়েশন যোগ"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>পণ্য নির্বাচন *</Label>
                  <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                    <SelectTrigger><SelectValue placeholder="পণ্য বাছাই করুন" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>ভ্যারিয়েশনের নাম *</Label>
                    <Input placeholder="যেমন: ৫০০ গ্রাম" value={form.variation_name} onChange={(e) => setForm({ ...form, variation_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>ইউনিট</Label>
                    <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Preset quick-select buttons */}
                {WEIGHT_PRESETS[form.unit] && (
                  <div>
                    <Label className="text-xs text-muted-foreground">দ্রুত নির্বাচন (ক্লিক করে বাছাই করুন, পরে এডিট করতে পারবেন)</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {WEIGHT_PRESETS[form.unit].map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          size="sm"
                          variant={form.variation_name === preset.label ? "default" : "outline"}
                          className="text-xs h-7 px-2.5"
                          onClick={() => setForm({
                            ...form,
                            variation_name: preset.label,
                            unit: preset.unit,
                            weight_value: preset.value,
                          })}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>পরিমাণ/ওজন</Label>
                    <Input type="number" min={0} step="0.01" value={form.weight_value} onChange={(e) => setForm({ ...form, weight_value: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>বিক্রয় মূল্য (৳)</Label>
                    <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>ক্রয় মূল্য (৳)</Label>
                    <Input type="number" min={0} value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>স্টক পরিমাণ</Label>
                    <Input type="number" min={0} value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>SKU (ঐচ্ছিক)</Label>
                    <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
                  <Label>সক্রিয়</Label>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSubmit} disabled={saveMutation.isPending} className="flex-1">
                    {saveMutation.isPending ? "সংরক্ষণ হচ্ছে..." : editingId ? "আপডেট করুন" : "যোগ করুন"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>বাতিল</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="পণ্য বা ভ্যারিয়েশন খুঁজুন..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="পণ্য ফিল্টার" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল পণ্য</SelectItem>
              {products.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">লোড হচ্ছে...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>কোনো ভ্যারিয়েশন পাওয়া যায়নি</p>
              <p className="text-xs mt-1">উপরের বাটনে ক্লিক করে নতুন ভ্যারিয়েশন যোগ করুন</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([productId, items]) => (
            <Card key={productId}>
              <CardHeader className="py-3 px-3 sm:px-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs sm:text-sm">{getProductName(productId)}</Badge>
                  <span className="text-muted-foreground text-xs font-normal">({items.length} টি ভ্যারিয়েশন)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 pt-0">
                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-2 px-3 pb-3">
                  {items.map((v) => (
                    <div key={v.id} className={`border rounded-lg p-3 space-y-2 ${!v.is_active ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{v.variation_name}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(v)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(v.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        <span>পরিমাণ: {v.weight_value} {getUnitLabel(v.unit)}</span>
                        <span>বিক্রয়: ৳{v.price}</span>
                        <span>ক্রয়: ৳{v.cost_price}</span>
                        <span>স্টক: <Badge variant={v.stock_quantity > 10 ? "default" : "destructive"} className="text-[10px] px-1 py-0">{v.stock_quantity}</Badge></span>
                      </div>
                      {v.sku && <p className="text-[10px] text-muted-foreground">SKU: {v.sku}</p>}
                      {!v.is_active && <Badge variant="secondary" className="text-[10px]">নিষ্ক্রিয়</Badge>}
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ভ্যারিয়েশন</TableHead>
                        <TableHead>পরিমাণ</TableHead>
                        <TableHead>ইউনিট</TableHead>
                        <TableHead>বিক্রয় মূল্য</TableHead>
                        <TableHead>ক্রয় মূল্য</TableHead>
                        <TableHead>স্টক</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>স্ট্যাটাস</TableHead>
                        <TableHead className="text-right">অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((v) => (
                        <TableRow key={v.id} className={!v.is_active ? 'opacity-60' : ''}>
                          <TableCell className="font-medium">{v.variation_name}</TableCell>
                          <TableCell>{v.weight_value}</TableCell>
                          <TableCell>{getUnitLabel(v.unit)}</TableCell>
                          <TableCell>৳{v.price}</TableCell>
                          <TableCell>৳{v.cost_price}</TableCell>
                          <TableCell>
                            <Badge variant={v.stock_quantity > 10 ? "default" : "destructive"}>{v.stock_quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{v.sku || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={v.is_active ? "default" : "secondary"}>{v.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(v)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(v.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </POSLayout>
  );
}
