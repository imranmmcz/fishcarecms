import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Megaphone, Tag, Image, Bell, Copy, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

interface Campaign {
  id: string;
  title: string;
  title_bn: string | null;
  description: string | null;
  description_bn: string | null;
  campaign_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  discount_type: string | null;
  discount_value: number | null;
  coupon_code: string | null;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number | null;
  banner_image_url: string | null;
  banner_link: string | null;
  banner_position: string | null;
  show_popup: boolean | null;
  popup_delay_seconds: number | null;
  notification_channels: string[] | null;
  notification_message: string | null;
  notification_message_bn: string | null;
  target_audience: string | null;
  is_active: boolean | null;
  created_at: string;
}

const defaultForm: Partial<Campaign> = {
  title: "",
  title_bn: "",
  description: "",
  description_bn: "",
  campaign_type: "discount",
  status: "draft",
  start_date: "",
  end_date: "",
  discount_type: "percentage",
  discount_value: 0,
  coupon_code: "",
  min_order_amount: 0,
  max_discount_amount: 0,
  usage_limit: 0,
  banner_image_url: "",
  banner_link: "",
  banner_position: "homepage_top",
  show_popup: false,
  popup_delay_seconds: 3,
  notification_message: "",
  notification_message_bn: "",
  notification_channels: [],
  target_audience: "all",
  is_active: true,
};

export default function AdminCampaigns() {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Campaign>>(defaultForm);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("campaigns").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(isBn ? "ক্যাম্পেইন লোড করতে সমস্যা" : "Failed to load campaigns"); }
    else setCampaigns(data || []);
    setLoading(false);
  };

  const openNew = (type: string) => {
    setEditingId(null);
    setForm({ ...defaultForm, campaign_type: type });
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditingId(c.id);
    setForm({ ...c });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { toast.error(isBn ? "শিরোনাম প্রয়োজন" : "Title required"); return; }
    const payload = {
      title: form.title,
      title_bn: form.title_bn || null,
      description: form.description || null,
      description_bn: form.description_bn || null,
      campaign_type: form.campaign_type,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      discount_type: form.discount_type || null,
      discount_value: form.discount_value || 0,
      coupon_code: form.coupon_code || null,
      min_order_amount: form.min_order_amount || 0,
      max_discount_amount: form.max_discount_amount || null,
      usage_limit: form.usage_limit || null,
      banner_image_url: form.banner_image_url || null,
      banner_link: form.banner_link || null,
      banner_position: form.banner_position || null,
      show_popup: form.show_popup || false,
      popup_delay_seconds: form.popup_delay_seconds || 3,
      notification_message: form.notification_message || null,
      notification_message_bn: form.notification_message_bn || null,
      notification_channels: form.notification_channels || [],
      target_audience: form.target_audience || "all",
      is_active: form.is_active ?? true,
    };

    let error;
    if (editingId) {
      ({ error } = await (supabase as any).from("campaigns").update(payload).eq("id", editingId));
    } else {
      ({ error } = await (supabase as any).from("campaigns").insert(payload));
    }
    if (error) { toast.error(isBn ? "সংরক্ষণ ব্যর্থ" : "Save failed"); console.error(error); }
    else { toast.success(isBn ? "সংরক্ষিত!" : "Saved!"); setDialogOpen(false); fetchCampaigns(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isBn ? "মুছে ফেলতে চান?" : "Delete this campaign?")) return;
    const { error } = await (supabase as any).from("campaigns").delete().eq("id", id);
    if (error) toast.error(isBn ? "মুছতে ব্যর্থ" : "Delete failed");
    else { toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted"); fetchCampaigns(); }
  };

  const toggleStatus = async (c: Campaign) => {
    const newStatus = c.status === "active" ? "paused" : "active";
    await (supabase as any).from("campaigns").update({ status: newStatus }).eq("id", c.id);
    fetchCampaigns();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "discount": return <Tag className="h-4 w-4" />;
      case "banner": return <Image className="h-4 w-4" />;
      case "notification": return <Bell className="h-4 w-4" />;
      default: return <Megaphone className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, [string, string]> = {
      discount: ["ডিসকাউন্ট/কুপন", "Discount/Coupon"],
      banner: ["ব্যানার/প্রমো", "Banner/Promo"],
      notification: ["নোটিফিকেশন", "Notification"],
    };
    return isBn ? (labels[type]?.[0] || type) : (labels[type]?.[1] || type);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default", draft: "secondary", paused: "outline", expired: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const filtered = activeTab === "all" ? campaigns : campaigns.filter(c => c.campaign_type === activeTab);

  const updateForm = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isBn ? "ক্যাম্পেইন ম্যানেজমেন্ট" : "Campaign Management"}</h1>
            <p className="text-sm text-muted-foreground">{isBn ? "ডিসকাউন্ট, ব্যানার এবং নোটিফিকেশন ক্যাম্পেইন পরিচালনা করুন" : "Manage discount, banner and notification campaigns"}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => openNew("discount")} size="sm" className="gap-1.5">
              <Tag className="h-4 w-4" /> {isBn ? "ডিসকাউন্ট" : "Discount"}
            </Button>
            <Button onClick={() => openNew("banner")} size="sm" variant="outline" className="gap-1.5">
              <Image className="h-4 w-4" /> {isBn ? "ব্যানার" : "Banner"}
            </Button>
            <Button onClick={() => openNew("notification")} size="sm" variant="outline" className="gap-1.5">
              <Bell className="h-4 w-4" /> {isBn ? "নোটিফিকেশন" : "Notification"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: isBn ? "মোট" : "Total", count: campaigns.length, icon: Megaphone },
            { label: isBn ? "সক্রিয়" : "Active", count: campaigns.filter(c => c.status === "active").length, icon: Eye },
            { label: isBn ? "ডিসকাউন্ট" : "Discounts", count: campaigns.filter(c => c.campaign_type === "discount").length, icon: Tag },
            { label: isBn ? "ব্যানার" : "Banners", count: campaigns.filter(c => c.campaign_type === "banner").length, icon: Image },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs + Table */}
        <Card>
          <CardHeader className="pb-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">{isBn ? "সব" : "All"}</TabsTrigger>
                <TabsTrigger value="discount">{isBn ? "ডিসকাউন্ট" : "Discount"}</TabsTrigger>
                <TabsTrigger value="banner">{isBn ? "ব্যানার" : "Banner"}</TabsTrigger>
                <TabsTrigger value="notification">{isBn ? "নোটিফিকেশন" : "Notification"}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">{isBn ? "কোনো ক্যাম্পেইন নেই" : "No campaigns found"}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isBn ? "ক্যাম্পেইন" : "Campaign"}</TableHead>
                      <TableHead>{isBn ? "ধরন" : "Type"}</TableHead>
                      <TableHead>{isBn ? "স্ট্যাটাস" : "Status"}</TableHead>
                      <TableHead>{isBn ? "সময়কাল" : "Duration"}</TableHead>
                      <TableHead>{isBn ? "বিবরণ" : "Details"}</TableHead>
                      <TableHead className="text-right">{isBn ? "অ্যাকশন" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{isBn && c.title_bn ? c.title_bn : c.title}</p>
                            {c.coupon_code && (
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="outline" className="text-xs font-mono">{c.coupon_code}</Badge>
                                <button onClick={() => { navigator.clipboard.writeText(c.coupon_code!); toast.success("Copied!"); }}>
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                </button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">{getTypeIcon(c.campaign_type)} {getTypeLabel(c.campaign_type)}</div>
                        </TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.start_date ? format(new Date(c.start_date), "dd/MM/yy") : "—"}
                          {" → "}
                          {c.end_date ? format(new Date(c.end_date), "dd/MM/yy") : "∞"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {c.campaign_type === "discount" && c.discount_value ? (
                            <span>{c.discount_value}{c.discount_type === "percentage" ? "%" : "৳"} {isBn ? "ছাড়" : "off"}</span>
                          ) : c.campaign_type === "banner" ? (
                            <span>{c.banner_position}</span>
                          ) : (
                            <span>{c.target_audience}</span>
                          )}
                          {c.campaign_type === "discount" && c.usage_limit ? (
                            <span className="ml-2 text-muted-foreground">({c.used_count || 0}/{c.usage_limit})</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => toggleStatus(c)} title={c.status === "active" ? "Pause" : "Activate"}>
                              {c.status === "active" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Edit2 className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? (isBn ? "ক্যাম্পেইন সম্পাদনা" : "Edit Campaign") : (isBn ? "নতুন ক্যাম্পেইন" : "New Campaign")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{isBn ? "শিরোনাম (ইংরেজি)" : "Title (English)"}</Label>
                  <Input value={form.title || ""} onChange={e => updateForm("title", e.target.value)} />
                </div>
                <div>
                  <Label>{isBn ? "শিরোনাম (বাংলা)" : "Title (Bangla)"}</Label>
                  <Input value={form.title_bn || ""} onChange={e => updateForm("title_bn", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{isBn ? "ধরন" : "Campaign Type"}</Label>
                  <Select value={form.campaign_type} onValueChange={v => updateForm("campaign_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">{isBn ? "ডিসকাউন্ট/কুপন" : "Discount/Coupon"}</SelectItem>
                      <SelectItem value="banner">{isBn ? "ব্যানার/প্রমো" : "Banner/Promo"}</SelectItem>
                      <SelectItem value="notification">{isBn ? "নোটিফিকেশন" : "Notification"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isBn ? "স্ট্যাটাস" : "Status"}</Label>
                  <Select value={form.status} onValueChange={v => updateForm("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{isBn ? "ড্রাফট" : "Draft"}</SelectItem>
                      <SelectItem value="active">{isBn ? "সক্রিয়" : "Active"}</SelectItem>
                      <SelectItem value="paused">{isBn ? "বিরতি" : "Paused"}</SelectItem>
                      <SelectItem value="expired">{isBn ? "মেয়াদোত্তীর্ণ" : "Expired"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{isBn ? "শুরুর তারিখ" : "Start Date"}</Label>
                  <Input type="datetime-local" value={form.start_date || ""} onChange={e => updateForm("start_date", e.target.value)} />
                </div>
                <div>
                  <Label>{isBn ? "শেষ তারিখ" : "End Date"}</Label>
                  <Input type="datetime-local" value={form.end_date || ""} onChange={e => updateForm("end_date", e.target.value)} />
                </div>
              </div>

              {/* Discount Fields */}
              {form.campaign_type === "discount" && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">{isBn ? "ডিসকাউন্ট সেটিংস" : "Discount Settings"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{isBn ? "ছাড়ের ধরন" : "Discount Type"}</Label>
                        <Select value={form.discount_type || "percentage"} onValueChange={v => updateForm("discount_type", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">{isBn ? "শতকরা (%)" : "Percentage (%)"}</SelectItem>
                            <SelectItem value="fixed">{isBn ? "নির্দিষ্ট পরিমাণ (৳)" : "Fixed Amount (৳)"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{isBn ? "ছাড়ের পরিমাণ" : "Discount Value"}</Label>
                        <Input type="number" value={form.discount_value || 0} onChange={e => updateForm("discount_value", parseFloat(e.target.value))} />
                      </div>
                    </div>
                    <div>
                      <Label>{isBn ? "কুপন কোড" : "Coupon Code"}</Label>
                      <Input value={form.coupon_code || ""} onChange={e => updateForm("coupon_code", e.target.value.toUpperCase())} placeholder="e.g. SAVE20" className="font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{isBn ? "সর্বনিম্ন অর্ডার" : "Min Order Amount"}</Label>
                        <Input type="number" value={form.min_order_amount || 0} onChange={e => updateForm("min_order_amount", parseFloat(e.target.value))} />
                      </div>
                      <div>
                        <Label>{isBn ? "সর্বোচ্চ ছাড়" : "Max Discount"}</Label>
                        <Input type="number" value={form.max_discount_amount || ""} onChange={e => updateForm("max_discount_amount", parseFloat(e.target.value) || null)} />
                      </div>
                    </div>
                    <div>
                      <Label>{isBn ? "ব্যবহার সীমা" : "Usage Limit"}</Label>
                      <Input type="number" value={form.usage_limit || ""} onChange={e => updateForm("usage_limit", parseInt(e.target.value) || null)} placeholder={isBn ? "সীমাহীন" : "Unlimited"} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Banner Fields */}
              {form.campaign_type === "banner" && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">{isBn ? "ব্যানার সেটিংস" : "Banner Settings"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>{isBn ? "ব্যানার ইমেজ URL" : "Banner Image URL"}</Label>
                      <Input value={form.banner_image_url || ""} onChange={e => updateForm("banner_image_url", e.target.value)} placeholder="https://..." />
                      {form.banner_image_url && <img src={form.banner_image_url} alt="Banner" className="mt-2 max-h-32 rounded-lg object-cover" />}
                    </div>
                    <div>
                      <Label>{isBn ? "লিংক" : "Link URL"}</Label>
                      <Input value={form.banner_link || ""} onChange={e => updateForm("banner_link", e.target.value)} placeholder="/shop or https://..." />
                    </div>
                    <div>
                      <Label>{isBn ? "পজিশন" : "Position"}</Label>
                      <Select value={form.banner_position || "homepage_top"} onValueChange={v => updateForm("banner_position", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homepage_top">{isBn ? "হোমপেজ টপ" : "Homepage Top"}</SelectItem>
                          <SelectItem value="homepage_middle">{isBn ? "হোমপেজ মিডল" : "Homepage Middle"}</SelectItem>
                          <SelectItem value="shop_top">{isBn ? "শপ টপ" : "Shop Top"}</SelectItem>
                          <SelectItem value="sidebar">{isBn ? "সাইডবার" : "Sidebar"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={form.show_popup || false} onCheckedChange={v => updateForm("show_popup", v)} />
                      <Label>{isBn ? "পপআপ হিসেবে দেখান" : "Show as Popup"}</Label>
                    </div>
                    {form.show_popup && (
                      <div>
                        <Label>{isBn ? "পপআপ ডিলে (সেকেন্ড)" : "Popup Delay (seconds)"}</Label>
                        <Input type="number" value={form.popup_delay_seconds || 3} onChange={e => updateForm("popup_delay_seconds", parseInt(e.target.value))} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notification Fields */}
              {form.campaign_type === "notification" && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">{isBn ? "নোটিফিকেশন সেটিংস" : "Notification Settings"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>{isBn ? "বার্তা (ইংরেজি)" : "Message (English)"}</Label>
                      <Textarea value={form.notification_message || ""} onChange={e => updateForm("notification_message", e.target.value)} />
                    </div>
                    <div>
                      <Label>{isBn ? "বার্তা (বাংলা)" : "Message (Bangla)"}</Label>
                      <Textarea value={form.notification_message_bn || ""} onChange={e => updateForm("notification_message_bn", e.target.value)} />
                    </div>
                    <div>
                      <Label>{isBn ? "টার্গেট অডিয়েন্স" : "Target Audience"}</Label>
                      <Select value={form.target_audience || "all"} onValueChange={v => updateForm("target_audience", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{isBn ? "সকল ব্যবহারকারী" : "All Users"}</SelectItem>
                          <SelectItem value="customers">{isBn ? "শুধু কাস্টমার" : "Customers Only"}</SelectItem>
                          <SelectItem value="farmers">{isBn ? "শুধু কৃষক" : "Farmers Only"}</SelectItem>
                          <SelectItem value="bloggers">{isBn ? "শুধু ব্লগার" : "Bloggers Only"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-3">
                <Switch checked={form.is_active ?? true} onCheckedChange={v => updateForm("is_active", v)} />
                <Label>{isBn ? "সক্রিয়" : "Active"}</Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>{isBn ? "বাতিল" : "Cancel"}</Button>
                <Button onClick={handleSave}>{editingId ? (isBn ? "আপডেট" : "Update") : (isBn ? "তৈরি করুন" : "Create")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
