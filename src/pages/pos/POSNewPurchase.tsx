import { useState } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingBag, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { purchasesRepo } from "@/repositories/purchases";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export default function POSNewPurchase() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState("");

  const { data: companies = [] } = useQuery({
    queryKey: ["pos-companies-suppliers"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name").eq("company_type", "supplier").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["pos-products-purchase"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, sku").order("name");
      const { data: costs } = await supabase.rpc("get_products_cost_map");
      const costMap = new Map<string, number>((costs || []).map((c: { id: string; cost_price: number | null }) => [c.id, Number(c.cost_price) || 0]));
      return (data || []).map((p: any) => ({ ...p, cost_price: costMap.get(p.id) ?? 0 }));
    },
  });

  const addItem = () => {
    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return toast.error("পণ্য নির্বাচন করুন");
    const q = parseInt(qty) || 1;
    const cost = parseFloat(unitCost) || product.cost_price || 0;
    if (items.find(i => i.product_id === selectedProduct)) return toast.error("এই পণ্য ইতিমধ্যে যোগ করা হয়েছে");
    setItems([...items, { product_id: product.id, product_name: product.name, quantity: q, unit_cost: cost, total_cost: q * cost }]);
    setSelectedProduct("");
    setQty("1");
    setUnitCost("");
  };

  const removeItem = (productId: string) => setItems(items.filter(i => i.product_id !== productId));

  const subtotal = items.reduce((s, i) => s + i.total_cost, 0);
  const discountAmount = discountType === "percent" 
    ? subtotal * (parseFloat(discountValue) || 0) / 100 
    : parseFloat(discountValue) || 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (items.length === 0) throw new Error("কমপক্ষে একটি পণ্য যোগ করুন");
      await purchasesRepo.create({
        order: {
          company_id: companyId || null,
          subtotal,
          total_amount: totalAmount,
          notes: notes || null,
          created_by: user?.id,
          status: "pending",
        },
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
          total_cost: i.total_cost,
        })),
      });
    },
    onSuccess: () => {
      toast.success("ক্রয় অর্ডার সফলভাবে তৈরি হয়েছে");
      navigate("/pos/purchases");
    },
    onError: (err: any) => toast.error(err.message || "ত্রুটি হয়েছে"),
  });

  return (
    <POSLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" /> নতুন ক্রয় অর্ডার
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">সাপ্লায়ারের কাছ থেকে পণ্য ক্রয়ের অর্ডার তৈরি করুন</p>
        </div>

        {/* Order Info - Show on top for mobile */}
        <div className="block lg:hidden">
          <Card>
            <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">অর্ডার তথ্য</CardTitle></CardHeader>
            <CardContent className="space-y-3 px-3 sm:px-6">
              <div className="space-y-1.5">
                <Label className="text-xs">সাপ্লায়ার</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue placeholder="সাপ্লায়ার নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">নোট (ঐচ্ছিক)</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="অতিরিক্ত তথ্য..." />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">পণ্য যোগ করুন</CardTitle></CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="flex-1 min-w-0 space-y-1">
                    <Label className="text-xs">পণ্য</Label>
                    <Select value={selectedProduct} onValueChange={(v) => {
                      setSelectedProduct(v);
                      const p = products.find((p: any) => p.id === v);
                      if (p?.cost_price) setUnitCost(p.cost_price.toString());
                    }}>
                      <SelectTrigger><SelectValue placeholder="পণ্য নির্বাচন করুন" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">পরিমাণ</Label>
                      <Input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">একক মূল্য (৳)</Label>
                      <Input type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="0" />
                    </div>
                    <Button onClick={addItem} size="sm" className="bg-emerald-600 hover:bg-emerald-700 shrink-0"><Plus className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">যোগ</span></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 px-3 sm:px-6">
                {/* Mobile Card View */}
                <div className="block sm:hidden space-y-2">
                  {items.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground text-sm">কোনো পণ্য যোগ করা হয়নি</p>
                  ) : items.map(item => (
                    <div key={item.product_id} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/30">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} × ৳{item.unit_cost.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-sm">৳{item.total_cost.toLocaleString("en-IN")}</span>
                        <Button size="icon" variant="ghost" className="text-red-500 h-7 w-7" onClick={() => removeItem(item.product_id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>পণ্য</TableHead>
                        <TableHead>পরিমাণ</TableHead>
                        <TableHead>একক মূল্য</TableHead>
                        <TableHead>মোট</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">কোনো পণ্য যোগ করা হয়নি</TableCell></TableRow>
                      ) : items.map(item => (
                        <TableRow key={item.product_id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>৳ {item.unit_cost.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="font-semibold">৳ {item.total_cost.toLocaleString("en-IN")}</TableCell>
                          <TableCell><Button size="icon" variant="ghost" className="text-red-500" onClick={() => removeItem(item.product_id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary - visible on mobile below items */}
                <div className="block lg:hidden mt-4 pt-3 border-t space-y-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">ডিসকাউন্ট</Label>
                    <div className="flex gap-2">
                      <Select value={discountType} onValueChange={(v: "flat" | "percent") => setDiscountType(v)}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">৳ ফ্ল্যাট</SelectItem>
                          <SelectItem value="percent">% শতাংশ</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="0" min="0" className="flex-1" />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm"><span>সাবটোটাল:</span><span className="font-semibold">৳ {subtotal.toLocaleString("en-IN")}</span></div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-destructive"><span>ডিসকাউন্ট:</span><span>- ৳ {discountAmount.toLocaleString("en-IN")}</span></div>
                  )}
                  <div className="flex justify-between text-lg font-bold"><span>মোট:</span><span>৳ {totalAmount.toLocaleString("en-IN")}</span></div>
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || items.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {saveMutation.isPending ? "সেভ হচ্ছে..." : "ক্রয় অর্ডার তৈরি করুন"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">অর্ডার তথ্য</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>সাপ্লায়ার</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger><SelectValue placeholder="সাপ্লায়ার নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>
                      {companies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>নোট (ঐচ্ছিক)</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="অতিরিক্ত তথ্য..." />
                </div>
                <div className="space-y-2">
                  <Label>ডিসকাউন্ট</Label>
                  <div className="flex gap-2">
                    <Select value={discountType} onValueChange={(v: "flat" | "percent") => setDiscountType(v)}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">৳ ফ্ল্যাট</SelectItem>
                        <SelectItem value="percent">% শতাংশ</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="0" min="0" />
                  </div>
                </div>
                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between text-sm"><span>সাবটোটাল:</span><span className="font-semibold">৳ {subtotal.toLocaleString("en-IN")}</span></div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-destructive"><span>ডিসকাউন্ট:</span><span>- ৳ {discountAmount.toLocaleString("en-IN")}</span></div>
                  )}
                  <div className="flex justify-between text-lg font-bold"><span>মোট:</span><span>৳ {totalAmount.toLocaleString("en-IN")}</span></div>
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || items.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {saveMutation.isPending ? "সেভ হচ্ছে..." : "ক্রয় অর্ডার তৈরি করুন"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </POSLayout>
  );
}
