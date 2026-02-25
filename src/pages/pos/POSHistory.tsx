import { useState, useEffect, useRef } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { History, Search, MoreVertical, Eye, Pencil, Trash2, Printer, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SaleItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number | null;
  total_price: number;
}

interface PrintConfig {
  pos_print_shop_name: string;
  pos_print_shop_address: string;
  pos_print_shop_phone: string;
  pos_print_shop_email: string;
  pos_print_shop_logo: string;
  pos_print_header_text: string;
  pos_print_footer_text: string;
  pos_print_show_logo: string;
  pos_print_show_shop_info: string;
  pos_print_show_customer_info: string;
  pos_print_show_item_discount: string;
  pos_print_paper_size: string;
  pos_print_font_size: string;
}

const defaultPrintConfig: PrintConfig = {
  pos_print_shop_name: "",
  pos_print_shop_address: "",
  pos_print_shop_phone: "",
  pos_print_shop_email: "",
  pos_print_shop_logo: "",
  pos_print_header_text: "",
  pos_print_footer_text: "ধন্যবাদ! আবার আসবেন।",
  pos_print_show_logo: "true",
  pos_print_show_shop_info: "true",
  pos_print_show_customer_info: "true",
  pos_print_show_item_discount: "true",
  pos_print_paper_size: "58mm",
  pos_print_font_size: "12",
};

export default function POSHistory() {
  const { toast } = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // View modal
  const [viewOpen, setViewOpen] = useState(false);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Print
  const [printConfig, setPrintConfig] = useState<PrintConfig>(defaultPrintConfig);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSales();
    fetchPrintConfig();
  }, []);

  const fetchSales = async () => {
    const { data } = await supabase
      .from("pos_sales")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setSales(data);
  };

  const fetchPrintConfig = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("setting_key, setting_value")
      .like("setting_key", "pos_print_%");
    if (data && data.length > 0) {
      const cfg = { ...defaultPrintConfig };
      data.forEach((s) => {
        const key = s.setting_key as keyof PrintConfig;
        if (key in cfg && s.setting_value) cfg[key] = s.setting_value;
      });
      setPrintConfig(cfg);
    }
  };

  const fetchSaleItems = async (saleId: string) => {
    setLoadingItems(true);
    const { data } = await supabase
      .from("pos_sale_items")
      .select("*")
      .eq("sale_id", saleId)
      .order("created_at");
    setSaleItems(data || []);
    setLoadingItems(false);
  };

  const filtered = sales.filter(s =>
    (s.sale_number || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_phone || "").includes(search)
  );

  // --- Actions ---
  const handleView = async (sale: any) => {
    setSelectedSale(sale);
    setViewOpen(true);
    await fetchSaleItems(sale.id);
  };

  const handleEditOpen = async (sale: any) => {
    setSelectedSale(sale);
    setEditCustomerName(sale.customer_name || "");
    setEditCustomerPhone(sale.customer_phone || "");
    setEditNotes(sale.notes || "");
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedSale) return;
    setEditSaving(true);
    const { error } = await supabase
      .from("pos_sales")
      .update({
        customer_name: editCustomerName || null,
        customer_phone: editCustomerPhone || null,
        notes: editNotes || null,
      })
      .eq("id", selectedSale.id);
    setEditSaving(false);
    if (error) {
      toast({ title: "ত্রুটি!", description: "আপডেট করতে ব্যর্থ হয়েছে।", variant: "destructive" });
    } else {
      toast({ title: "সফল!", description: "বিক্রি আপডেট হয়েছে।" });
      setEditOpen(false);
      fetchSales();
    }
  };

  const handleDeleteOpen = (sale: any) => {
    setSelectedSale(sale);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSale) return;
    setDeleting(true);
    // Delete sale items first, then the sale
    await supabase.from("pos_sale_items").delete().eq("sale_id", selectedSale.id);
    const { error } = await supabase.from("pos_sales").delete().eq("id", selectedSale.id);
    setDeleting(false);
    if (error) {
      toast({ title: "ত্রুটি!", description: "ডিলিট করতে ব্যর্থ হয়েছে।", variant: "destructive" });
    } else {
      toast({ title: "সফল!", description: "বিক্রি ডিলিট হয়েছে।" });
      setDeleteOpen(false);
      fetchSales();
    }
  };

  const handlePrint = async (sale: any) => {
    setSelectedSale(sale);
    await fetchSaleItems(sale.id);
    // Wait for state to update then print
    setTimeout(() => {
      const content = printRef.current;
      if (!content) return;
      const win = window.open("", "_blank", "width=400,height=600");
      if (!win) return;

      const paperWidth = printConfig.pos_print_paper_size === "80mm" ? "80mm" : printConfig.pos_print_paper_size === "A4" ? "210mm" : "58mm";
      const fontSize = printConfig.pos_print_font_size || "12";

      win.document.write(`
        <html>
          <head>
            <title>রিসিপ্ট - ${sale.sale_number}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'SolaimanLipi', 'Noto Sans Bengali', sans-serif; font-size: ${fontSize}px; width: ${paperWidth}; padding: 8px; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .line { border-top: 1px dashed #333; margin: 6px 0; }
              table { width: 100%; border-collapse: collapse; }
              td { padding: 2px 0; vertical-align: top; }
              .right { text-align: right; }
              .small { font-size: ${Math.max(8, parseInt(fontSize) - 2)}px; }
              .logo { max-width: 60px; margin: 0 auto 4px; display: block; }
            </style>
          </head>
          <body>${content.innerHTML}</body>
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </html>
      `);
      win.document.close();
    }, 300);
  };

  const formatDate = (d: string) => new Date(d).toLocaleString("bn-BD");

  return (
    <POSLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="h-6 w-6" /> বিক্রি ইতিহাস
          </h1>
          <p className="text-muted-foreground text-sm">সকল POS বিক্রির রেকর্ড</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="রিসিপ্ট নং, কাস্টমার নাম বা ফোন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>রিসিপ্ট নং</TableHead>
                  <TableHead>কাস্টমার</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead>পেমেন্ট</TableHead>
                  <TableHead className="text-right">সাবটোটাল</TableHead>
                  <TableHead className="text-right">ডিসকাউন্ট</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead className="text-center">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs">{sale.sale_number}</TableCell>
                    <TableCell>{sale.customer_name || "-"}</TableCell>
                    <TableCell className="text-xs">{sale.customer_phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={sale.payment_method === "cash" ? "default" : "secondary"}>
                        {sale.payment_method === "cash" ? "নগদ" : "মোবাইল"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">৳{sale.subtotal}</TableCell>
                    <TableCell className="text-right text-destructive">{sale.discount_amount > 0 ? `-৳${sale.discount_amount}` : "-"}</TableCell>
                    <TableCell className="text-right font-bold">৳{sale.total_amount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(sale.created_at)}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(sale)}>
                            <Eye className="h-4 w-4 mr-2" /> বিস্তারিত দেখুন
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditOpen(sale)}>
                            <Pencil className="h-4 w-4 mr-2" /> এডিট করুন
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(sale)}>
                            <Printer className="h-4 w-4 mr-2" /> প্রিন্ট করুন
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteOpen(sale)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> ডিলিট করুন
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">কোনো বিক্রি পাওয়া যায়নি</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ===== VIEW MODAL ===== */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> বিক্রি বিস্তারিত
            </DialogTitle>
            <DialogDescription>{selectedSale?.sale_number}</DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">কাস্টমার:</span> <span className="font-medium">{selectedSale.customer_name || "-"}</span></div>
                <div><span className="text-muted-foreground">ফোন:</span> <span className="font-medium">{selectedSale.customer_phone || "-"}</span></div>
                <div><span className="text-muted-foreground">পেমেন্ট:</span> <Badge variant="outline">{selectedSale.payment_method === "cash" ? "নগদ" : "মোবাইল ব্যাংকিং"}</Badge></div>
                <div><span className="text-muted-foreground">তারিখ:</span> <span className="font-medium">{formatDate(selectedSale.created_at)}</span></div>
                {selectedSale.mobile_banking_provider && (
                  <div><span className="text-muted-foreground">প্রোভাইডার:</span> <span className="font-medium">{selectedSale.mobile_banking_provider}</span></div>
                )}
                {selectedSale.transaction_id && (
                  <div><span className="text-muted-foreground">ট্রানজ্যাকশন:</span> <span className="font-mono text-xs">{selectedSale.transaction_id}</span></div>
                )}
              </div>

              <Separator />

              {loadingItems ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>পণ্য</TableHead>
                      <TableHead className="text-center">পরিমাণ</TableHead>
                      <TableHead className="text-right">দাম</TableHead>
                      <TableHead className="text-right">মোট</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saleItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.product_name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">৳{item.unit_price}</TableCell>
                        <TableCell className="text-right font-medium">৳{item.total_price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>সাবটোটাল</span><span>৳{selectedSale.subtotal}</span></div>
                {selectedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-destructive"><span>ডিসকাউন্ট</span><span>-৳{selectedSale.discount_amount}</span></div>
                )}
                <div className="flex justify-between font-bold text-base"><span>সর্বমোট</span><span>৳{selectedSale.total_amount}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>প্রদান</span><span>৳{selectedSale.paid_amount}</span></div>
                {selectedSale.change_amount > 0 && (
                  <div className="flex justify-between text-muted-foreground"><span>ফেরত</span><span>৳{selectedSale.change_amount}</span></div>
                )}
              </div>

              {selectedSale.notes && (
                <>
                  <Separator />
                  <div className="text-sm"><span className="text-muted-foreground">নোট:</span> {selectedSale.notes}</div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== EDIT MODAL ===== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" /> বিক্রি এডিট
            </DialogTitle>
            <DialogDescription>{selectedSale?.sale_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>কাস্টমারের নাম</Label>
              <Input value={editCustomerName} onChange={e => setEditCustomerName(e.target.value)} placeholder="কাস্টমারের নাম" />
            </div>
            <div className="space-y-2">
              <Label>ফোন নম্বর</Label>
              <Input value={editCustomerPhone} onChange={e => setEditCustomerPhone(e.target.value)} placeholder="01XXX-XXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>নোট</Label>
              <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="ঐচ্ছিক নোট..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>বাতিল</Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              আপডেট করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE DIALOG ===== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বিক্রি ডিলিট করুন</AlertDialogTitle>
            <AlertDialogDescription>
              আপনি কি নিশ্চিত "{selectedSale?.sale_number}" ডিলিট করতে চান? এই পরিবর্তন ফিরিয়ে আনা যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              ডিলিট করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== HIDDEN PRINT RECEIPT ===== */}
      <div className="hidden">
        <div ref={printRef}>
          {printConfig.pos_print_show_logo === "true" && printConfig.pos_print_shop_logo && (
            <div className="center"><img src={printConfig.pos_print_shop_logo} className="logo" alt="logo" /></div>
          )}
          {printConfig.pos_print_show_shop_info === "true" && (
            <div className="center">
              {printConfig.pos_print_shop_name && <div className="bold" style={{ fontSize: "14px" }}>{printConfig.pos_print_shop_name}</div>}
              {printConfig.pos_print_shop_address && <div className="small">{printConfig.pos_print_shop_address}</div>}
              {printConfig.pos_print_shop_phone && <div className="small">ফোন: {printConfig.pos_print_shop_phone}</div>}
              {printConfig.pos_print_shop_email && <div className="small">{printConfig.pos_print_shop_email}</div>}
            </div>
          )}
          {printConfig.pos_print_header_text && <div className="center small" style={{ marginTop: "4px" }}>{printConfig.pos_print_header_text}</div>}
          <div className="line" />
          <div className="small">রিসিপ্ট: {selectedSale?.sale_number}</div>
          <div className="small">তারিখ: {selectedSale ? formatDate(selectedSale.created_at) : ""}</div>
          {printConfig.pos_print_show_customer_info === "true" && selectedSale?.customer_name && (
            <>
              <div className="small">কাস্টমার: {selectedSale.customer_name}</div>
              {selectedSale.customer_phone && <div className="small">ফোন: {selectedSale.customer_phone}</div>}
            </>
          )}
          <div className="line" />
          <table>
            <thead>
              <tr>
                <td className="bold small">পণ্য</td>
                <td className="bold small center" style={{ textAlign: "center" }}>পরিমাণ</td>
                <td className="bold small right" style={{ textAlign: "right" }}>দাম</td>
                <td className="bold small right" style={{ textAlign: "right" }}>মোট</td>
              </tr>
            </thead>
            <tbody>
              {saleItems.map(item => (
                <tr key={item.id}>
                  <td className="small">{item.product_name}</td>
                  <td className="small" style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td className="small" style={{ textAlign: "right" }}>৳{item.unit_price}</td>
                  <td className="small" style={{ textAlign: "right" }}>৳{item.total_price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="line" />
          <table>
            <tbody>
              <tr><td className="small">সাবটোটাল</td><td className="small right" style={{ textAlign: "right" }}>৳{selectedSale?.subtotal}</td></tr>
              {selectedSale?.discount_amount > 0 && (
                <tr><td className="small">ডিসকাউন্ট</td><td className="small right" style={{ textAlign: "right" }}>-৳{selectedSale?.discount_amount}</td></tr>
              )}
              <tr><td className="bold">সর্বমোট</td><td className="bold right" style={{ textAlign: "right" }}>৳{selectedSale?.total_amount}</td></tr>
              <tr><td className="small">প্রদান ({selectedSale?.payment_method === "cash" ? "নগদ" : "মোবাইল"})</td><td className="small right" style={{ textAlign: "right" }}>৳{selectedSale?.paid_amount}</td></tr>
              {selectedSale?.change_amount > 0 && (
                <tr><td className="small">ফেরত</td><td className="small right" style={{ textAlign: "right" }}>৳{selectedSale?.change_amount}</td></tr>
              )}
            </tbody>
          </table>
          <div className="line" />
          {printConfig.pos_print_footer_text && <div className="center small" style={{ marginTop: "4px" }}>{printConfig.pos_print_footer_text}</div>}
        </div>
      </div>
    </POSLayout>
  );
}
