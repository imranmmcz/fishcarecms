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
  Loader2
} from "lucide-react";

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

  const heroSection = getSection("hero");
  const modulesSection = getSection("modules");
  const benefitsSection = getSection("benefits");
  const faqSection = getSection("faq");
  const socialProofSection = getSection("social_proof");
  const ctaSection = getSection("cta");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Layout className="h-8 w-8 text-primary" />
              পেজ বিল্ডার
            </h1>
            <p className="text-muted-foreground mt-1">
              হোমপেজের সকল সেকশন এডিট করুন
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSections} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              রিফ্রেশ
            </Button>
            <Button onClick={saveAllSections} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              সব সংরক্ষণ করুন
            </Button>
            <Button variant="secondary" asChild>
              <a href="/" target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                প্রিভিউ
              </a>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            <TabsTrigger value="hero">হিরো</TabsTrigger>
            <TabsTrigger value="modules">মডিউল</TabsTrigger>
            <TabsTrigger value="benefits">সুবিধা</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="stats">পরিসংখ্যান</TabsTrigger>
            <TabsTrigger value="cta">CTA</TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      হিরো সেকশন
                    </CardTitle>
                    <CardDescription>মূল ব্যানার এবং হেডলাইন এডিট করুন</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="hero-active">সক্রিয়</Label>
                    <Switch
                      id="hero-active"
                      checked={heroSection?.is_active}
                      onCheckedChange={(checked) => updateSection("hero", { is_active: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero-title">শিরোনাম</Label>
                    <Input
                      id="hero-title"
                      value={heroSection?.content.title || ""}
                      onChange={(e) => updateSectionContent("hero", "title", e.target.value)}
                      placeholder="প্রধান শিরোনাম"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero-subtitle">সাবটাইটেল</Label>
                    <Textarea
                      id="hero-subtitle"
                      value={heroSection?.content.subtitle || ""}
                      onChange={(e) => updateSectionContent("hero", "subtitle", e.target.value)}
                      placeholder="সংক্ষিপ্ত বর্ণনা"
                      rows={2}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hero-cta-text">বাটন টেক্সট</Label>
                      <Input
                        id="hero-cta-text"
                        value={heroSection?.content.ctaText || ""}
                        onChange={(e) => updateSectionContent("hero", "ctaText", e.target.value)}
                        placeholder="শুরু করুন"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hero-cta-link">বাটন লিংক</Label>
                      <Input
                        id="hero-cta-link"
                        value={heroSection?.content.ctaLink || ""}
                        onChange={(e) => updateSectionContent("hero", "ctaLink", e.target.value)}
                        placeholder="/auth"
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={() => saveSection("hero")} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  সংরক্ষণ করুন
                </Button>
              </CardContent>
            </Card>
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
        </Tabs>
      </div>
    </AdminLayout>
  );
}
