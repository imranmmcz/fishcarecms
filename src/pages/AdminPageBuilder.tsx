import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Layout, 
  Type, 
  Image, 
  Link, 
  Save, 
  RefreshCw, 
  Eye,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Sliders,
  ShoppingBag
} from "lucide-react";
import { HeroSliderManagement } from "@/components/admin/HeroSliderManagement";
import { HeroFeaturedProductAdmin } from "@/components/admin/HeroFeaturedProductAdmin";



interface PageSection {
  id: string;
  section_key: string;
  section_name: string;
  content: Record<string, any>;
  is_active: boolean;
  display_order: number;
}

interface ModuleItem {
  title: string;
  description: string;
  icon: string;
  link: string;
  isActive: boolean;
}

interface BenefitItem {
  title: string;
  description: string;
  icon: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface StatItem {
  value: string;
  label: string;
}

interface QuickLinkItem {
  name_bn: string;
  name_en: string;
  path: string;
}

interface LinkGroupItem {
  heading_bn: string;
  heading_en: string;
  links: QuickLinkItem[];
}

interface SocialLinkItem {
  name: string;
  icon: string;
  url: string;
}

interface NavItem {
  label_bn: string;
  label_en: string;
  path: string;
}

const iconOptions = [
  "Calculator", "Fish", "Wheat", "Droplets", "Stethoscope", "DollarSign",
  "CheckCircle", "Gift", "Globe", "Smartphone", "Heart", "Star",
  "Shield", "Zap", "Award", "Target", "TrendingUp", "Users"
];

export default function AdminPageBuilder() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("page_content")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      // Type assertion for the data
      const typedData = (data || []) as unknown as PageSection[];
      setSections(typedData);
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("সেকশন লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const updateSection = (sectionKey: string, updates: Partial<PageSection>) => {
    setSections(prev => 
      prev.map(section => 
        section.section_key === sectionKey 
          ? { ...section, ...updates }
          : section
      )
    );
  };

  const updateSectionContent = (sectionKey: string, contentKey: string, value: any) => {
    setSections(prev => 
      prev.map(section => 
        section.section_key === sectionKey 
          ? { 
              ...section, 
              content: { ...section.content, [contentKey]: value }
            }
          : section
      )
    );
  };

  const saveSection = async (sectionKey: string) => {
    const section = sections.find(s => s.section_key === sectionKey);
    if (!section) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("page_content")
        .update({
          content: section.content,
          is_active: section.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("section_key", sectionKey);

      if (error) throw error;
      toast.success("সেকশন সফলভাবে সংরক্ষিত হয়েছে");
    } catch (error) {
      console.error("Error saving section:", error);
      toast.error("সেকশন সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const saveAllSections = async () => {
    setSaving(true);
    try {
      for (const section of sections) {
        const { error } = await supabase
          .from("page_content")
          .update({
            content: section.content,
            is_active: section.is_active,
            updated_at: new Date().toISOString()
          })
          .eq("section_key", section.section_key);

        if (error) throw error;
      }
      toast.success("সকল সেকশন সফলভাবে সংরক্ষিত হয়েছে");
    } catch (error) {
      console.error("Error saving sections:", error);
      toast.error("সেকশন সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const getSection = (key: string): PageSection | undefined => {
    return sections.find(s => s.section_key === key);
  };

  // Module Item handlers
  const addModuleItem = () => {
    const modulesSection = getSection("modules");
    if (!modulesSection) return;

    const items = modulesSection.content.items || [];
    const newItem: ModuleItem = {
      title: "নতুন মডিউল",
      description: "মডিউলের বর্ণনা",
      icon: "Star",
      link: "/",
      isActive: true
    };
    
    updateSectionContent("modules", "items", [...items, newItem]);
  };

  const updateModuleItem = (index: number, field: keyof ModuleItem, value: any) => {
    const modulesSection = getSection("modules");
    if (!modulesSection) return;

    const items = [...(modulesSection.content.items || [])];
    items[index] = { ...items[index], [field]: value };
    updateSectionContent("modules", "items", items);
  };

  const removeModuleItem = (index: number) => {
    const modulesSection = getSection("modules");
    if (!modulesSection) return;

    const items = [...(modulesSection.content.items || [])];
    items.splice(index, 1);
    updateSectionContent("modules", "items", items);
  };

  // Benefit Item handlers
  const addBenefitItem = () => {
    const benefitsSection = getSection("benefits");
    if (!benefitsSection) return;

    const items = benefitsSection.content.items || [];
    const newItem: BenefitItem = {
      title: "নতুন সুবিধা",
      description: "সুবিধার বর্ণনা",
      icon: "CheckCircle"
    };
    
    updateSectionContent("benefits", "items", [...items, newItem]);
  };

  const updateBenefitItem = (index: number, field: keyof BenefitItem, value: string) => {
    const benefitsSection = getSection("benefits");
    if (!benefitsSection) return;

    const items = [...(benefitsSection.content.items || [])];
    items[index] = { ...items[index], [field]: value };
    updateSectionContent("benefits", "items", items);
  };

  const removeBenefitItem = (index: number) => {
    const benefitsSection = getSection("benefits");
    if (!benefitsSection) return;

    const items = [...(benefitsSection.content.items || [])];
    items.splice(index, 1);
    updateSectionContent("benefits", "items", items);
  };

  // FAQ Item handlers
  const addFaqItem = () => {
    const faqSection = getSection("faq");
    if (!faqSection) return;

    const items = faqSection.content.items || [];
    const newItem: FaqItem = {
      question: "নতুন প্রশ্ন?",
      answer: "উত্তর লিখুন"
    };
    
    updateSectionContent("faq", "items", [...items, newItem]);
  };

  const updateFaqItem = (index: number, field: keyof FaqItem, value: string) => {
    const faqSection = getSection("faq");
    if (!faqSection) return;

    const items = [...(faqSection.content.items || [])];
    items[index] = { ...items[index], [field]: value };
    updateSectionContent("faq", "items", items);
  };

  const removeFaqItem = (index: number) => {
    const faqSection = getSection("faq");
    if (!faqSection) return;

    const items = [...(faqSection.content.items || [])];
    items.splice(index, 1);
    updateSectionContent("faq", "items", items);
  };

  // Stats Item handlers
  const addStatItem = () => {
    const statsSection = getSection("social_proof");
    if (!statsSection) return;

    const stats = statsSection.content.stats || [];
    const newItem: StatItem = {
      value: "০",
      label: "নতুন পরিসংখ্যান"
    };
    
    updateSectionContent("social_proof", "stats", [...stats, newItem]);
  };

  const updateStatItem = (index: number, field: keyof StatItem, value: string) => {
    const statsSection = getSection("social_proof");
    if (!statsSection) return;

    const stats = [...(statsSection.content.stats || [])];
    stats[index] = { ...stats[index], [field]: value };
    updateSectionContent("social_proof", "stats", stats);
  };

  const removeStatItem = (index: number) => {
    const statsSection = getSection("social_proof");
    if (!statsSection) return;

    const stats = [...(statsSection.content.stats || [])];
    stats.splice(index, 1);
    updateSectionContent("social_proof", "stats", stats);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Footer Quick Link handlers
  const addQuickLink = () => {
    const footerSection = getSection("footer");
    if (!footerSection) return;
    const items = footerSection.content.quickLinks || [];
    updateSectionContent("footer", "quickLinks", [...items, { name_bn: "নতুন লিংক", name_en: "New Link", path: "/" }]);
  };

  const updateQuickLink = (index: number, field: keyof QuickLinkItem, value: string) => {
    const footerSection = getSection("footer");
    if (!footerSection) return;
    const items = [...(footerSection.content.quickLinks || [])];
    items[index] = { ...items[index], [field]: value };
    updateSectionContent("footer", "quickLinks", items);
  };

  const removeQuickLink = (index: number) => {
    const footerSection = getSection("footer");
    if (!footerSection) return;
    const items = [...(footerSection.content.quickLinks || [])];
    items.splice(index, 1);
    updateSectionContent("footer", "quickLinks", items);
  };

  // Footer Social Link handlers
  const addSocialLink = () => {
    const footerSection = getSection("footer");
    if (!footerSection) return;
    const items = footerSection.content.socialLinks || [];
    updateSectionContent("footer", "socialLinks", [...items, { name: "New", icon: "Globe", url: "https://" }]);
  };

  const updateSocialLink = (index: number, field: keyof SocialLinkItem, value: string) => {
    const footerSection = getSection("footer");
    if (!footerSection) return;
    const items = [...(footerSection.content.socialLinks || [])];
    items[index] = { ...items[index], [field]: value };
    updateSectionContent("footer", "socialLinks", items);
  };

  const removeSocialLink = (index: number) => {
    const footerSection = getSection("footer");
    if (!footerSection) return;
    const items = [...(footerSection.content.socialLinks || [])];
    items.splice(index, 1);
    updateSectionContent("footer", "socialLinks", items);
  };

  // Footer Link Group handlers (multi-section accordion management)
  const getLinkGroups = (): LinkGroupItem[] => {
    const footerSection = getSection("footer");
    if (!footerSection) return [];
    if (Array.isArray(footerSection.content.linkGroups) && footerSection.content.linkGroups.length > 0) {
      return footerSection.content.linkGroups;
    }
    // Seed from legacy quickLinks on first use
    return [{
      heading_bn: footerSection.content.quickLinksHeading_bn || "দ্রুত লিংক",
      heading_en: footerSection.content.quickLinksHeading_en || "Quick Links",
      links: footerSection.content.quickLinks || [],
    }];
  };
  const writeLinkGroups = (groups: LinkGroupItem[]) =>
    updateSectionContent("footer", "linkGroups", groups);
  const addLinkGroup = () =>
    writeLinkGroups([...getLinkGroups(), { heading_bn: "নতুন সেকশন", heading_en: "New Section", links: [] }]);
  const removeLinkGroup = (gi: number) => {
    const g = [...getLinkGroups()]; g.splice(gi, 1); writeLinkGroups(g);
  };
  const updateGroupHeading = (gi: number, field: "heading_bn" | "heading_en", value: string) => {
    const g = [...getLinkGroups()]; g[gi] = { ...g[gi], [field]: value }; writeLinkGroups(g);
  };
  const addGroupLink = (gi: number) => {
    const g = [...getLinkGroups()];
    g[gi] = { ...g[gi], links: [...(g[gi].links || []), { name_bn: "নতুন লিংক", name_en: "New Link", path: "/" }] };
    writeLinkGroups(g);
  };
  const updateGroupLink = (gi: number, li: number, field: keyof QuickLinkItem, value: string) => {
    const g = [...getLinkGroups()];
    const links = [...(g[gi].links || [])];
    links[li] = { ...links[li], [field]: value };
    g[gi] = { ...g[gi], links };
    writeLinkGroups(g);
  };
  const removeGroupLink = (gi: number, li: number) => {
    const g = [...getLinkGroups()];
    const links = [...(g[gi].links || [])];
    links.splice(li, 1);
    g[gi] = { ...g[gi], links };
    writeLinkGroups(g);
  };

  const socialIconOptions = [
    "Facebook", "Youtube", "MessageCircle", "Instagram", "Twitter", "Globe", 
    "Linkedin", "Github", "Send", "Music2", "Phone", "Mail", "MapPin",
    "Twitch", "Rss", "ExternalLink", "Share2", "Video"
  ];

  const heroSection = getSection("hero");
  const modulesSection = getSection("modules");
  const benefitsSection = getSection("benefits");
  const faqSection = getSection("faq");
  const socialProofSection = getSection("social_proof");
  const ctaSection = getSection("cta");
  const footerSection = getSection("footer");
  const headerSection = getSection("header");

  // Header Nav Item handlers
  const addNavItem = () => {
    if (!headerSection) return;
    const items = headerSection.content.navItems || [];
    updateSectionContent("header", "navItems", [...items, { label_bn: "নতুন", label_en: "New", path: "/" }]);
  };

  const updateNavItem = (index: number, field: keyof NavItem, value: string) => {
    if (!headerSection) return;
    const items = [...(headerSection.content.navItems || [])];
    items[index] = { ...items[index], [field]: value };
    updateSectionContent("header", "navItems", items);
  };

  const removeNavItem = (index: number) => {
    if (!headerSection) return;
    const items = [...(headerSection.content.navItems || [])];
    items.splice(index, 1);
    updateSectionContent("header", "navItems", items);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
              <Layout className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              পেজ বিল্ডার
            </h1>
            <p className="text-muted-foreground text-xs sm:text-base mt-1">
              হোমপেজের সকল সেকশন এডিট করুন
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={fetchSections} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </Button>
            <Button size="sm" onClick={saveAllSections} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              <span className="hidden sm:inline">সব সংরক্ষণ করুন</span>
              <span className="sm:hidden">সংরক্ষণ</span>
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <a href="/" target="_blank">
                <Eye className="h-4 w-4 mr-1.5" />
                প্রিভিউ
              </a>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList className="flex flex-wrap h-auto gap-1 p-1 w-full">
            <TabsTrigger value="header" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">হেডার</TabsTrigger>
            <TabsTrigger value="hero" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">হিরো</TabsTrigger>
            <TabsTrigger value="modules" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">মডিউল</TabsTrigger>
            <TabsTrigger value="benefits" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">সুবিধা</TabsTrigger>
            <TabsTrigger value="faq" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">FAQ</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">পরিসংখ্যান</TabsTrigger>
            <TabsTrigger value="cta" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">CTA</TabsTrigger>
            <TabsTrigger value="footer" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">ফুটার</TabsTrigger>
            
          </TabsList>

          {/* Header Section */}
          <TabsContent value="header">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Layout className="h-5 w-5" />
                      হেডার সেকশন
                    </CardTitle>
                    <CardDescription>হেডারের লোগো, নাম এবং নেভিগেশন মেনু এডিট করুন</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="header-active">সক্রিয়</Label>
                    <Switch
                      id="header-active"
                      checked={headerSection?.is_active}
                      onCheckedChange={(checked) => updateSection("header", { is_active: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base">কোম্পানি/ব্র্যান্ড তথ্য</h4>
                  
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>লোগো ইমেজ</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-lg border border-border flex items-center justify-center overflow-hidden bg-muted">
                        {headerSection?.content.logoUrl ? (
                          <img src={headerSection.content.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                          <Image className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('header-logo-upload')?.click()}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            আপলোড করুন
                          </Button>
                          {headerSection?.content.logoUrl && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updateSectionContent("header", "logoUrl", "")}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              মুছুন
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="অথবা ইমেজ URL দিন"
                          value={headerSection?.content.logoUrl || ""}
                          onChange={(e) => updateSectionContent("header", "logoUrl", e.target.value)}
                        />
                        <input
                          id="header-logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error("ফাইল সাইজ ২MB এর বেশি হতে পারবে না");
                              return;
                            }
                            const fileExt = file.name.split('.').pop();
                            const fileName = `header-logo-${Date.now()}.${fileExt}`;
                            const { error: uploadError } = await supabase.storage
                              .from('product-images')
                              .upload(fileName, file);
                            if (uploadError) {
                              toast.error("আপলোড ব্যর্থ হয়েছে");
                              return;
                            }
                            const { data: urlData } = supabase.storage
                              .from('product-images')
                              .getPublicUrl(fileName);
                            updateSectionContent("header", "logoUrl", urlData.publicUrl);
                            toast.success("লোগো আপলোড সফল হয়েছে");
                            e.target.value = '';
                          }}
                        />
                        <p className="text-xs text-muted-foreground">সর্বোচ্চ ২MB, PNG/JPG/SVG সাপোর্টেড। খালি রাখলে ডিফল্ট আইকন দেখাবে।</p>
                      </div>
                    </div>
                  </div>

                  {/* Favicon Upload */}
                  <div className="space-y-2">
                    <Label>ফেভিকন (ব্রাউজার ট্যাব আইকন)</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-md border border-border flex items-center justify-center overflow-hidden bg-muted">
                        {headerSection?.content.faviconUrl ? (
                          <img src={headerSection.content.faviconUrl} alt="Favicon" className="h-full w-full object-contain" />
                        ) : (
                          <Image className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('header-favicon-upload')?.click()}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            আপলোড করুন
                          </Button>
                          {headerSection?.content.faviconUrl && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updateSectionContent("header", "faviconUrl", "")}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              মুছুন
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="অথবা ফেভিকন URL দিন"
                          value={headerSection?.content.faviconUrl || ""}
                          onChange={(e) => updateSectionContent("header", "faviconUrl", e.target.value)}
                        />
                        <input
                          id="header-favicon-upload"
                          type="file"
                          accept="image/png,image/x-icon,image/svg+xml,image/jpeg"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 1 * 1024 * 1024) {
                              toast.error("ফাইল সাইজ ১MB এর বেশি হতে পারবে না");
                              return;
                            }
                            const fileExt = file.name.split('.').pop();
                            const fileName = `favicon-${Date.now()}.${fileExt}`;
                            const { error: uploadError } = await supabase.storage
                              .from('product-images')
                              .upload(fileName, file);
                            if (uploadError) {
                              toast.error("আপলোড ব্যর্থ হয়েছে");
                              return;
                            }
                            const { data: urlData } = supabase.storage
                              .from('product-images')
                              .getPublicUrl(fileName);
                            updateSectionContent("header", "faviconUrl", urlData.publicUrl);
                            toast.success("ফেভিকন আপলোড সফল হয়েছে");
                            e.target.value = '';
                          }}
                        />
                        <p className="text-xs text-muted-foreground">সর্বোচ্চ ১MB, PNG/ICO/SVG সাপোর্টেড। ৩২x৩২ বা ৬৪x৬৪ পিক্সেল রেকমেন্ডেড।</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>কোম্পানির নাম (লোগো টেক্সট)</Label>
                    <Input
                      value={headerSection?.content.companyName || ""}
                      onChange={(e) => updateSectionContent("header", "companyName", e.target.value)}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>সাবটাইটেল (বাংলা)</Label>
                      <Input
                        value={headerSection?.content.companySubtitle_bn || ""}
                        onChange={(e) => updateSectionContent("header", "companySubtitle_bn", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>সাবটাইটেল (English)</Label>
                      <Input
                        value={headerSection?.content.companySubtitle_en || ""}
                        onChange={(e) => updateSectionContent("header", "companySubtitle_en", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Top Bar Settings */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold text-base">টপ বার সেটিংস</h4>
                  <p className="text-xs text-muted-foreground">হেডারের সবচেয়ে উপরের প্রাইমারি কালার বারের তথ্য</p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>ইমেইল (বাম পাশে দেখাবে)</Label>
                      <Input
                        placeholder="info@fishcare.com.bd"
                        value={headerSection?.content.topBarEmail || ""}
                        onChange={(e) => updateSectionContent("header", "topBarEmail", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ফোন নম্বর</Label>
                      <Input
                        placeholder="01978865277"
                        value={headerSection?.content.topBarPhone || ""}
                        onChange={(e) => updateSectionContent("header", "topBarPhone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>কল লেবেল (যেমন: Call Now / কল করুন)</Label>
                      <Input
                        placeholder="Call Now"
                        value={headerSection?.content.topBarCallLabel || ""}
                        onChange={(e) => updateSectionContent("header", "topBarCallLabel", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">নেভিগেশন মেনু আইটেম</h4>
                    <Button size="sm" onClick={addNavItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      যোগ করুন
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(headerSection?.content.navItems || []).map((item: NavItem, index: number) => (
                      <div key={index} className="flex items-center gap-3 border rounded-lg p-3">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <Input
                            placeholder="লেবেল (বাংলা)"
                            value={item.label_bn}
                            onChange={(e) => updateNavItem(index, "label_bn", e.target.value)}
                          />
                          <Input
                            placeholder="Label (EN)"
                            value={item.label_en}
                            onChange={(e) => updateNavItem(index, "label_en", e.target.value)}
                          />
                          <Input
                            placeholder="পাথ (/shop)"
                            value={item.path}
                            onChange={(e) => updateNavItem(index, "path", e.target.value)}
                          />
                        </div>
                        <Button variant="destructive" size="icon" onClick={() => removeNavItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={() => saveSection("header")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  সংরক্ষণ করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hero Slider Section */}
          <TabsContent value="hero" className="space-y-6">
            <HeroSliderManagement />
            <HeroFeaturedProductAdmin />
          </TabsContent>

          {/* Modules Section */}
          <TabsContent value="modules">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Layout className="h-5 w-5" />
                      মডিউল/ফিচার কার্ড
                    </CardTitle>
                    <CardDescription>ক্যালকুলেটর মডিউলগুলো এডিট করুন</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="modules-active">সক্রিয়</Label>
                    <Switch
                      id="modules-active"
                      checked={modulesSection?.is_active}
                      onCheckedChange={(checked) => updateSection("modules", { is_active: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>সেকশন শিরোনাম</Label>
                    <Input
                      value={modulesSection?.content.sectionTitle || ""}
                      onChange={(e) => updateSectionContent("modules", "sectionTitle", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>সেকশন সাবটাইটেল</Label>
                    <Input
                      value={modulesSection?.content.sectionSubtitle || ""}
                      onChange={(e) => updateSectionContent("modules", "sectionSubtitle", e.target.value)}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">মডিউল আইটেম</h4>
                    <Button size="sm" onClick={addModuleItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      যোগ করুন
                    </Button>
                  </div>

                  <Accordion type="single" collapsible className="space-y-2">
                    {(modulesSection?.content.items || []).map((item: ModuleItem, index: number) => (
                      <AccordionItem key={index} value={`module-${index}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span>{item.title}</span>
                            {!item.isActive && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">নিষ্ক্রিয়</span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>শিরোনাম</Label>
                              <Input
                                value={item.title}
                                onChange={(e) => updateModuleItem(index, "title", e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>আইকন</Label>
                              <select
                                className="w-full p-2 border rounded-md bg-background"
                                value={item.icon}
                                onChange={(e) => updateModuleItem(index, "icon", e.target.value)}
                              >
                                {iconOptions.map(icon => (
                                  <option key={icon} value={icon}>{icon}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>বর্ণনা</Label>
                            <Textarea
                              value={item.description}
                              onChange={(e) => updateModuleItem(index, "description", e.target.value)}
                              rows={2}
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>লিংক</Label>
                              <Input
                                value={item.link}
                                onChange={(e) => updateModuleItem(index, "link", e.target.value)}
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                              <Switch
                                checked={item.isActive}
                                onCheckedChange={(checked) => updateModuleItem(index, "isActive", checked)}
                              />
                              <Label>সক্রিয়</Label>
                            </div>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeModuleItem(index)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            মুছে ফেলুন
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                <Button onClick={() => saveSection("modules")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  সংরক্ষণ করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Benefits Section */}
          <TabsContent value="benefits">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>সুবিধা/কেন ব্যবহার করবেন</CardTitle>
                    <CardDescription>প্ল্যাটফর্মের সুবিধাগুলো এডিট করুন</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="benefits-active">সক্রিয়</Label>
                    <Switch
                      id="benefits-active"
                      checked={benefitsSection?.is_active}
                      onCheckedChange={(checked) => updateSection("benefits", { is_active: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>সেকশন শিরোনাম</Label>
                  <Input
                    value={benefitsSection?.content.sectionTitle || ""}
                    onChange={(e) => updateSectionContent("benefits", "sectionTitle", e.target.value)}
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">সুবিধা আইটেম</h4>
                    <Button size="sm" onClick={addBenefitItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      যোগ করুন
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(benefitsSection?.content.items || []).map((item: BenefitItem, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>শিরোনাম</Label>
                            <Input
                              value={item.title}
                              onChange={(e) => updateBenefitItem(index, "title", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>আইকন</Label>
                            <select
                              className="w-full p-2 border rounded-md bg-background"
                              value={item.icon}
                              onChange={(e) => updateBenefitItem(index, "icon", e.target.value)}
                            >
                              {iconOptions.map(icon => (
                                <option key={icon} value={icon}>{icon}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>বর্ণনা</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateBenefitItem(index, "description", e.target.value)}
                            />
                          </div>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeBenefitItem(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          মুছে ফেলুন
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={() => saveSection("benefits")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  সংরক্ষণ করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Section */}
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>প্রশ্নোত্তর (FAQ)</CardTitle>
                    <CardDescription>সচরাচর জিজ্ঞাসা এডিট করুন</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="faq-active">সক্রিয়</Label>
                    <Switch
                      id="faq-active"
                      checked={faqSection?.is_active}
                      onCheckedChange={(checked) => updateSection("faq", { is_active: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>সেকশন শিরোনাম</Label>
                  <Input
                    value={faqSection?.content.sectionTitle || ""}
                    onChange={(e) => updateSectionContent("faq", "sectionTitle", e.target.value)}
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">প্রশ্নোত্তর</h4>
                    <Button size="sm" onClick={addFaqItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      যোগ করুন
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {(faqSection?.content.items || []).map((item: FaqItem, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="space-y-2">
                          <Label>প্রশ্ন</Label>
                          <Input
                            value={item.question}
                            onChange={(e) => updateFaqItem(index, "question", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>উত্তর</Label>
                          <Textarea
                            value={item.answer}
                            onChange={(e) => updateFaqItem(index, "answer", e.target.value)}
                            rows={3}
                          />
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeFaqItem(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          মুছে ফেলুন
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={() => saveSection("faq")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  সংরক্ষণ করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Section */}
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>পরিসংখ্যান</CardTitle>
                    <CardDescription>অর্জন এবং পরিসংখ্যান এডিট করুন</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="stats-active">সক্রিয়</Label>
                    <Switch
                      id="stats-active"
                      checked={socialProofSection?.is_active}
                      onCheckedChange={(checked) => updateSection("social_proof", { is_active: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>সেকশন শিরোনাম</Label>
                  <Input
                    value={socialProofSection?.content.sectionTitle || ""}
                    onChange={(e) => updateSectionContent("social_proof", "sectionTitle", e.target.value)}
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">পরিসংখ্যান আইটেম</h4>
                    <Button size="sm" onClick={addStatItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      যোগ করুন
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {(socialProofSection?.content.stats || []).map((item: StatItem, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="space-y-2">
                          <Label>মান</Label>
                          <Input
                            value={item.value}
                            onChange={(e) => updateStatItem(index, "value", e.target.value)}
                            placeholder="১০০০+"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>লেবেল</Label>
                          <Input
                            value={item.label}
                            onChange={(e) => updateStatItem(index, "label", e.target.value)}
                            placeholder="ব্যবহারকারী"
                          />
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeStatItem(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          মুছুন
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={() => saveSection("social_proof")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  সংরক্ষণ করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CTA Section */}
          <TabsContent value="cta">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>কল টু অ্যাকশন (CTA)</CardTitle>
                    <CardDescription>নিচের CTA সেকশন এডিট করুন</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="cta-active">সক্রিয়</Label>
                    <Switch
                      id="cta-active"
                      checked={ctaSection?.is_active}
                      onCheckedChange={(checked) => updateSection("cta", { is_active: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>শিরোনাম</Label>
                    <Input
                      value={ctaSection?.content.title || ""}
                      onChange={(e) => updateSectionContent("cta", "title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>সাবটাইটেল</Label>
                    <Input
                      value={ctaSection?.content.subtitle || ""}
                      onChange={(e) => updateSectionContent("cta", "subtitle", e.target.value)}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>বাটন টেক্সট</Label>
                      <Input
                        value={ctaSection?.content.buttonText || ""}
                        onChange={(e) => updateSectionContent("cta", "buttonText", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>বাটন লিংক</Label>
                      <Input
                        value={ctaSection?.content.buttonLink || ""}
                        onChange={(e) => updateSectionContent("cta", "buttonLink", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={() => saveSection("cta")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  সংরক্ষণ করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Footer Section */}
          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Layout className="h-5 w-5" />
                      ফুটার সেকশন
                    </CardTitle>
                    <CardDescription>ফুটারের সকল তথ্য এডিট করুন</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="footer-active">সক্রিয়</Label>
                    <Switch
                      id="footer-active"
                      checked={footerSection?.is_active}
                      onCheckedChange={(checked) => updateSection("footer", { is_active: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base">কোম্পানি তথ্য</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>কোম্পানির নাম</Label>
                      <Input
                        value={footerSection?.content.companyName || ""}
                        onChange={(e) => updateSectionContent("footer", "companyName", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>বর্ণনা (বাংলা)</Label>
                      <Textarea
                        value={footerSection?.content.companyDescription_bn || ""}
                        onChange={(e) => updateSectionContent("footer", "companyDescription_bn", e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>বর্ণনা (English)</Label>
                      <Textarea
                        value={footerSection?.content.companyDescription_en || ""}
                        onChange={(e) => updateSectionContent("footer", "companyDescription_en", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Link Groups (accordion sections) */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-semibold">ফুটার লিংক গ্রুপ</h4>
                      <p className="text-xs text-muted-foreground">প্রতিটি গ্রুপ মোবাইলে একটি অ্যাকর্ডিয়ন সেকশন ও ডেস্কটপে একটি কলাম হিসেবে দেখাবে।</p>
                    </div>
                    <Button size="sm" onClick={addLinkGroup}>
                      <Plus className="h-4 w-4 mr-1" /> নতুন গ্রুপ
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {getLinkGroups().map((group, gi) => (
                      <div key={gi} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 grid md:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">হেডিং (বাংলা)</Label>
                              <Input
                                value={group.heading_bn}
                                onChange={(e) => updateGroupHeading(gi, "heading_bn", e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Heading (EN)</Label>
                              <Input
                                value={group.heading_en}
                                onChange={(e) => updateGroupHeading(gi, "heading_en", e.target.value)}
                              />
                            </div>
                          </div>
                          <Button variant="destructive" size="icon" onClick={() => removeLinkGroup(gi)} title="সম্পূর্ণ গ্রুপ মুছুন">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(group.links || []).map((item, li) => (
                            <div key={li} className="flex items-center gap-2 border rounded p-2 bg-background">
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Input placeholder="নাম (বাংলা)" value={item.name_bn} onChange={(e) => updateGroupLink(gi, li, "name_bn", e.target.value)} />
                                <Input placeholder="Name (EN)" value={item.name_en} onChange={(e) => updateGroupLink(gi, li, "name_en", e.target.value)} />
                                <Input placeholder="পাথ (/shop)" value={item.path} onChange={(e) => updateGroupLink(gi, li, "path", e.target.value)} />
                              </div>
                              <Button variant="destructive" size="icon" onClick={() => removeGroupLink(gi, li)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" onClick={() => addGroupLink(gi)}>
                            <Plus className="h-4 w-4 mr-1" /> লিংক যোগ করুন
                          </Button>
                        </div>
                      </div>
                    ))}
                    {getLinkGroups().length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">এখনও কোনো লিংক গ্রুপ নেই। উপরের বাটন থেকে যোগ করুন।</p>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">সোশ্যাল মিডিয়া</h4>
                    <Button size="sm" onClick={addSocialLink}>
                      <Plus className="h-4 w-4 mr-1" />
                      যোগ করুন
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>হেডিং (বাংলা)</Label>
                      <Input
                        value={footerSection?.content.socialHeading_bn || ""}
                        onChange={(e) => updateSectionContent("footer", "socialHeading_bn", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>হেডিং (English)</Label>
                      <Input
                        value={footerSection?.content.socialHeading_en || ""}
                        onChange={(e) => updateSectionContent("footer", "socialHeading_en", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>সাবটেক্সট (বাংলা)</Label>
                      <Input
                        value={footerSection?.content.socialSubtext_bn || ""}
                        onChange={(e) => updateSectionContent("footer", "socialSubtext_bn", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>সাবটেক্সট (English)</Label>
                      <Input
                        value={footerSection?.content.socialSubtext_en || ""}
                        onChange={(e) => updateSectionContent("footer", "socialSubtext_en", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(footerSection?.content.socialLinks || []).map((item: SocialLinkItem, index: number) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">লিংক #{index + 1}</span>
                          <Button variant="destructive" size="sm" onClick={() => removeSocialLink(index)}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            মুছুন
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">প্ল্যাটফর্ম নাম</Label>
                            <Input
                              placeholder="যেমন: Facebook"
                              value={item.name}
                              onChange={(e) => updateSocialLink(index, "name", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">আইকন</Label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              value={item.icon}
                              onChange={(e) => updateSocialLink(index, "icon", e.target.value)}
                            >
                              {socialIconOptions.map(icon => (
                                <option key={icon} value={icon}>{icon === "MessageCircle" ? "WhatsApp" : icon === "Send" ? "Telegram" : icon === "Music2" ? "TikTok" : icon === "Share2" ? "Share" : icon === "Video" ? "Video" : icon}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">লিংক URL</Label>
                            <Input
                              placeholder="https://..."
                              value={item.url}
                              onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(footerSection?.content.socialLinks || []).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">কোনো সোশ্যাল লিংক নেই। "যোগ করুন" বাটনে ক্লিক করুন।</p>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base">যোগাযোগ তথ্য</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>হেডিং (বাংলা)</Label>
                      <Input
                        value={footerSection?.content.contactHeading_bn || ""}
                        onChange={(e) => updateSectionContent("footer", "contactHeading_bn", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>হেডিং (English)</Label>
                      <Input
                        value={footerSection?.content.contactHeading_en || ""}
                        onChange={(e) => updateSectionContent("footer", "contactHeading_en", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ফোন নম্বর</Label>
                      <Input
                        value={footerSection?.content.phone || ""}
                        onChange={(e) => updateSectionContent("footer", "phone", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ইমেইল</Label>
                      <Input
                        value={footerSection?.content.email || ""}
                        onChange={(e) => updateSectionContent("footer", "email", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ঠিকানা (লাইন ১)</Label>
                      <Input
                        value={footerSection?.content.address_line1 || ""}
                        onChange={(e) => updateSectionContent("footer", "address_line1", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ঠিকানা (লাইন ২)</Label>
                      <Input
                        value={footerSection?.content.address_line2 || ""}
                        onChange={(e) => updateSectionContent("footer", "address_line2", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-base">বটম বার</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>টেক্সট (বাংলা)</Label>
                      <Input
                        value={footerSection?.content.bottomText_bn || ""}
                        onChange={(e) => updateSectionContent("footer", "bottomText_bn", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>টেক্সট (English)</Label>
                      <Input
                        value={footerSection?.content.bottomText_en || ""}
                        onChange={(e) => updateSectionContent("footer", "bottomText_en", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={() => saveSection("footer")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  সংরক্ষণ করুন
                </Button>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>
    </AdminLayout>
  );
}
