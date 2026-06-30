import { useState, useMemo } from "react";
import { POSLayout } from "@/components/POSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Search, Users, AlertTriangle, MessageCircle, Phone,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { posRepo } from "@/repositories/pos";
import { toast } from "sonner";

interface CustomerDue {
  customer_name: string;
  customer_phone: string;
  total_due: number;
  total_sales: number;
  total_paid: number;
  sale_count: number;
  sales: {
    id: string;
    sale_number: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    created_at: string;
  }[];
}

export default function POSCustomerDueReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDue | null>(null);
  const [isSendingWA, setIsSendingWA] = useState<string | null>(null);

  const { data: dueSales = [] } = useQuery({
    queryKey: ["pos-customer-due-report"],
    queryFn: async () => {
      const sales = await posRepo.sales.list({ payment_type: "due", min_due: 0, limit: 1000 });
      return sales.filter((s) => s.due_amount > 0);
    },
  });

  const customerDues = useMemo(() => {
    const map = new Map<string, CustomerDue>();
    dueSales.forEach(sale => {
      const key = sale.customer_phone || sale.customer_name || "unknown";
      if (!map.has(key)) {
        map.set(key, {
          customer_name: sale.customer_name || "অজানা",
          customer_phone: sale.customer_phone || "",
          total_due: 0,
          total_sales: 0,
          total_paid: 0,
          sale_count: 0,
          sales: [],
        });
      }
      const c = map.get(key)!;
      c.total_due += sale.due_amount || 0;
      c.total_sales += sale.total_amount || 0;
      c.total_paid += sale.paid_amount || 0;
      c.sale_count += 1;
      c.sales.push({
        id: sale.id,
        sale_number: sale.sale_number,
        total_amount: sale.total_amount,
        paid_amount: sale.paid_amount,
        due_amount: sale.due_amount,
        created_at: sale.created_at,
      });
    });
    return Array.from(map.values()).sort((a, b) => b.total_due - a.total_due);
  }, [dueSales]);

  const filtered = customerDues.filter(c =>
    c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customer_phone.includes(searchTerm)
  );

  const totalDue = customerDues.reduce((s, c) => s + c.total_due, 0);
  const totalCustomers = customerDues.length;

  const sendWhatsAppReminder = async (customer: CustomerDue) => {
    if (!customer.customer_phone) {
      toast.error("কাস্টমারের ফোন নম্বর নেই");
      return;
    }
    setIsSendingWA(customer.customer_phone);
    try {
      const message = `প্রিয় ${customer.customer_name},\n\nআপনার মোট বাকি পরিমাণ: ৳${customer.total_due.toLocaleString()}\nমোট বাকি বিক্রয়: ${customer.sale_count}টি\n\nঅনুগ্রহ করে যত দ্রুত সম্ভব বাকি পরিশোধ করুন।\n\nধন্যবাদ।`;

      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          action: "send_text",
          phone: customer.customer_phone,
          text_message: message,
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(`${customer.customer_name}-কে WhatsApp মেসেজ পাঠানো হয়েছে`);
      } else {
        toast.error(data?.message || data?.error || "মেসেজ পাঠাতে ব্যর্থ");
      }
    } catch (err) {
      console.error(err);
      toast.error("WhatsApp মেসেজ পাঠাতে সমস্যা হয়েছে");
    } finally {
      setIsSendingWA(null);
    }
  };

  return (
    <POSLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" /> কাস্টমার-ভিত্তিক বাকি রিপোর্ট
          </h1>
          <p className="text-muted-foreground text-sm">প্রতিটি কাস্টমারের মোট বাকি পরিমাণ</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">মোট বাকি</p>
              <p className="text-2xl font-bold text-destructive">৳{totalDue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">বাকি কাস্টমার</p>
              <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">মোট বাকি বিক্রয়</p>
              <p className="text-2xl font-bold text-foreground">{dueSales.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="কাস্টমার নাম বা ফোন নম্বর খুঁজুন..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3">
          {filtered.map((customer, idx) => (
            <Card key={idx}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{customer.customer_name}</span>
                  <Badge variant="outline" className="text-[10px]">{customer.sale_count}টি বিক্রয়</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{customer.customer_phone || "-"}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground">মোট:</span> <span className="font-medium">৳{customer.total_sales.toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">প্রদত্ত:</span> <span className="font-medium text-green-600">৳{customer.total_paid.toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">বাকি:</span> <span className="font-bold text-destructive">৳{customer.total_due.toLocaleString()}</span></div>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs h-7" onClick={() => setSelectedCustomer(customer)}>
                    বিস্তারিত
                  </Button>
                  {customer.customer_phone && (
                    <Button size="sm" variant="outline" className="gap-1 text-xs h-7 text-green-600 hover:text-green-700"
                      onClick={() => sendWhatsAppReminder(customer)}
                      disabled={isSendingWA === customer.customer_phone}>
                      <MessageCircle className="h-3 w-3" />
                      {isSendingWA === customer.customer_phone ? "..." : "WA"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">কোনো বাকি কাস্টমার নেই</p>
          )}
        </div>

        {/* Desktop Table View */}
        <Card className="hidden sm:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>কাস্টমার</TableHead>
                  <TableHead>ফোন</TableHead>
                  <TableHead className="text-center">বাকি বিক্রয়</TableHead>
                  <TableHead className="text-right">মোট বিল</TableHead>
                  <TableHead className="text-right">প্রদত্ত</TableHead>
                  <TableHead className="text-right">বাকি</TableHead>
                  <TableHead className="text-center">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((customer, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{customer.customer_name}</TableCell>
                    <TableCell className="text-xs">{customer.customer_phone || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{customer.sale_count}টি</Badge>
                    </TableCell>
                    <TableCell className="text-right">৳{customer.total_sales.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400">
                      ৳{customer.total_paid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      ৳{customer.total_due.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-7"
                          onClick={() => setSelectedCustomer(customer)}>
                          বিস্তারিত
                        </Button>
                        {customer.customer_phone && (
                          <Button size="sm" variant="outline" className="gap-1 text-xs h-7 text-green-600 hover:text-green-700"
                            onClick={() => sendWhatsAppReminder(customer)}
                            disabled={isSendingWA === customer.customer_phone}>
                            <MessageCircle className="h-3 w-3" />
                            {isSendingWA === customer.customer_phone ? "..." : "WA"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      কোনো বাকি কাস্টমার নেই
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        {/* Customer Detail Dialog */}
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> {selectedCustomer?.customer_name}
              </DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                  {selectedCustomer.customer_phone && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> ফোন:</span>
                      <span>{selectedCustomer.customer_phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>মোট বিল:</span>
                    <span className="font-bold">৳{selectedCustomer.total_sales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>প্রদত্ত:</span>
                    <span>৳{selectedCustomer.total_paid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-destructive font-bold text-base">
                    <span>মোট বাকি:</span>
                    <span>৳{selectedCustomer.total_due.toLocaleString()}</span>
                  </div>
                </div>

                {selectedCustomer.customer_phone && (
                  <Button variant="outline" className="w-full gap-2 text-green-600 hover:text-green-700"
                    onClick={() => sendWhatsAppReminder(selectedCustomer)}
                    disabled={isSendingWA === selectedCustomer.customer_phone}>
                    <MessageCircle className="h-4 w-4" />
                    {isSendingWA === selectedCustomer.customer_phone ? "পাঠানো হচ্ছে..." : "WhatsApp এ বাকি রিমাইন্ডার পাঠান"}
                  </Button>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> বাকি বিক্রয় তালিকা
                  </h4>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {selectedCustomer.sales.map(sale => (
                      <div key={sale.id} className="flex justify-between items-center bg-muted/30 rounded p-2.5 text-xs">
                        <div>
                          <span className="font-mono font-medium">{sale.sale_number}</span>
                          <p className="text-muted-foreground mt-0.5">
                            {new Date(sale.created_at).toLocaleDateString('bn-BD')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p>বিল: ৳{sale.total_amount.toLocaleString()}</p>
                          <p className="text-destructive font-bold">বাকি: ৳{sale.due_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </POSLayout>
  );
}
