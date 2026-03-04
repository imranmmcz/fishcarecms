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
  Search, Clock, ExternalLink, Menu, LogIn, UserPlus, Save, Loader2,
  Navigation, X, Home, ShoppingBag, LayoutGrid, TrendingUp, CheckCircle,
  Fish, MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

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

interface AuthPageContent {
  section_key: string;
  section_name: string;
  content: Record<string, any>;
}

interface NavItem {
  label_bn: string;
  label_en: string;
  path: string;
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
  addToMenu: false,
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

  // Nav items (menu pages) state
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [headerContent, setHeaderContent] = useState<Record<string, any> | null>(null);

  // Auth page editing state
  const [authPages, setAuthPages] = useState<AuthPageContent[]>([]);
  const [editingAuthPage, setEditingAuthPage] = useState<AuthPageContent | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authForm, setAuthForm] = useState<Record<string, any>>({});
  const [authSaving, setAuthSaving] = useState(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    const [pagesRes, authRes, headerRes] = await Promise.all([
      supabase.from("custom_pages").select("*").order("created_at", { ascending: false }),
      supabase.from("page_content").select("section_key, section_name, content").in("section_key", ["auth_login", "auth_register"]),
      supabase.from("page_content").select("content").eq("section_key", "header").single(),
    ]);
    if (!pagesRes.error && pagesRes.data) setPages(pagesRes.data as CustomPage[]);
    if (!authRes.error && authRes.data) setAuthPages(authRes.data as AuthPageContent[]);
    if (!headerRes.error && headerRes.data) {
      const hContent = headerRes.data.content as Record<string, any>;
      setHeaderContent(hContent);
      setNavItems((hContent.navItems || []) as NavItem[]);
    }
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
    const pagePath = `/pages/${page.slug}`;
    const isInMenu = navItems.some((item) => item.path === pagePath);
    setForm({
      title: page.title,
      title_bn: page.title_bn || "",
      slug: page.slug,
      content: page.content || "",
      content_type: page.content_type || "rich",
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
      status: page.status as "draft" | "published",
      addToMenu: isInMenu,
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

      // Handle menu add/remove
      if (form.addToMenu && form.status === "published" && headerContent) {
        const pagePath = `/pages/${form.slug.trim()}`;
        const currentNavItems = [...(headerContent.navItems || [])];
        if (!currentNavItems.some((item: any) => item.path === pagePath)) {
          currentNavItems.push({
            label_bn: form.title_bn.trim() || form.title.trim(),
            label_en: form.title.trim(),
            path: pagePath,
          });
          await supabase
            .from("page_content")
            .update({ content: { ...headerContent, navItems: currentNavItems }, updated_at: new Date().toISOString() })
            .eq("section_key", "header");
        }
      }

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
      const { data, error: fetchErr } = await supabase
        .from("page_content").select("content").eq("section_key", "header").single();
      if (fetchErr || !data) throw new Error("হেডার ডাটা পাওয়া যায়নি");
      const hContent = data.content as Record<string, any>;
      const items = hContent.navItems || [];
      const pagePath = `/pages/${page.slug}`;
      if (items.some((item: any) => item.path === pagePath)) {
        toast({ title: "ইতোমধ্যে আছে", description: "এই পেজটি মেনুতে আগে থেকেই আছে" });
        return;
      }
      items.push({ label_bn: page.title_bn || page.title, label_en: page.title, path: pagePath });
      const { error: updateErr } = await supabase
        .from("page_content")
        .update({ content: { ...hContent, navItems: items }, updated_at: new Date().toISOString() })
        .eq("section_key", "header");
      if (updateErr) throw updateErr;
      toast({ title: "সফল!", description: `"${page.title}" মেনুতে যোগ করা হয়েছে` });
      fetchPages();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    }
  };

  const removeFromMenu = async (path: string) => {
    if (!headerContent) return;
    try {
      const updatedNavItems = (headerContent.navItems || []).filter((item: any) => item.path !== path);
      const { error } = await supabase
        .from("page_content")
        .update({ content: { ...headerContent, navItems: updatedNavItems }, updated_at: new Date().toISOString() })
        .eq("section_key", "header");
      if (error) throw error;
      toast({ title: "সফল!", description: "মেনু থেকে সরানো হয়েছে" });
      fetchPages();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    }
  };

  // Get icon for known system paths
  const getNavIcon = (path: string) => {
    if (path === "/") return Home;
    if (path === "/modules") return LayoutGrid;
    if (path === "/shop") return ShoppingBag;
    if (path === "/market-price") return TrendingUp;
    return Navigation;
  };

  // Menu item edit state
  const [editingNavIndex, setEditingNavIndex] = useState<number | null>(null);
  const [navEditForm, setNavEditForm] = useState({ label_bn: "", label_en: "", path: "" });
  const [navEditDialogOpen, setNavEditDialogOpen] = useState(false);
  const [navEditSaving, setNavEditSaving] = useState(false);

  const openNavEdit = (item: NavItem, index: number) => {
    setEditingNavIndex(index);
    setNavEditForm({ label_bn: item.label_bn, label_en: item.label_en, path: item.path });
    setNavEditDialogOpen(true);
  };

  const handleNavEditSave = async () => {
    if (editingNavIndex === null || !headerContent) return;
    if (!navEditForm.label_bn.trim() || !navEditForm.path.trim()) {
      toast({ title: "ত্রুটি", description: "লেবেল ও পাথ আবশ্যক", variant: "destructive" });
      return;
    }
    setNavEditSaving(true);
    try {
      const updatedNavItems = [...(headerContent.navItems || [])];
      updatedNavItems[editingNavIndex] = { ...navEditForm };
      const { error } = await supabase
        .from("page_content")
        .update({ content: { ...headerContent, navItems: updatedNavItems }, updated_at: new Date().toISOString() })
        .eq("section_key", "header");
      if (error) throw error;
      toast({ title: "সফল!", description: "মেনু আইটেম আপডেট হয়েছে" });
      setNavEditDialogOpen(false);
      fetchPages();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setNavEditSaving(false);
    }
  };

  // Auth page edit handlers
  const openAuthEdit = (ap: AuthPageContent) => {
    setEditingAuthPage(ap);
    setAuthForm({ ...ap.content });
    setAuthDialogOpen(true);
  };

  const handleAuthSave = async () => {
    if (!editingAuthPage) return;
    setAuthSaving(true);
    try {
      const { error } = await supabase
        .from("page_content")
        .update({ content: authForm, updated_at: new Date().toISOString() })
        .eq("section_key", editingAuthPage.section_key);
      if (error) throw error;
      toast({ title: "সফল!", description: "পেজ সেটিংস আপডেট হয়েছে" });
      setAuthDialogOpen(false);
      fetchPages();
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setAuthSaving(false);
    }
  };

  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const authLoginPage = authPages.find(a => a.section_key === "auth_login");
  const authRegisterPage = authPages.find(a => a.section_key === "auth_register");

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

        {/* System Pages (Login / Registration) */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">সিস্টেম পেজ</h2>
          <div className="grid gap-3">
            {authLoginPage && (
              <Card className="hover:shadow-md transition-shadow border-primary/20">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 p-2 rounded-lg shrink-0 bg-primary/10">
                      <LogIn className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">লগইন পেজ</h3>
                        <Badge variant="secondary" className="text-xs">সিস্টেম</Badge>
                        <Badge variant="default" className="text-xs">প্রকাশিত</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> /auth (লগইন)
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => openAuthEdit(authLoginPage)}>
                    <Edit className="h-3.5 w-3.5" /> সম্পাদনা
                  </Button>
                </CardContent>
              </Card>
            )}
            {authRegisterPage && (
              <Card className="hover:shadow-md transition-shadow border-primary/20">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 p-2 rounded-lg shrink-0 bg-primary/10">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">রেজিস্ট্রেশন পেজ</h3>
                        <Badge variant="secondary" className="text-xs">সিস্টেম</Badge>
                        <Badge variant="default" className="text-xs">প্রকাশিত</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> /auth (রেজিস্ট্রেশন)
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => openAuthEdit(authRegisterPage)}>
                    <Edit className="h-3.5 w-3.5" /> সম্পাদনা
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Fish Species System Page */}
            <Card className="hover:shadow-md transition-shadow border-primary/20">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 p-2 rounded-lg shrink-0 bg-primary/10">
                    <Fish className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">বাংলাদেশে প্রচলিত মাছ</h3>
                      <Badge variant="secondary" className="text-xs">সিস্টেম</Badge>
                      <Badge variant="default" className="text-xs">প্রকাশিত</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> /fish-species
                      </span>
                      <span>পেজ বিল্ডার থেকে সম্পূর্ণ এডিট করুন</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1" asChild>
                  <Link to="/admin/page-builder">
                    <Edit className="h-3.5 w-3.5" /> সম্পাদনা
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Blog System Page */}
            <Card className="hover:shadow-md transition-shadow border-primary/20">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 p-2 rounded-lg shrink-0 bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">ব্লগ / কমিউনিটি</h3>
                      <Badge variant="secondary" className="text-xs">সিস্টেম</Badge>
                      <Badge variant="default" className="text-xs">প্রকাশিত</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> /blog
                      </span>
                      <span>ব্লগ ম্যানেজমেন্ট থেকে পোস্ট ও কমেন্ট পরিচালনা করুন</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1" asChild>
                  <Link to="/admin/blog">
                    <Edit className="h-3.5 w-3.5" /> সম্পাদনা
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Menu Pages (Nav Items) */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
            <Navigation className="h-3.5 w-3.5" /> মেনু পেজসমূহ
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            বর্তমানে মেনু বারে যে পেজগুলো প্রদর্শিত হচ্ছে। নতুন পেজ তৈরি করে "মেনুতে যোগ করুন" চেক করলে স্বয়ংক্রিয়ভাবে যুক্ত হবে।
          </p>
          <div className="grid gap-2">
            {navItems.map((item, index) => {
              const IconComp = getNavIcon(item.path);
              const isSystemPage = !item.path.startsWith("/pages/");
              return (
                <Card key={index} className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                        <IconComp className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm text-foreground">{item.label_bn}</h3>
                          <span className="text-xs text-muted-foreground">({item.label_en})</span>
                          {isSystemPage && <Badge variant="secondary" className="text-[10px] py-0">সিস্টেম</Badge>}
                          <Badge variant="outline" className="text-[10px] py-0 gap-1">
                            <CheckCircle className="h-2.5 w-2.5" /> মেনুতে আছে
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <ExternalLink className="h-3 w-3" /> {item.path}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        onClick={() => openNavEdit(item, index)}
                      >
                        <Edit className="h-3 w-3" /> সম্পাদনা
                      </Button>
                      {!isSystemPage && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-destructive hover:text-destructive hover:border-destructive text-xs"
                          onClick={() => removeFromMenu(item.path)}
                        >
                          <X className="h-3 w-3" /> সরান
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">কাস্টম পেজ</h2>
          <div className="relative max-w-sm mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="পেজ খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Pages List */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <FileText className="h-12 w-12 opacity-30" />
              <p className="text-base font-medium">
                {search ? "কোনো পেজ পাওয়া যায়নি" : "এখনো কোনো কাস্টম পেজ তৈরি হয়নি"}
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
                    <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${page.status === "published" ? "bg-primary/10" : "bg-muted"}`}>
                      {page.status === "published"
                        ? <Globe className="h-4 w-4 text-primary" />
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
                          <ExternalLink className="h-3 w-3" /> /pages/{page.slug}
                        </span>
                        <span>আপডেট: {format(new Date(page.updated_at), "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {page.status === "published" && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => addToMenu(page)} title="মেনুতে যোগ করুন">
                        <Menu className="h-3.5 w-3.5" /> মেনুতে যোগ
                      </Button>
                    )}
                    <div className="flex items-center gap-1.5">
                      {page.status === "published"
                        ? <Eye className="h-3.5 w-3.5 text-primary" />
                        : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      <Switch checked={page.status === "published"} onCheckedChange={() => toggleStatus(page)} className="scale-75" />
                    </div>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(page)}>
                      <Edit className="h-3.5 w-3.5" /> সম্পাদনা
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive hover:border-destructive" onClick={() => setDeletingPage(page)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Custom Page Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {editingPage ? "পেজ সম্পাদনা করুন" : "নতুন পেজ তৈরি করুন"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>পেজের শিরোনাম (ইংরেজি) <span className="text-destructive">*</span></Label>
                <Input placeholder="Page Title" value={form.title} onChange={e => handleTitleChange(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>পেজের শিরোনাম (বাংলা)</Label>
                <Input placeholder="পেজ শিরোনাম" value={form.title_bn} onChange={e => setForm(f => ({ ...f, title_bn: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                Slug URL <span className="text-destructive">*</span>
                <span className="text-xs font-normal text-muted-foreground">(স্বয়ংক্রিয়ভাবে তৈরি হয়)</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">/pages/</span>
                <Input placeholder="my-page-slug" value={form.slug} onChange={e => handleSlugChange(e.target.value)} className="font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>পেজ কন্টেন্ট</Label>
              <RichTextEditor value={form.content} onChange={val => setForm(f => ({ ...f, content: val }))} placeholder="পেজের মূল বিষয়বস্তু লিখুন বা HTML পেস্ট করুন..." />
            </div>
            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Globe className="h-4 w-4 text-primary" /> SEO সেটিংস
              </h3>
              <div className="space-y-1.5">
                <Label className="flex items-center justify-between">Meta Title <span className="text-xs text-muted-foreground">{form.meta_title.length}/60</span></Label>
                <Input placeholder="পেজের SEO টাইটেল" value={form.meta_title} maxLength={60} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center justify-between">Meta Description <span className="text-xs text-muted-foreground">{form.meta_description.length}/160</span></Label>
                <Textarea placeholder="পেজের SEO বিবরণ" value={form.meta_description} maxLength={160} rows={3} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
              <div>
                <p className="font-medium text-sm">পেজ স্ট্যাটাস</p>
                <p className="text-xs text-muted-foreground">
                  {form.status === "published" ? "পেজটি সর্বজনীনভাবে দেখা যাবে" : "পেজটি ড্রাফটে থাকবে, শুধু অ্যাডমিন দেখতে পাবেন"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${form.status === "published" ? "text-primary" : "text-muted-foreground"}`}>
                  {form.status === "published" ? "প্রকাশিত" : "ড্রাফট"}
                </span>
                <Switch checked={form.status === "published"} onCheckedChange={v => setForm(f => ({ ...f, status: v ? "published" : "draft" }))} />
              </div>
            </div>
            {/* Add to Menu option */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
              <div>
                <p className="font-medium text-sm flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-primary" />
                  মেনু বারে যোগ করুন
                </p>
                <p className="text-xs text-muted-foreground">
                  এই পেজটি সাইটের হেডার নেভিগেশন মেনুতে দেখাবে
                </p>
              </div>
              <Switch
                checked={form.addToMenu}
                onCheckedChange={v => setForm(f => ({ ...f, addToMenu: v }))}
              />
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

      {/* Auth Page Edit Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingAuthPage?.section_key === "auth_login" ? <LogIn className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
              {editingAuthPage?.section_key === "auth_login" ? "লগইন পেজ সম্পাদনা" : "রেজিস্ট্রেশন পেজ সম্পাদনা"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {editingAuthPage?.section_key === "auth_login" && (
              <>
                <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  💡 লোগো এবং সাইটের নাম হেডার সেকশনের সেটিংস থেকে নেওয়া হয়।
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>হেডিং টেক্সট</Label>
                    <Input value={authForm.heading || ""} onChange={e => setAuthForm(f => ({ ...f, heading: e.target.value }))} placeholder="মাছ চাষ ম্যানেজমেন্ট" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>সাব-হেডিং</Label>
                    <Input value={authForm.description || ""} onChange={e => setAuthForm(f => ({ ...f, description: e.target.value }))} placeholder="আপনার অ্যাকাউন্টে প্রবেশ করুন" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>লগইন বাটন টেক্সট</Label>
                    <Input value={authForm.buttonText || ""} onChange={e => setAuthForm(f => ({ ...f, buttonText: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>হোম বাটন টেক্সট</Label>
                    <Input value={authForm.homeButtonText || ""} onChange={e => setAuthForm(f => ({ ...f, homeButtonText: e.target.value }))} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>ইমেইল লেবেল</Label>
                    <Input value={authForm.emailLabel || ""} onChange={e => setAuthForm(f => ({ ...f, emailLabel: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ইমেইল প্লেসহোল্ডার</Label>
                    <Input value={authForm.emailPlaceholder || ""} onChange={e => setAuthForm(f => ({ ...f, emailPlaceholder: e.target.value }))} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>পাসওয়ার্ড লেবেল</Label>
                    <Input value={authForm.passwordLabel || ""} onChange={e => setAuthForm(f => ({ ...f, passwordLabel: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>পাসওয়ার্ড প্লেসহোল্ডার</Label>
                    <Input value={authForm.passwordPlaceholder || ""} onChange={e => setAuthForm(f => ({ ...f, passwordPlaceholder: e.target.value }))} />
                  </div>
                </div>
                <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">ডেমো অ্যাকাউন্ট</h4>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">দেখান</Label>
                      <Switch checked={authForm.showDemoAccount !== false} onCheckedChange={v => setAuthForm(f => ({ ...f, showDemoAccount: v }))} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>ডেমো টেক্সট</Label>
                      <Input value={authForm.demoText || ""} onChange={e => setAuthForm(f => ({ ...f, demoText: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>ডেমো ইমেইল</Label>
                      <Input value={authForm.demoEmail || ""} onChange={e => setAuthForm(f => ({ ...f, demoEmail: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>ডেমো পাসওয়ার্ড</Label>
                      <Input value={authForm.demoPassword || ""} onChange={e => setAuthForm(f => ({ ...f, demoPassword: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {editingAuthPage?.section_key === "auth_register" && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>রেজিস্ট্রেশন বাটন টেক্সট</Label>
                    <Input value={authForm.buttonText || ""} onChange={e => setAuthForm(f => ({ ...f, buttonText: e.target.value }))} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>নাম লেবেল</Label>
                    <Input value={authForm.nameLabel || ""} onChange={e => setAuthForm(f => ({ ...f, nameLabel: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>নাম প্লেসহোল্ডার</Label>
                    <Input value={authForm.namePlaceholder || ""} onChange={e => setAuthForm(f => ({ ...f, namePlaceholder: e.target.value }))} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>ইমেইল লেবেল</Label>
                    <Input value={authForm.emailLabel || ""} onChange={e => setAuthForm(f => ({ ...f, emailLabel: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ইমেইল প্লেসহোল্ডার</Label>
                    <Input value={authForm.emailPlaceholder || ""} onChange={e => setAuthForm(f => ({ ...f, emailPlaceholder: e.target.value }))} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>পাসওয়ার্ড লেবেল</Label>
                    <Input value={authForm.passwordLabel || ""} onChange={e => setAuthForm(f => ({ ...f, passwordLabel: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>পাসওয়ার্ড প্লেসহোল্ডার</Label>
                    <Input value={authForm.passwordPlaceholder || ""} onChange={e => setAuthForm(f => ({ ...f, passwordPlaceholder: e.target.value }))} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>কনফার্ম পাসওয়ার্ড লেবেল</Label>
                    <Input value={authForm.confirmPasswordLabel || ""} onChange={e => setAuthForm(f => ({ ...f, confirmPasswordLabel: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>কনফার্ম পাসওয়ার্ড প্লেসহোল্ডার</Label>
                    <Input value={authForm.confirmPasswordPlaceholder || ""} onChange={e => setAuthForm(f => ({ ...f, confirmPasswordPlaceholder: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div>
                    <p className="font-medium text-sm">ঠিকানা ফিল্ড দেখান</p>
                    <p className="text-xs text-muted-foreground">মোবাইল, বিভাগ, জেলা, উপজেলা, গ্রাম</p>
                  </div>
                  <Switch checked={authForm.showAddressFields !== false} onCheckedChange={v => setAuthForm(f => ({ ...f, showAddressFields: v }))} />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAuthDialogOpen(false)}>বাতিল</Button>
            <Button onClick={handleAuthSave} disabled={authSaving} className="gap-2">
              {authSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {authSaving ? "সংরক্ষণ হচ্ছে..." : "আপডেট করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nav Item Edit Dialog */}
      <Dialog open={navEditDialogOpen} onOpenChange={setNavEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>মেনু আইটেম সম্পাদনা</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>বাংলা লেবেল</Label>
              <Input value={navEditForm.label_bn} onChange={e => setNavEditForm(f => ({ ...f, label_bn: e.target.value }))} placeholder="বাংলা নাম" />
            </div>
            <div className="space-y-2">
              <Label>English Label</Label>
              <Input value={navEditForm.label_en} onChange={e => setNavEditForm(f => ({ ...f, label_en: e.target.value }))} placeholder="English name" />
            </div>
            <div className="space-y-2">
              <Label>পাথ (URL)</Label>
              <Input value={navEditForm.path} onChange={e => setNavEditForm(f => ({ ...f, path: e.target.value }))} placeholder="/path" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNavEditDialogOpen(false)}>বাতিল</Button>
            <Button onClick={handleNavEditSave} disabled={navEditSaving} className="gap-2">
              {navEditSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {navEditSaving ? "সংরক্ষণ হচ্ছে..." : "আপডেট করুন"}
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
