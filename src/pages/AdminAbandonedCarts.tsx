/**
 * Admin Abandoned Carts Page - Shows visitors/users who started checkout but didn't complete
 */
import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import {
  ShoppingCart, Eye, Loader2, Search, RefreshCw, Send, Phone, Mail,
  Globe, Clock, UserX, Bell, Trash2, AlertTriangle, ExternalLink,
} from "lucide-react";

interface AbandonedCart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  shipping_address: string | null;
  cart_items: any[];
  cart_total: number;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer_url: string | null;
  user_agent: string | null;
  status: string;
  recovery_sent: boolean;
  recovery_sent_at: string | null;
  recovered_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const AdminAbandonedCarts = () => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isBn = language === "bn";

  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notifyCart, setNotifyCart] = useState<AbandonedCart | null>(null);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyChannels, setNotifyChannels] = useState<string[]>(["in_app"]);
  const [sending, setSending] = useState(false);

  const fetchCarts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("abandoned_carts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCarts((data || []) as AbandonedCart[]);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch abandoned carts");
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchCarts(); }, [fetchCarts]);

  const filtered = carts.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.customer_name?.toLowerCase().includes(s) ||
      c.customer_phone?.includes(s) ||
      c.customer_email?.toLowerCase().includes(s)
    );
  });

  const stats = {
    total: carts.length,
    abandoned: carts.filter(c => c.status === "abandoned").length,
    recovered: carts.filter(c => c.status === "recovered").length,
    notified: carts.filter(c => c.recovery_sent).length,
    totalValue: carts.filter(c => c.status === "abandoned").reduce((s, c) => s + Number(c.cart_total), 0),
  };

  const handleSendNotification = async () => {
    if (!notifyCart) return;
    setSending(true);
    try {
      // If user has user_id, send in-app notification
      if (notifyCart.user_id && notifyChannels.includes("in_app")) {
        await supabase.from("notifications").insert({
          user_id: notifyCart.user_id,
          title: "আপনার কার্টে পণ্য অপেক্ষা করছে!",
          title_bn: "আপনার কার্টে পণ্য অপেক্ষা করছে!",
          message: notifyMessage || "আপনি কিছু পণ্য কার্টে রেখেছিলেন। এখনই অর্ডার সম্পূর্ণ করুন!",
          message_bn: notifyMessage || "আপনি কিছু পণ্য কার্টে রেখেছিলেন। এখনই অর্ডার সম্পূর্ণ করুন!",
          type: "cart_recovery",
          reference_type: "abandoned_cart",
          reference_id: notifyCart.id,
        });
      }

      // If phone available and SMS selected
      if (notifyCart.customer_phone && notifyChannels.includes("sms")) {
        await supabase.functions.invoke("send-sms", {
          body: {
            phone: notifyCart.customer_phone,
            message: notifyMessage || `প্রিয় ${notifyCart.customer_name || "গ্রাহক"}, আপনার কার্টে ${(notifyCart.cart_items || []).length}টি পণ্য অপেক্ষা করছে। এখনই অর্ডার সম্পূর্ণ করুন!`,
          },
        });
      }

      // If WhatsApp selected
      if (notifyCart.customer_phone && notifyChannels.includes("whatsapp")) {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            phone: notifyCart.customer_phone,
            message: notifyMessage || `প্রিয় ${notifyCart.customer_name || "গ্রাহক"}, আপনার কার্টে পণ্য অপেক্ষা করছে!`,
          },
        });
      }

      // Mark as notified
      await supabase.from("abandoned_carts").update({
        recovery_sent: true,
        recovery_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", notifyCart.id);

      // Log notification
      if (notifyCart.user_id) {
        await supabase.from("notification_logs").insert({
          user_id: notifyCart.user_id,
          channel: notifyChannels.join(","),
          message: notifyMessage || "কার্ট রিকভারি নোটিফিকেশন",
          status: "sent",
        });
      }

      toast.success(isBn ? "নোটিফিকেশন পাঠানো হয়েছে!" : "Notification sent!");
      setShowNotifyDialog(false);
      setNotifyCart(null);
      fetchCarts();
    } catch (err: any) {
      toast.error(err.message || "Failed to send notification");
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isBn ? "মুছে ফেলতে চান?" : "Delete this entry?")) return;
    await supabase.from("abandoned_carts").delete().eq("id", id);
    toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    fetchCarts();
  };

  const handleMarkRecovered = async (id: string) => {
    await supabase.from("abandoned_carts").update({
      status: "recovered",
      recovered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    toast.success(isBn ? "রিকভার্ড হিসেবে চিহ্নিত করা হয়েছে" : "Marked as recovered");
    fetchCarts();
  };

  const getSourceBadge = (source: string | null) => {
    const map: Record<string, { label: string; color: string }> = {
      direct: { label: "ডাইরেক্ট", color: "bg-muted text-muted-foreground" },
      google: { label: "Google", color: "bg-blue-100 text-blue-700" },
      facebook: { label: "Facebook", color: "bg-indigo-100 text-indigo-700" },
      referral: { label: "রেফারেল", color: "bg-green-100 text-green-700" },
    };
    const info = map[source || "direct"] || map.direct;
    return <Badge className={info.color}>{info.label}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserX className="h-6 w-6 text-destructive" />
              {isBn ? "পরিত্যক্ত কার্ট" : "Abandoned Carts"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isBn ? "যারা অর্ডার শুরু করেছেন কিন্তু সম্পূর্ণ করেননি" : "Visitors who started checkout but didn't complete"}
            </p>
          </div>
          <Button onClick={fetchCarts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" /> {isBn ? "রিফ্রেশ" : "Refresh"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">{isBn ? "মোট" : "Total"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{stats.abandoned}</p>
              <p className="text-xs text-muted-foreground">{isBn ? "পরিত্যক্ত" : "Abandoned"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.recovered}</p>
              <p className="text-xs text-muted-foreground">{isBn ? "রিকভার্ড" : "Recovered"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.notified}</p>
              <p className="text-xs text-muted-foreground">{isBn ? "নোটিফাই করা" : "Notified"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{formatPrice(stats.totalValue)}</p>
              <p className="text-xs text-muted-foreground">{isBn ? "হারানো মূল্য" : "Lost Value"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isBn ? "নাম, ফোন বা ইমেইল দিয়ে খুঁজুন..." : "Search by name, phone or email..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isBn ? "সকল স্ট্যাটাস" : "All Status"}</SelectItem>
              <SelectItem value="abandoned">{isBn ? "পরিত্যক্ত" : "Abandoned"}</SelectItem>
              <SelectItem value="recovered">{isBn ? "রিকভার্ড" : "Recovered"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{isBn ? "কোনো পরিত্যক্ত কার্ট পাওয়া যায়নি" : "No abandoned carts found"}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isBn ? "গ্রাহক" : "Customer"}</TableHead>
                      <TableHead className="hidden md:table-cell">{isBn ? "যোগাযোগ" : "Contact"}</TableHead>
                      <TableHead className="hidden sm:table-cell">{isBn ? "পণ্য" : "Items"}</TableHead>
                      <TableHead>{isBn ? "মূল্য" : "Value"}</TableHead>
                      <TableHead className="hidden lg:table-cell">{isBn ? "সোর্স" : "Source"}</TableHead>
                      <TableHead className="hidden md:table-cell">{isBn ? "সময়" : "Time"}</TableHead>
                      <TableHead>{isBn ? "স্ট্যাটাস" : "Status"}</TableHead>
                      <TableHead className="text-right">{isBn ? "অ্যাকশন" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((cart) => (
                      <TableRow key={cart.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {cart.customer_name || (isBn ? "অজ্ঞাত" : "Unknown")}
                          </div>
                          {cart.district && (
                            <div className="text-xs text-muted-foreground">{cart.district}</div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {cart.customer_phone && (
                            <div className="flex items-center gap-1 text-xs">
                              <Phone className="h-3 w-3" /> {cart.customer_phone}
                            </div>
                          )}
                          {cart.customer_email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" /> {cart.customer_email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary">{(cart.cart_items || []).length} {isBn ? "টি" : ""}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-xs sm:text-sm">{formatPrice(cart.cart_total)}</TableCell>
                        <TableCell className="hidden lg:table-cell">{getSourceBadge(cart.source)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(cart.created_at), {
                              addSuffix: true,
                              locale: isBn ? bn : undefined,
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {cart.status === "recovered" ? (
                            <Badge className="bg-green-100 text-green-700">{isBn ? "রিকভার্ড" : "Recovered"}</Badge>
                          ) : cart.recovery_sent ? (
                            <Badge className="bg-blue-100 text-blue-700">{isBn ? "নোটিফাই করা" : "Notified"}</Badge>
                          ) : (
                            <Badge variant="destructive">{isBn ? "পরিত্যক্ত" : "Abandoned"}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setSelectedCart(cart)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {cart.status === "abandoned" && (cart.customer_phone || cart.user_id) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-primary"
                                onClick={() => {
                                  setNotifyCart(cart);
                                  setNotifyMessage("");
                                  setNotifyChannels(cart.user_id ? ["in_app"] : cart.customer_phone ? ["sms"] : []);
                                  setShowNotifyDialog(true);
                                }}
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                            )}
                            {cart.status === "abandoned" && (
                              <Button size="icon" variant="ghost" className="text-green-600" onClick={() => handleMarkRecovered(cart.id)}>
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(cart.id)}>
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
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedCart} onOpenChange={() => setSelectedCart(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                {isBn ? "পরিত্যক্ত কার্টের বিস্তারিত" : "Abandoned Cart Details"}
              </DialogTitle>
            </DialogHeader>
            {selectedCart && (
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">{isBn ? "নাম:" : "Name:"}</span>
                    <p className="font-medium">{selectedCart.customer_name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{isBn ? "ফোন:" : "Phone:"}</span>
                    <p className="font-medium">{selectedCart.customer_phone || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{isBn ? "ইমেইল:" : "Email:"}</span>
                    <p className="font-medium">{selectedCart.customer_email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{isBn ? "এলাকা:" : "Location:"}</span>
                    <p className="font-medium">
                      {[selectedCart.upazila, selectedCart.district, selectedCart.division].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Source Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">{isBn ? "সোর্স:" : "Source:"}</span>
                    <p>{getSourceBadge(selectedCart.source)}</p>
                  </div>
                  {selectedCart.utm_source && (
                    <div>
                      <span className="text-muted-foreground">UTM:</span>
                      <p className="text-xs">{selectedCart.utm_source}/{selectedCart.utm_medium}/{selectedCart.utm_campaign}</p>
                    </div>
                  )}
                  {selectedCart.referrer_url && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">{isBn ? "রেফারার:" : "Referrer:"}</span>
                      <p className="text-xs truncate">{selectedCart.referrer_url}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Cart Items */}
                <div>
                  <h4 className="font-semibold mb-2">{isBn ? "কার্টের পণ্য" : "Cart Items"}</h4>
                  <div className="space-y-2">
                    {(selectedCart.cart_items || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-cover" />}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 font-bold">
                    <span>{isBn ? "মোট:" : "Total:"}</span>
                    <span>{formatPrice(selectedCart.cart_total)}</span>
                  </div>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {format(new Date(selectedCart.created_at), "PPpp", { locale: isBn ? bn : undefined })}
                  {selectedCart.recovery_sent && selectedCart.recovery_sent_at && (
                    <span className="ml-3">
                      <Bell className="h-3 w-3 inline mr-1" />
                      {isBn ? "নোটিফিকেশন:" : "Notified:"} {format(new Date(selectedCart.recovery_sent_at), "PPp", { locale: isBn ? bn : undefined })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Notify Dialog */}
        <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                {isBn ? "রিকভারি নোটিফিকেশন পাঠান" : "Send Recovery Notification"}
              </DialogTitle>
            </DialogHeader>
            {notifyCart && (
              <div className="space-y-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">{isBn ? "প্রাপক:" : "To:"}</span>
                  <span className="font-medium ml-2">{notifyCart.customer_name || notifyCart.customer_phone || "—"}</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{isBn ? "চ্যানেল নির্বাচন:" : "Select Channels:"}</label>
                  <div className="flex flex-wrap gap-3">
                    {notifyCart.user_id && (
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={notifyChannels.includes("in_app")}
                          onCheckedChange={(c) => setNotifyChannels(c ? [...notifyChannels, "in_app"] : notifyChannels.filter(ch => ch !== "in_app"))}
                        />
                        {isBn ? "ইন-অ্যাপ" : "In-App"}
                      </label>
                    )}
                    {notifyCart.customer_phone && (
                      <>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={notifyChannels.includes("sms")}
                            onCheckedChange={(c) => setNotifyChannels(c ? [...notifyChannels, "sms"] : notifyChannels.filter(ch => ch !== "sms"))}
                          />
                          SMS
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={notifyChannels.includes("whatsapp")}
                            onCheckedChange={(c) => setNotifyChannels(c ? [...notifyChannels, "whatsapp"] : notifyChannels.filter(ch => ch !== "whatsapp"))}
                          />
                          WhatsApp
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{isBn ? "মেসেজ:" : "Message:"}</label>
                  <Textarea
                    value={notifyMessage}
                    onChange={(e) => setNotifyMessage(e.target.value)}
                    placeholder={isBn ? "আপনার কার্টে পণ্য অপেক্ষা করছে! এখনই অর্ডার সম্পূর্ণ করুন।" : "Your cart is waiting! Complete your order now."}
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNotifyDialog(false)}>
                    {isBn ? "বাতিল" : "Cancel"}
                  </Button>
                  <Button onClick={handleSendNotification} disabled={sending || notifyChannels.length === 0}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                    {isBn ? "পাঠান" : "Send"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminAbandonedCarts;
