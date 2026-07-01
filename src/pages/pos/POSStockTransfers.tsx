import { useState } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Plus, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productsRepo } from "@/repositories/products";
import { stockAdjustmentsRepo } from "@/repositories/stockAdjustments";

export default function POSStockTransfers() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [transferType, setTransferType] = useState("in");
  const [notes, setNotes] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-transfer"],
    queryFn: async () => {
      const rows = await productsRepo.list();
      return rows.map((p) => ({
        id: p.id,
        name: p.name,
        stock_quantity: p.stock_quantity,
        sku: p.sku,
      }));
    },
  });

  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ["stock-adjustments"],
    queryFn: () => stockAdjustmentsRepo.list({ includeProduct: true, limit: 100 }),
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const product = products.find(p => p.id === selectedProduct);
      if (!product) throw new Error("পণ্য পাওয়া যায়নি");
      const qty = parseInt(quantity);
      if (!qty || qty <= 0) throw new Error("সঠিক পরিমাণ দিন");
      await stockAdjustmentsRepo.create({
        product_id: selectedProduct,
        adjustment_type: transferType === "in" ? "stock_in" : "stock_out",
        quantity_change: transferType === "in" ? qty : -qty,
        notes: notes || `স্টক ${transferType === "in" ? "ইন" : "আউট"}`,
      });
    },
    onSuccess: () => {
      toast.success("স্টক ট্রান্সফার সফল হয়েছে");
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["products-for-transfer"] });
      setDialogOpen(false);
      setSelectedProduct("");
      setQuantity("");
      setNotes("");
    },
    onError: (err: any) => toast.error(err.message || "ত্রুটি হয়েছে"),
  });

  const filtered = adjustments.filter((a: any) =>
    !search || a.products?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <POSLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowLeftRight className="h-6 w-6 text-emerald-500" /> স্টক ট্রান্সফার
            </h1>
            <p className="text-muted-foreground text-sm">পণ্যের স্টক ইন/আউট পরিচালনা করুন</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" /> নতুন ট্রান্সফার
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="পণ্যের নাম দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>পণ্য</TableHead>
                  <TableHead>ধরন</TableHead>
                  <TableHead>পরিবর্তন</TableHead>
                  <TableHead>আগের স্টক</TableHead>
                  <TableHead>নতুন স্টক</TableHead>
                  <TableHead>নোট</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">লোড হচ্ছে...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">কোনো ট্রান্সফার পাওয়া যায়নি</TableCell></TableRow>
                ) : filtered.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{new Date(a.created_at).toLocaleDateString("bn-BD")}</TableCell>
                    <TableCell className="font-medium">{a.products?.name}</TableCell>
                    <TableCell>
                      <Badge variant={a.quantity_change > 0 ? "default" : "destructive"}>
                        {a.quantity_change > 0 ? "স্টক ইন" : "স্টক আউট"}
                      </Badge>
                    </TableCell>
                    <TableCell className={a.quantity_change > 0 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                      {a.quantity_change > 0 ? "+" : ""}{a.quantity_change}
                    </TableCell>
                    <TableCell>{a.previous_quantity}</TableCell>
                    <TableCell>{a.new_quantity}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন স্টক ট্রান্সফার</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ট্রান্সফার ধরন</Label>
                <Select value={transferType} onValueChange={setTransferType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">স্টক ইন (যোগ)</SelectItem>
                    <SelectItem value="out">স্টক আউট (বিয়োগ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>পণ্য নির্বাচন</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger><SelectValue placeholder="পণ্য নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} (স্টক: {p.stock_quantity})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>পরিমাণ</Label>
                <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="পরিমাণ লিখুন" />
              </div>
              <div className="space-y-2">
                <Label>নোট (ঐচ্ছিক)</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="কারণ বা নোট লিখুন" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
              <Button onClick={() => transferMutation.mutate()} disabled={transferMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {transferMutation.isPending ? "প্রক্রিয়াকরণ..." : "ট্রান্সফার করুন"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </POSLayout>
  );
}
