import { useState, useEffect } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Banknote, Smartphone, Clock, AlertCircle, CheckCircle, HandCoins, MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DueSale {
  id: string;
  sale_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  created_at: string;
}

interface DuePayment {
  id: string;
  amount: number;
  payment_method: string;
  mobile_banking_provider: string | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
}

export default function POSDueCollections() {
  const { user } = useAuth();
  const [dueSales, setDueSales] = useState<DueSale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<DueSale | null>(null);
  const [payments, setPayments] = useState<DuePayment[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [mobileBankingProvider, setMobileBankingProvider] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingWA, setIsSendingWA] = useState<string | null>(null);

  const sendWhatsAppReminder = async (sale: DueSale) => {
    if (!sale.customer_phone) return;
    setIsSendingWA(sale.id);
    try {
      const message = `প্রিয় ${sale.customer_name || "গ্রাহক"},\n\nআপনার বিক্রয় (${sale.sale_number}) এ বাকি আছে: ৳${sale.due_amount.toLocaleString()}\nমোট বিল: ৳${sale.total_amount.toLocaleString()}\nপ্রদত্ত: ৳${sale.paid_amount.toLocaleString()}\n\nঅনুগ্রহ করে যত দ্রুত সম্ভব বাকি পরিশোধ করুন।\n\nধন্যবাদ।`;
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { action: "send_text", phone: sale.customer_phone, text_message: message },
      });
      if (error) throw error;
      if (data?.success) toast.success("WhatsApp মেসেজ পাঠানো হয়েছে");
      else toast.error(data?.message || data?.error || "মেসেজ পাঠাতে ব্যর্থ");
    } catch {
      toast.error("WhatsApp মেসেজ পাঠাতে সমস্যা হয়েছে");
    } finally {
      setIsSendingWA(null);
    }
  };

  useEffect(() => {
    fetchDueSales();
  }, []);

  const fetchDueSales = async () => {
    const { data, error } = await supabase
      .from("pos_sales")
      .select("id, sale_number, customer_name, customer_phone, total_amount, paid_amount, due_amount, created_at")
      .eq("payment_type", "due")
      .gt("due_amount", 0)
      .order("created_at", { ascending: false });
    if (!error && data) setDueSales(data as DueSale[]);
  };

  const fetchPayments = async (saleId: string) => {
    const { data } = await supabase
      .from("pos_due_payments")
      .select("*")
      .eq("sale_id", saleId)
      .order("created_at", { ascending: false });
    setPayments((data || []) as DuePayment[]);
  };

  const openPaymentDialog = async (sale: DueSale) => {
    setSelectedSale(sale);
    await fetchPayments(sale.id);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setMobileBankingProvider("");
    setTransactionId("");
    setPaymentNotes("");
    setShowPaymentDialog(true);
  };

  const collectPayment = async () => {
    if (!selectedSale || !user) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("সঠিক পরিমাণ দিন");
      return;
    }
    if (amount > selectedSale.due_amount) {
      toast.error("বাকি পরিমাণের বেশি নেওয়া যাবে না");
      return;
    }

    setIsProcessing(true);
    try {
      // Insert payment record
      const { error: payError } = await supabase.from("pos_due_payments").insert({
        sale_id: selectedSale.id,
        amount,
        payment_method: paymentMethod,
        mobile_banking_provider: paymentMethod === "mobile_banking" ? mobileBankingProvider : null,
        transaction_id: paymentMethod === "mobile_banking" ? transactionId : null,
        notes: paymentNotes || null,
        collected_by: user.id,
      });
      if (payError) throw payError;

      // Update sale due_amount and paid_amount
      const newDue = selectedSale.due_amount - amount;
      const newPaid = selectedSale.paid_amount + amount;
      const { error: updateError } = await supabase.from("pos_sales").update({
        due_amount: newDue,
        paid_amount: newPaid,
        payment_type: newDue <= 0 ? "full" : "due",
      }).eq("id", selectedSale.id);
      if (updateError) throw updateError;

      toast.success(`৳${amount.toFixed(0)} পেমেন্ট গ্রহণ করা হয়েছে`);
      
      // Refresh
      setSelectedSale(prev => prev ? { ...prev, due_amount: newDue, paid_amount: newPaid } : null);
      await fetchPayments(selectedSale.id);
      await fetchDueSales();
      setPaymentAmount("");
      setPaymentNotes("");
      
      if (newDue <= 0) {
        setShowPaymentDialog(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("পেমেন্ট গ্রহণ করতে সমস্যা হয়েছে");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSales = dueSales.filter(s =>
    (s.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.customer_phone || "").includes(searchTerm) ||
    s.sale_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDue = dueSales.reduce((sum, s) => sum + s.due_amount, 0);

  return (
    <POSLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">বাকি বিক্রয় ও পেমেন্ট আদায়</h1>
          <p className="text-muted-foreground text-sm">বাকি থাকা বিক্রয়ের তালিকা ও কিস্তি পেমেন্ট গ্রহণ</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">মোট বাকি</p>
              <p className="text-2xl font-bold text-destructive">৳{totalDue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">বাকি বিক্রয় সংখ্যা</p>
              <p className="text-2xl font-bold text-foreground">{dueSales.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="কাস্টমার নাম, ফোন বা রিসিপ্ট নম্বর খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Due Sales Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>রিসিপ্ট</TableHead>
                  <TableHead>কাস্টমার</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead className="text-right">প্রদত্ত</TableHead>
                  <TableHead className="text-right">বাকি</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead className="text-center">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs">{sale.sale_number}</TableCell>
                    <TableCell>{sale.customer_name || '-'}</TableCell>
                    <TableCell className="text-xs">{sale.customer_phone || '-'}</TableCell>
                    <TableCell className="text-right">৳{sale.total_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400">৳{sale.paid_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">৳{sale.due_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{new Date(sale.created_at).toLocaleDateString('bn-BD')}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="default" className="gap-1" onClick={() => openPaymentDialog(sale)}>
                          <HandCoins className="h-3.5 w-3.5" /> আদায়
                        </Button>
                        {sale.customer_phone && (
                          <Button size="sm" variant="outline" className="gap-1 text-green-600 hover:text-green-700"
                            onClick={() => sendWhatsAppReminder(sale)}
                            disabled={isSendingWA === sale.id}>
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
                      কোনো বাকি বিক্রয় নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment Collection Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HandCoins className="h-5 w-5" /> পেমেন্ট আদায়
              </DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4">
                {/* Sale Info */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>রিসিপ্ট:</span>
                    <span className="font-mono font-bold">{selectedSale.sale_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>কাস্টমার:</span>
                    <span className="font-medium">{selectedSale.customer_name || '-'}</span>
                  </div>
                  {selectedSale.customer_phone && (
                    <div className="flex justify-between">
                      <span>ফোন:</span>
                      <span>{selectedSale.customer_phone}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span>মোট বিল:</span>
                    <span className="font-bold">৳{selectedSale.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>প্রদত্ত:</span>
                    <span>৳{selectedSale.paid_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-destructive font-bold text-base">
                    <span>বাকি আছে:</span>
                    <span>৳{selectedSale.due_amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Payment Form */}
                {selectedSale.due_amount > 0 && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm">পেমেন্ট পরিমাণ</Label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        placeholder={`সর্বোচ্চ ৳${selectedSale.due_amount}`}
                        className="text-lg font-bold"
                      />
                      <div className="flex gap-1 mt-1">
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setPaymentAmount(String(selectedSale.due_amount))}>
                          সম্পূর্ণ (৳{selectedSale.due_amount})
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setPaymentAmount(String(Math.ceil(selectedSale.due_amount / 2)))}>
                          অর্ধেক
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant={paymentMethod === "cash" ? "default" : "outline"} className="flex-1 gap-1" onClick={() => setPaymentMethod("cash")}>
                        <Banknote className="h-3.5 w-3.5" /> ক্যাশ
                      </Button>
                      <Button size="sm" variant={paymentMethod === "mobile_banking" ? "default" : "outline"} className="flex-1 gap-1" onClick={() => setPaymentMethod("mobile_banking")}>
                        <Smartphone className="h-3.5 w-3.5" /> মোবাইল
                      </Button>
                    </div>

                    {paymentMethod === "mobile_banking" && (
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={mobileBankingProvider} onValueChange={setMobileBankingProvider}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="প্রোভাইডার" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bkash">বিকাশ</SelectItem>
                            <SelectItem value="nagad">নগদ</SelectItem>
                            <SelectItem value="rocket">রকেট</SelectItem>
                            <SelectItem value="upay">উপায়</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="ট্রানজেকশন ID" value={transactionId} onChange={e => setTransactionId(e.target.value)} className="h-8 text-xs" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label className="text-xs">নোট (ঐচ্ছিক)</Label>
                      <Textarea placeholder="কোনো মন্তব্য..." value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} className="text-xs" rows={2} />
                    </div>

                    <Button className="w-full gap-2" onClick={collectPayment} disabled={isProcessing}>
                      {isProcessing ? "প্রসেসিং..." : (
                        <>
                          <HandCoins className="h-4 w-4" />
                          পেমেন্ট গ্রহণ করুন
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Payment History */}
                {payments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-1">
                      <Clock className="h-4 w-4" /> পেমেন্ট ইতিহাস
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {payments.map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-muted/30 rounded p-2 text-xs">
                          <div>
                            <span className="font-medium">৳{p.amount.toLocaleString()}</span>
                            <span className="text-muted-foreground ml-2">
                              ({p.payment_method === 'cash' ? 'ক্যাশ' : 'মোবাইল'})
                            </span>
                            {p.notes && <p className="text-muted-foreground mt-0.5">{p.notes}</p>}
                          </div>
                          <span className="text-muted-foreground shrink-0">
                            {new Date(p.created_at).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </POSLayout>
  );
}
