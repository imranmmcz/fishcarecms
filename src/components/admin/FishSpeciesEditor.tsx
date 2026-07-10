import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { appStorage } from "@/lib/appStorage";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Loader2, Fish, GripVertical, ImageIcon, X } from "lucide-react";

interface FishDetails {
  cultureDuration: string;
  waterQuality: string;
  diseaseRisk: string;
  growthRate: string;
  marketDemand: string;
  nutritionalValue: string;
  images: string[];
}

interface FishSpeciesItem {
  name: string;
  scientificName: string;
  basicInfo: string;
  classification: string;
  foodHabit: string;
  farmingMethod: string;
  details: FishDetails;
}

interface FishTab {
  id: string;
  name: string;
  species: FishSpeciesItem[];
}

interface FishPageContent {
  headline: string;
  subHeadline: string;
  tabs: FishTab[];
}

interface Props {
  section: {
    id: string;
    section_key: string;
    content: FishPageContent;
    is_active: boolean;
  };
  onUpdate: () => void;
}

const emptySpecies: FishSpeciesItem = {
  name: "নতুন মাছ",
  scientificName: "",
  basicInfo: "",
  classification: "",
  foodHabit: "",
  farmingMethod: "",
  details: {
    cultureDuration: "",
    waterQuality: "",
    diseaseRisk: "",
    growthRate: "",
    marketDemand: "",
    nutritionalValue: "",
    images: [],
  },
};

export function FishSpeciesEditor({ section, onUpdate }: Props) {
  const [content, setContent] = useState<FishPageContent>(section.content);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("page_content")
        .update({ content: content as any, updated_at: new Date().toISOString() })
        .eq("section_key", "fish_species_page");
      if (error) throw error;
      toast.success("সফলভাবে সংরক্ষিত হয়েছে");
      onUpdate();
    } catch {
      toast.error("সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  // Tab handlers
  const addTab = () => {
    const id = `tab_${Date.now()}`;
    setContent(prev => ({
      ...prev,
      tabs: [...prev.tabs, { id, name: "নতুন ট্যাব", species: [] }],
    }));
  };

  const removeTab = (idx: number) => {
    setContent(prev => ({
      ...prev,
      tabs: prev.tabs.filter((_, i) => i !== idx),
    }));
  };

  const updateTabName = (idx: number, name: string) => {
    setContent(prev => {
      const tabs = [...prev.tabs];
      tabs[idx] = { ...tabs[idx], name };
      return { ...prev, tabs };
    });
  };

  // Species handlers
  const addSpecies = (tabIdx: number) => {
    setContent(prev => {
      const tabs = [...prev.tabs];
      tabs[tabIdx] = {
        ...tabs[tabIdx],
        species: [...tabs[tabIdx].species, { ...emptySpecies }],
      };
      return { ...prev, tabs };
    });
  };

  const removeSpecies = (tabIdx: number, spIdx: number) => {
    setContent(prev => {
      const tabs = [...prev.tabs];
      tabs[tabIdx] = {
        ...tabs[tabIdx],
        species: tabs[tabIdx].species.filter((_, i) => i !== spIdx),
      };
      return { ...prev, tabs };
    });
  };

  const updateSpeciesField = (tabIdx: number, spIdx: number, field: string, value: string) => {
    setContent(prev => {
      const tabs = [...prev.tabs];
      const species = [...tabs[tabIdx].species];
      species[spIdx] = { ...species[spIdx], [field]: value };
      tabs[tabIdx] = { ...tabs[tabIdx], species };
      return { ...prev, tabs };
    });
  };

  const updateDetailField = (tabIdx: number, spIdx: number, field: string, value: string) => {
    setContent(prev => {
      const tabs = [...prev.tabs];
      const species = [...tabs[tabIdx].species];
      species[spIdx] = {
        ...species[spIdx],
        details: { ...species[spIdx].details, [field]: value },
      };
      tabs[tabIdx] = { ...tabs[tabIdx], species };
      return { ...prev, tabs };
    });
  };

  const handleImageUpload = async (tabIdx: number, spIdx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const key = `${tabIdx}-${spIdx}`;
    setUploadingFor(key);

    try {
      const newImages: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `fish-species/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await appStorage.from("product-images").upload(path, file);
        if (error) throw error;
        const { data: urlData } = appStorage.from("product-images").getPublicUrl(path);
        newImages.push(urlData.publicUrl);
      }

      setContent(prev => {
        const tabs = [...prev.tabs];
        const species = [...tabs[tabIdx].species];
        species[spIdx] = {
          ...species[spIdx],
          details: {
            ...species[spIdx].details,
            images: [...(species[spIdx].details.images || []), ...newImages],
          },
        };
        tabs[tabIdx] = { ...tabs[tabIdx], species };
        return { ...prev, tabs };
      });
      toast.success(`${newImages.length}টি ছবি আপলোড হয়েছে`);
    } catch {
      toast.error("ছবি আপলোডে সমস্যা হয়েছে");
    } finally {
      setUploadingFor(null);
    }
  };

  const removeImage = (tabIdx: number, spIdx: number, imgIdx: number) => {
    setContent(prev => {
      const tabs = [...prev.tabs];
      const species = [...tabs[tabIdx].species];
      const images = [...(species[spIdx].details.images || [])];
      images.splice(imgIdx, 1);
      species[spIdx] = {
        ...species[spIdx],
        details: { ...species[spIdx].details, images },
      };
      tabs[tabIdx] = { ...tabs[tabIdx], species };
      return { ...prev, tabs };
    });
  };

  // Move species up/down
  const moveSpecies = (tabIdx: number, spIdx: number, direction: "up" | "down") => {
    setContent(prev => {
      const tabs = [...prev.tabs];
      const species = [...tabs[tabIdx].species];
      const newIdx = direction === "up" ? spIdx - 1 : spIdx + 1;
      if (newIdx < 0 || newIdx >= species.length) return prev;
      [species[spIdx], species[newIdx]] = [species[newIdx], species[spIdx]];
      tabs[tabIdx] = { ...tabs[tabIdx], species };
      return { ...prev, tabs };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Fish className="h-6 w-6 text-primary" />
          বাংলাদেশে প্রচলিত মাছ - এডিটর
        </h2>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          সংরক্ষণ করুন
        </Button>
      </div>

      {/* Headline & Sub */}
      <Card>
        <CardHeader>
          <CardTitle>শিরোনাম</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>প্রধান শিরোনাম (H1)</Label>
            <Input value={content.headline} onChange={e => setContent(prev => ({ ...prev, headline: e.target.value }))} />
          </div>
          <div>
            <Label>উপ-শিরোনাম</Label>
            <Input value={content.subHeadline} onChange={e => setContent(prev => ({ ...prev, subHeadline: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ট্যাব ম্যানেজমেন্ট</CardTitle>
              <CardDescription>ক্যাটাগরি ট্যাব যুক্ত/সরান ও মাছের প্রজাতি ম্যানেজ করুন</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addTab}>
              <Plus className="h-4 w-4 mr-1" /> ট্যাব যুক্ত করুন
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {content.tabs.map((tab, tabIdx) => (
              <AccordionItem key={tab.id} value={tab.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{tab.name}</span>
                    <Badge variant="secondary" className="ml-2">{tab.species.length} প্রজাতি</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* Tab name */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>ট্যাবের নাম</Label>
                      <Input value={tab.name} onChange={e => updateTabName(tabIdx, e.target.value)} />
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => removeTab(tabIdx)}>
                      <Trash2 className="h-4 w-4 mr-1" /> ট্যাব মুছুন
                    </Button>
                  </div>

                  {/* Species list */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">মাছের প্রজাতি</h4>
                      <Button variant="outline" size="sm" onClick={() => addSpecies(tabIdx)}>
                        <Plus className="h-4 w-4 mr-1" /> মাছ যুক্ত করুন
                      </Button>
                    </div>

                    <Accordion type="single" collapsible className="space-y-2">
                      {tab.species.map((fish, spIdx) => (
                        <AccordionItem key={spIdx} value={`fish-${tabIdx}-${spIdx}`} className="border rounded-lg px-3 bg-muted/20">
                          <AccordionTrigger className="hover:no-underline py-2">
                            <div className="flex items-center gap-2">
                              <Fish className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">{fish.name || "নাম দিন"}</span>
                              <span className="text-xs text-muted-foreground italic">({fish.scientificName})</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-2">
                            {/* Basic fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>মাছের নাম</Label>
                                <Input value={fish.name} onChange={e => updateSpeciesField(tabIdx, spIdx, "name", e.target.value)} />
                              </div>
                              <div>
                                <Label>বৈজ্ঞানিক নাম</Label>
                                <Input value={fish.scientificName} onChange={e => updateSpeciesField(tabIdx, spIdx, "scientificName", e.target.value)} />
                              </div>
                            </div>
                            <div>
                              <Label>মৌলিক তথ্য</Label>
                              <Textarea value={fish.basicInfo} onChange={e => updateSpeciesField(tabIdx, spIdx, "basicInfo", e.target.value)} rows={2} />
                            </div>
                            <div>
                              <Label>শ্রেণিবিন্যাস</Label>
                              <Input value={fish.classification} onChange={e => updateSpeciesField(tabIdx, spIdx, "classification", e.target.value)} />
                            </div>
                            <div>
                              <Label>খাদ্যাভ্যাস</Label>
                              <Input value={fish.foodHabit} onChange={e => updateSpeciesField(tabIdx, spIdx, "foodHabit", e.target.value)} />
                            </div>
                            <div>
                              <Label>চাষ পদ্ধতি (সংক্ষেপ)</Label>
                              <Textarea value={fish.farmingMethod} onChange={e => updateSpeciesField(tabIdx, spIdx, "farmingMethod", e.target.value)} rows={2} />
                            </div>

                            {/* Detail fields */}
                            <div className="border-t pt-3 mt-3">
                              <h5 className="font-semibold text-sm mb-3">বিস্তারিত তথ্য (+ বাটনে দেখাবে)</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label>চাষের সময়কাল</Label>
                                  <Input value={fish.details.cultureDuration} onChange={e => updateDetailField(tabIdx, spIdx, "cultureDuration", e.target.value)} />
                                </div>
                                <div>
                                  <Label>পানির গুণাগুণ</Label>
                                  <Input value={fish.details.waterQuality} onChange={e => updateDetailField(tabIdx, spIdx, "waterQuality", e.target.value)} />
                                </div>
                                <div>
                                  <Label>রোগের ঝুঁকি</Label>
                                  <Input value={fish.details.diseaseRisk} onChange={e => updateDetailField(tabIdx, spIdx, "diseaseRisk", e.target.value)} />
                                </div>
                                <div>
                                  <Label>বৃদ্ধির হার</Label>
                                  <Input value={fish.details.growthRate} onChange={e => updateDetailField(tabIdx, spIdx, "growthRate", e.target.value)} />
                                </div>
                                <div>
                                  <Label>বাজার চাহিদা</Label>
                                  <Input value={fish.details.marketDemand} onChange={e => updateDetailField(tabIdx, spIdx, "marketDemand", e.target.value)} />
                                </div>
                                <div>
                                  <Label>পুষ্টিমান</Label>
                                  <Input value={fish.details.nutritionalValue} onChange={e => updateDetailField(tabIdx, spIdx, "nutritionalValue", e.target.value)} />
                                </div>
                              </div>
                            </div>

                            {/* Images */}
                            <div className="border-t pt-3 mt-3">
                              <h5 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                                <ImageIcon className="h-4 w-4" /> ছবি গ্যালারি
                              </h5>
                              {fish.details.images && fish.details.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {fish.details.images.map((img, imgIdx) => (
                                    <div key={imgIdx} className="relative group">
                                      <img src={img} alt="" className="h-20 w-20 object-cover rounded-lg border" />
                                      <button
                                        onClick={() => removeImage(tabIdx, spIdx, imgIdx)}
                                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={e => handleImageUpload(tabIdx, spIdx, e.target.files)}
                                disabled={uploadingFor === `${tabIdx}-${spIdx}`}
                              />
                              {uploadingFor === `${tabIdx}-${spIdx}` && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" /> আপলোড হচ্ছে...
                                </p>
                              )}
                            </div>

                            {/* Move & Delete */}
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Button variant="outline" size="sm" onClick={() => moveSpecies(tabIdx, spIdx, "up")} disabled={spIdx === 0}>
                                ↑ উপরে
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => moveSpecies(tabIdx, spIdx, "down")} disabled={spIdx === tab.species.length - 1}>
                                ↓ নিচে
                              </Button>
                              <div className="flex-1" />
                              <Button variant="destructive" size="sm" onClick={() => removeSpecies(tabIdx, spIdx)}>
                                <Trash2 className="h-4 w-4 mr-1" /> মুছুন
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          সব সংরক্ষণ করুন
        </Button>
      </div>
    </div>
  );
}
