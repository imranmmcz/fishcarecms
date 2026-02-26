import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  FileText, Plus, Edit, Trash2, Globe, Eye, EyeOff,
  Search, Clock, ExternalLink, Menu
} from "lucide-react";
import { format } from "date-fns";

interface CustomPage {
  id: string;
  title: string;
  title_bn: string | null;
  slug: string;
  content: string | null;
  content_type: string;
  meta_title: string | null;
  meta_description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  title: "",
  title_bn: "",
  slug: "",
  content: "",
  content_type: "rich",
  meta_title: "",
  meta_description: "",
  status: "draft" as "draft" | "published",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminPages() {
  const { toast } = useToast();
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [deletingPage, setDeletingPage] = useState<CustomPage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [slugManual, setSlugManual] = useState(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_pages")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setPages(data as CustomPage[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const openCreate = () => {
    setEditingPage(null);
    setForm(emptyForm);
    setSlugManual(false);
    setDialogOpen(true);
  };

  const openEdit = (page: CustomPage) => {
    setEditingPage(page);
    setForm({
      title: page.title,
      title_bn: page.title_bn || "",
      slug: page.slug,
      content: page.content || "",
      content_type: page.content_type || "rich",
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
      status: page.status as "draft" | "published",
    });
    setSlugManual(true);
    setDialogOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setForm(f => ({
      ...f,
      title: val,
      slug: slugManual ? f.slug : slugify(val),
    }));
  };

  const handleSlugChange = (val: string) => {
    setSlugManual(true);
    setForm(f => ({ ...f, slug: slugify(val) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Error", description: "পেজের শিরোনাম দিন", variant: "destructive" });
      return;
    }
    if (!form.slug.trim()) {
      toast({ title: "Error", description: "Slug URL দিন", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        title_bn: form.title_bn.trim() || null,
        slug: form.slug.trim(),
        content: form.content,
        content_type: form.content_type,
        meta_title: form.meta_title.trim() || null,
        meta_description: form.meta_description.trim() || null,
        status: form.status,
      };

      let error;
      if (editingPage) {
        ({ error } = await supabase.from("custom_pages").update(payload).eq("id", editingPage.id));
      } else {
        ({ error } = await supabase.from("custom_pages").insert(payload));
      }

      if (error) throw error;
      toast({ title: "সফল!", description: editingPage ? "পেজ আপডেট হয়েছে" : "নতুন পেজ তৈরি হয়েছে" });
      setDialogOpen(false);
      fetchPages();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message || "সংরক্ষণ ব্যর্থ হয়েছে", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingPage) return;
    const { error } = await supabase.from("custom_pages").delete().eq("id", deletingPage.id);
    if (error) {
      toast({ title: "ত্রুটি", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "মুছে ফেলা হয়েছে", description: "পেজটি সফলভাবে ডিলিট হয়েছে" });
      fetchPages();
    }
    setDeletingPage(null);
  };

  const toggleStatus = async (page: CustomPage) => {
    const newStatus = page.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("custom_pages").update({ status: newStatus }).eq("id", page.id);
    if (!error) {
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, status: newStatus } : p));
      toast({ title: newStatus === "published" ? "প্রকাশিত হয়েছে ✓" : "ড্রাফটে সরানো হয়েছে" });
    }
  };

  const addToMenu = async (page: CustomPage) => {
    try {
      // Fetch current header content
      const { data, error: fetchErr } = await supabase
        .from("page_content")
        .select("content")
        .eq("section_key", "header")
        .single();
      
      if (fetchErr || !data) throw new Error("হেডার ডাটা পাওয়া যায়নি");
      
      const headerContent = data.content as Record<string, any>;
      const navItems = headerContent.navItems || [];
      
      // Check if already exists
      const pagePath = `/pages/${page.slug}`;
      if (navItems.some((item: any) => item.path === pagePath)) {
        toast({ title: "ইতোমধ্যে আছে", description: "এই পেজটি মেনুতে আগে থেকেই আছে" });
        return;
      }
      
      // Add to nav items
      navItems.push({
        label_bn: page.title_bn || page.title,
        label_en: page.title,
        path: pagePath,
      });
      
      const { error: updateErr } = await supabase
        .from("page_content")
        .update({ content: { ...headerContent, navItems }, updated_at: new Date().toISOString() })
        .eq("section_key", "header");
      
      if (updateErr) throw updateErr;
      toast({ title: "সফল!", description: `"${page.title}" মেনুতে যোগ করা হয়েছে` });
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    }
  };

  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              পেজ ম্যানেজমেন্ট
            </h1>
            <p className="text-muted-foreground text-sm">কাস্টম পেজ তৈরি, সম্পাদনা ও পরিচালনা করুন</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> নতুন পেজ তৈরি করুন
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="পেজ খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Pages List */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <FileText className="h-12 w-12 opacity-30" />
              <p className="text-base font-medium">
                {search ? "কোনো পেজ পাওয়া যায়নি" : "এখনো কোনো পেজ তৈরি হয়নি"}
              </p>
              {!search && (
                <Button onClick={openCreate} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> প্রথম পেজ তৈরি করুন
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map(page => (
              <Card key={page.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${page.status === "published" ? "bg-emerald-500/10" : "bg-muted"}`}>
                      {page.status === "published"
                        ? <Globe className="h-4 w-4 text-emerald-500" />
                        : <Clock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{page.title}</h3>
                        {page.title_bn && <span className="text-muted-foreground text-sm">({page.title_bn})</span>}
                        <Badge variant={page.status === "published" ? "default" : "secondary"} className="text-xs">
                          {page.status === "published" ? "প্রকাশিত" : "ড্রাফট"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          /pages/{page.slug}
                        </span>
                        <span>আপডেট: {format(new Date(page.updated_at), "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Add to menu */}
                    {page.status === "published" && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => addToMenu(page)} title="মেনুতে যোগ করুন">
                        <Menu className="h-3.5 w-3.5" /> মেনুতে যোগ
                      </Button>
                    )}
                    {/* Publish toggle */}
                    <div className="flex items-center gap-1.5">
                      {page.status === "published"
                        ? <Eye className="h-3.5 w-3.5 text-emerald-500" />
                        : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      <Switch
                        checked={page.status === "published"}
                        onCheckedChange={() => toggleStatus(page)}
                        className="scale-75"
                      />
                    </div>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(page)}>
                      <Edit className="h-3.5 w-3.5" /> সম্পাদনা
                    </Button>
                    <Button
                      size="sm" variant="outline"
                      className="gap-1 text-destructive hover:text-destructive hover:border-destructive"
                      onClick={() => setDeletingPage(page)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {editingPage ? "পেজ সম্পাদনা করুন" : "নতুন পেজ তৈরি করুন"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Title fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>পেজের শিরোনাম (ইংরেজি) <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Page Title"
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>পেজের শিরোনাম (বাংলা)</Label>
                <Input
                  placeholder="পেজ শিরোনাম"
                  value={form.title_bn}
                  onChange={e => setForm(f => ({ ...f, title_bn: e.target.value }))}
                />
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                Slug URL <span className="text-destructive">*</span>
                <span className="text-xs font-normal text-muted-foreground">(স্বয়ংক্রিয়ভাবে তৈরি হয়)</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">/pages/</span>
                <Input
                  placeholder="my-page-slug"
                  value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Content Editor */}
            <div className="space-y-1.5">
              <Label>পেজ কন্টেন্ট</Label>
              <RichTextEditor
                value={form.content}
                onChange={val => setForm(f => ({ ...f, content: val }))}
                placeholder="পেজের মূল বিষয়বস্তু লিখুন বা HTML পেস্ট করুন..."
              />
            </div>

            {/* SEO Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Globe className="h-4 w-4 text-primary" />
                SEO সেটিংস
              </h3>
              <div className="space-y-1.5">
                <Label className="flex items-center justify-between">
                  Meta Title
                  <span className="text-xs text-muted-foreground">{form.meta_title.length}/60</span>
                </Label>
                <Input
                  placeholder="পেজের SEO টাইটেল (সর্বোচ্চ ৬০ অক্ষর)"
                  value={form.meta_title}
                  maxLength={60}
                  onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center justify-between">
                  Meta Description
                  <span className="text-xs text-muted-foreground">{form.meta_description.length}/160</span>
                </Label>
                <Textarea
                  placeholder="পেজের SEO বিবরণ (সর্বোচ্চ ১৬০ অক্ষর)"
                  value={form.meta_description}
                  maxLength={160}
                  rows={3}
                  onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                />
              </div>
            </div>

            {/* Publish Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
              <div>
                <p className="font-medium text-sm">পেজ স্ট্যাটাস</p>
                <p className="text-xs text-muted-foreground">
                  {form.status === "published"
                    ? "পেজটি সর্বজনীনভাবে দেখা যাবে"
                    : "পেজটি ড্রাফটে থাকবে, শুধু অ্যাডমিন দেখতে পাবেন"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${form.status === "published" ? "text-emerald-500" : "text-muted-foreground"}`}>
                  {form.status === "published" ? "প্রকাশিত" : "ড্রাফট"}
                </span>
                <Switch
                  checked={form.status === "published"}
                  onCheckedChange={v => setForm(f => ({ ...f, status: v ? "published" : "draft" }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>বাতিল</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : editingPage ? "আপডেট করুন" : "পেজ তৈরি করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingPage} onOpenChange={open => !open && setDeletingPage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>পেজ ডিলিট করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              "<strong>{deletingPage?.title}</strong>" পেজটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ডিলিট করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
