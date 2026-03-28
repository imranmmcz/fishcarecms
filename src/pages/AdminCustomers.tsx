import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, ShoppingCart, Phone, Mail, MapPin, Eye, Plus, UserPlus, Download, Upload, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Customer {
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  division: string | null;
  district: string | null;
  upazila: string | null;
  shipping_address: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

interface CustomerOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function AdminCustomers({ Layout = AdminLayout }: { Layout?: React.ComponentType<{ children: React.ReactNode }> }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isOrdersDialogOpen, setIsOrdersDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    division: "",
    district: "",
    upazila: "",
    village: "",
    shipping_address: "",
    notes: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch from customers table
      const { data: savedCustomers, error: savedError } = await supabase
        .from('customers')
        .select('*');
      
      if (savedError) console.error('Error fetching saved customers:', savedError);

      // Get unique customers from orders with aggregated data
      const { data, error } = await supabase
        .from('orders')
        .select('customer_name, customer_email, customer_phone, division, district, upazila, shipping_address, total_amount, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate customers by phone number
      const customerMap = new Map<string, Customer>();
      
      // Add saved customers first
      savedCustomers?.forEach(c => {
        customerMap.set(c.customer_phone, {
          customer_name: c.customer_name,
          customer_email: c.customer_email,
          customer_phone: c.customer_phone,
          division: c.division,
          district: c.district,
          upazila: c.upazila,
          shipping_address: c.shipping_address || '',
          total_orders: 0,
          total_spent: 0,
          last_order_date: c.created_at,
        });
      });
      
      data?.forEach(order => {
        const key = order.customer_phone;
        if (customerMap.has(key)) {
          const existing = customerMap.get(key)!;
          existing.total_orders += 1;
          existing.total_spent += order.total_amount;
          if (new Date(order.created_at) > new Date(existing.last_order_date)) {
            existing.last_order_date = order.created_at;
          }
        } else {
          customerMap.set(key, {
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            customer_phone: order.customer_phone,
            division: order.division,
            district: order.district,
            upazila: order.upazila,
            shipping_address: order.shipping_address,
            total_orders: 1,
            total_spent: order.total_amount,
            last_order_date: order.created_at
          });
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('কাস্টমার লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.customer_name.trim() || !newCustomer.customer_phone.trim()) {
      toast.error('নাম এবং ফোন নম্বর আবশ্যক');
      return;
    }
    try {
      setIsSaving(true);
      const { error } = await supabase.from('customers').insert({
        customer_name: newCustomer.customer_name.trim(),
        customer_phone: newCustomer.customer_phone.trim(),
        customer_email: newCustomer.customer_email.trim() || null,
        division: newCustomer.division.trim() || null,
        district: newCustomer.district.trim() || null,
        upazila: newCustomer.upazila.trim() || null,
        village: newCustomer.village.trim() || null,
        shipping_address: newCustomer.shipping_address.trim() || null,
        notes: newCustomer.notes.trim() || null,
      });
      if (error) {
        if (error.code === '23505') {
          toast.error('এই ফোন নম্বর দিয়ে ইতিমধ্যে একটি কাস্টমার আছে');
        } else {
          throw error;
        }
        return;
      }
      toast.success('কাস্টমার সফলভাবে যোগ করা হয়েছে');
      setIsAddDialogOpen(false);
      setNewCustomer({ customer_name: "", customer_phone: "", customer_email: "", division: "", district: "", upazila: "", village: "", shipping_address: "", notes: "" });
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('কাস্টমার যোগ করতে সমস্যা হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchCustomerOrders = async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, payment_status, created_at')
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      toast.error('অর্ডার লোড করতে সমস্যা হয়েছে');
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerOrders(customer.customer_phone);
    setIsOrdersDialogOpen(true);
  };

  // Export customers to CSV
  const handleExportCSV = () => {
    try {
      const headers = ['নাম', 'ফোন', 'ইমেইল', 'বিভাগ', 'জেলা', 'উপজেলা', 'ঠিকানা', 'মোট অর্ডার', 'মোট খরচ'];
      const csvRows = [headers.join(',')];
      
      filteredCustomers.forEach(c => {
        const row = [
          `"${c.customer_name || ''}"`,
          `"${c.customer_phone || ''}"`,
          `"${c.customer_email || ''}"`,
          `"${c.division || ''}"`,
          `"${c.district || ''}"`,
          `"${c.upazila || ''}"`,
          `"${c.shipping_address || ''}"`,
          c.total_orders,
          c.total_spent,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${filteredCustomers.length} জন কাস্টমার এক্সপোর্ট হয়েছে`);
    } catch (error) {
      toast.error('এক্সপোর্ট করতে সমস্যা হয়েছে');
    }
  };

  // Import customers from CSV
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        toast.error('CSV ফাইলে কোনো ডাটা নেই');
        return;
      }

      // Skip header row
      const dataLines = lines.slice(1);
      let imported = 0;
      let skipped = 0;

      for (const line of dataLines) {
        // Parse CSV properly handling quoted fields
        const fields: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') { inQuotes = !inQuotes; continue; }
          if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; continue; }
          current += ch;
        }
        fields.push(current.trim());

        const name = fields[0] || '';
        const phone = fields[1] || '';
        if (!name || !phone) { skipped++; continue; }

        const { error } = await supabase.from('customers').upsert({
          customer_name: name,
          customer_phone: phone,
          customer_email: fields[2] || null,
          division: fields[3] || null,
          district: fields[4] || null,
          upazila: fields[5] || null,
          shipping_address: fields[6] || null,
        }, { onConflict: 'customer_phone' });

        if (error) { skipped++; } else { imported++; }
      }

      toast.success(`${imported} জন কাস্টমার ইমপোর্ট হয়েছে${skipped > 0 ? `, ${skipped} টি বাদ পড়েছে` : ''}`);
      fetchCustomers();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('ইমপোর্ট করতে সমস্যা হয়েছে');
    }

    // Reset file input
    e.target.value = '';
  };

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    const headers = 'নাম,ফোন,ইমেইল,বিভাগ,জেলা,উপজেলা,ঠিকানা';
    const sample = '"রহিম উদ্দিন","01712345678","rahim@email.com","ঢাকা","ঢাকা","সাভার","সাভার বাজার"';
    const csvContent = '\uFEFF' + headers + '\n' + sample;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('টেমপ্লেট ডাউনলোড হয়েছে');
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_phone.includes(searchTerm) ||
    (customer.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    const statusLabels: Record<string, string> = {
      pending: "অপেক্ষমান",
      processing: "প্রসেসিং",
      shipped: "শিপড",
      delivered: "ডেলিভারড",
      cancelled: "বাতিল"
    };
    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">কাস্টমার ম্যানেজমেন্ট</h1>
            <p className="text-muted-foreground">অর্ডারকারী কাস্টমারদের তালিকা</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              কাস্টমার যোগ
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              এক্সপোর্ট
            </Button>
            <Button variant="outline" className="gap-2 relative" asChild>
              <label>
                <Upload className="h-4 w-4" />
                ইমপোর্ট
                <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
              </label>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} className="gap-1 text-xs">
              <FileSpreadsheet className="h-3 w-3" />
              টেমপ্লেট
            </Button>
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-primary">{customers.length} জন</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              কাস্টমার তালিকা
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">লোড হচ্ছে...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                কোনো কাস্টমার পাওয়া যায়নি
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>নাম</TableHead>
                      <TableHead>ফোন</TableHead>
                      <TableHead className="hidden md:table-cell">ইমেইল</TableHead>
                      <TableHead className="hidden lg:table-cell">ঠিকানা</TableHead>
                      <TableHead className="text-center">অর্ডার</TableHead>
                      <TableHead className="hidden sm:table-cell text-right">মোট খরচ</TableHead>
                      <TableHead className="hidden md:table-cell">শেষ অর্ডার</TableHead>
                      <TableHead className="text-center">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-sm">{customer.customer_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs sm:text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {customer.customer_phone}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {customer.customer_email ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {customer.customer_email}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1 max-w-[200px] truncate text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                            {[customer.upazila, customer.district, customer.division].filter(Boolean).join(', ') || customer.shipping_address}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-sm">
                          {customer.total_orders}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right font-semibold text-sm">
                          ৳{customer.total_spent.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {new Date(customer.last_order_date).toLocaleDateString('bn-BD')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCustomer(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Orders Dialog */}
        <Dialog open={isOrdersDialogOpen} onOpenChange={setIsOrdersDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {selectedCustomer?.customer_name} - অর্ডার হিস্ট্রি
              </DialogTitle>
            </DialogHeader>
            
            {selectedCustomer && (
              <div className="space-y-4">
                {/* Customer Info */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">ফোন:</span>{" "}
                        <span className="font-medium">{selectedCustomer.customer_phone}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ইমেইল:</span>{" "}
                        <span className="font-medium">{selectedCustomer.customer_email || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">ঠিকানা:</span>{" "}
                        <span className="font-medium">{selectedCustomer.shipping_address}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Orders List */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>অর্ডার নম্বর</TableHead>
                      <TableHead>তারিখ</TableHead>
                      <TableHead className="text-right">মূল্য</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                      <TableHead>পেমেন্ট</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString('bn-BD')}</TableCell>
                        <TableCell className="text-right">৳{order.total_amount.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {order.payment_status === 'paid' ? 'পেইড' : 'অপেক্ষমান'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Customer Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                নতুন কাস্টমার যোগ করুন
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>নাম *</Label>
                  <Input
                    placeholder="কাস্টমারের নাম"
                    value={newCustomer.customer_name}
                    onChange={(e) => setNewCustomer(p => ({ ...p, customer_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ফোন নম্বর *</Label>
                  <Input
                    placeholder="01XXXXXXXXX"
                    value={newCustomer.customer_phone}
                    onChange={(e) => setNewCustomer(p => ({ ...p, customer_phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ইমেইল</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newCustomer.customer_email}
                    onChange={(e) => setNewCustomer(p => ({ ...p, customer_email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>বিভাগ</Label>
                  <Input
                    placeholder="বিভাগ"
                    value={newCustomer.division}
                    onChange={(e) => setNewCustomer(p => ({ ...p, division: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>জেলা</Label>
                  <Input
                    placeholder="জেলা"
                    value={newCustomer.district}
                    onChange={(e) => setNewCustomer(p => ({ ...p, district: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>উপজেলা</Label>
                  <Input
                    placeholder="উপজেলা"
                    value={newCustomer.upazila}
                    onChange={(e) => setNewCustomer(p => ({ ...p, upazila: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>গ্রাম</Label>
                  <Input
                    placeholder="গ্রাম"
                    value={newCustomer.village}
                    onChange={(e) => setNewCustomer(p => ({ ...p, village: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>শিপিং ঠিকানা</Label>
                <Textarea
                  placeholder="সম্পূর্ণ ঠিকানা"
                  value={newCustomer.shipping_address}
                  onChange={(e) => setNewCustomer(p => ({ ...p, shipping_address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>নোট</Label>
                <Textarea
                  placeholder="অতিরিক্ত তথ্য..."
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>বাতিল</Button>
                <Button onClick={handleAddCustomer} disabled={isSaving}>
                  {isSaving ? "সেভ হচ্ছে..." : "কাস্টমার যোগ করুন"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
