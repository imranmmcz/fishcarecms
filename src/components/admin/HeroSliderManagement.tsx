import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Image, Palette, GripVertical, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { HeroSlide } from "@/hooks/useHeroSlides";

const iconOptions = [
  "Sparkles", "Droplets", "Fish", "Package", "Calculator", "TrendingUp",
  "ShoppingCart", "Heart", "Star", "Zap", "Shield", "Award", "Target", "Users"
];

const buttonVariants = [
  { value: "primary", label: "Primary (নীল)", color: "bg-primary" },
  { value: "success", label: "Success (সবুজ)", color: "bg-green-500" },
  { value: "warning", label: "Warning (হলুদ)", color: "bg-yellow-500" },
  { value: "purple", label: "Purple (বেগুনী)", color: "bg-purple-500" },
];

const gradientPresets = [
  { value: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)", label: "Ocean Blue" },
  { value: "linear-gradient(135deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)", label: "Teal Green" },
  { value: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)", label: "Purple Violet" },
  { value: "linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)", label: "Orange Sunset" },
  { value: "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)", label: "Fresh Green" },
  { value: "linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)", label: "Pink Rose" },
  { value: "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)", label: "Royal Blue" },
  { value: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)", label: "Golden Amber" },
];

interface SlideFormData {
  title: string;
  subtitle: string;
  tagline: string;
  tagline_icon: string;
  button_text: string;
  button_link: string;
  button_variant: string;
  background_type: string;
  background_value: string;
  display_order: number;
  is_active: boolean;
}

const defaultFormData: SlideFormData = {
  title: "",
  subtitle: "",
  tagline: "",
  tagline_icon: "Sparkles",
  button_text: "",
  button_link: "/",
  button_variant: "primary",
  background_type: "gradient",
  background_value: gradientPresets[0].value,
  display_order: 0,
  is_active: true,
};

export function HeroSliderManagement() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState<SlideFormData>(defaultFormData);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setSlides((data || []) as HeroSlide[]);
    } catch (error) {
      console.error("Error fetching slides:", error);
      toast.error("স্লাইড লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (slide?: HeroSlide) => {
    if (slide) {
      setSelectedSlide(slide);
      setFormData({
        title: slide.title,
        subtitle: slide.subtitle || "",
        tagline: slide.tagline || "",
        tagline_icon: slide.tagline_icon || "Sparkles",
        button_text: slide.button_text || "",
        button_link: slide.button_link || "/",
        button_variant: slide.button_variant || "primary",
        background_type: slide.background_type,
        background_value: slide.background_value || gradientPresets[0].value,
        display_order: slide.display_order,
        is_active: slide.is_active,
      });
    } else {
      setSelectedSlide(null);
      setFormData({
        ...defaultFormData,
        display_order: slides.length + 1,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("শিরোনাম আবশ্যক");
      return;
    }

    setSaving(true);
    try {
      if (selectedSlide) {
        const { error } = await supabase
          .from("hero_slides")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedSlide.id);

        if (error) throw error;
        toast.success("স্লাইড আপডেট হয়েছে");
      } else {
        const { error } = await supabase
          .from("hero_slides")
          .insert(formData);

        if (error) throw error;
        toast.success("নতুন স্লাইড যোগ হয়েছে");
      }

      setDialogOpen(false);
      fetchSlides();
    } catch (error) {
      console.error("Error saving slide:", error);
      toast.error("স্লাইড সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSlide) return;

    try {
      const { error } = await supabase
        .from("hero_slides")
        .delete()
        .eq("id", selectedSlide.id);

      if (error) throw error;
      toast.success("স্লাইড মুছে ফেলা হয়েছে");
      setDeleteDialogOpen(false);
      setSelectedSlide(null);
      fetchSlides();
    } catch (error) {
      console.error("Error deleting slide:", error);
      toast.error("স্লাইড মুছতে সমস্যা হয়েছে");
    }
  };

  const toggleActive = async (slide: HeroSlide) => {
    try {
      const { error } = await supabase
        .from("hero_slides")
        .update({ is_active: !slide.is_active })
        .eq("id", slide.id);

      if (error) throw error;
      toast.success(slide.is_active ? "স্লাইড নিষ্ক্রিয় করা হয়েছে" : "স্লাইড সক্রিয় করা হয়েছে");
      fetchSlides();
    } catch (error) {
      console.error("Error toggling slide:", error);
      toast.error("স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                হিরো স্লাইডার ম্যানেজমেন্ট
              </CardTitle>
              <CardDescription>
                হোমপেজের হিরো স্লাইডার কাস্টমাইজ করুন - ব্যাকগ্রাউন্ড, টেক্সট এবং বাটন পরিবর্তন করুন
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              নতুন স্লাইড
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>প্রিভিউ</TableHead>
                <TableHead>শিরোনাম</TableHead>
                <TableHead>বাটন</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead className="text-right">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.map((slide) => (
                <TableRow key={slide.id}>
                  <TableCell className="font-medium">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    {slide.display_order}
                  </TableCell>
                  <TableCell>
                    <div
                      className="w-24 h-14 rounded-md shadow-sm flex items-center justify-center text-white text-xs font-medium"
                      style={{ background: slide.background_value || undefined }}
                    >
                      <Eye className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <p className="font-medium truncate">{slide.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {slide.tagline}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {slide.button_text || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={slide.is_active}
                      onCheckedChange={() => toggleActive(slide)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(slide)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSlide(slide);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {slides.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    কোনো স্লাইড নেই। নতুন স্লাইড যোগ করুন।
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSlide ? "স্লাইড এডিট করুন" : "নতুন স্লাইড যোগ করুন"}
            </DialogTitle>
            <DialogDescription>
              স্লাইডের কন্টেন্ট এবং ব্যাকগ্রাউন্ড কাস্টমাইজ করুন
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Preview */}
            <div
              className="w-full h-32 rounded-lg flex items-center justify-center text-white p-4"
              style={{ background: formData.background_value }}
            >
              <div className="text-center">
                <p className="text-sm opacity-80">{formData.tagline}</p>
                <p className="font-bold text-lg truncate">{formData.title || "শিরোনাম"}</p>
              </div>
            </div>

            {/* Content Fields */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">শিরোনাম *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="মাছ চাষের সকল হিসাব এখন হাতের মুঠোয়"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">সাবটাইটেল</Label>
                <Textarea
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="বিস্তারিত বর্ণনা"
                  rows={2}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tagline">ট্যাগলাইন</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="🐟 বাংলাদেশের মৎস্য চাষীদের জন্য"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ট্যাগলাইন আইকন</Label>
                  <Select
                    value={formData.tagline_icon}
                    onValueChange={(value) => setFormData({ ...formData, tagline_icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Button Settings */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button_text">বাটন টেক্সট</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="শুরু করুন"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button_link">বাটন লিংক</Label>
                  <Input
                    id="button_link"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    placeholder="/pond-calculator"
                  />
                </div>
                <div className="space-y-2">
                  <Label>বাটন ভ্যারিয়েন্ট</Label>
                  <Select
                    value={formData.button_variant}
                    onValueChange={(value) => setFormData({ ...formData, button_variant: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {buttonVariants.map((variant) => (
                        <SelectItem key={variant.value} value={variant.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${variant.color}`} />
                            {variant.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Background Settings */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <Label className="text-base font-semibold">ব্যাকগ্রাউন্ড সেটিংস</Label>
                </div>

                <div className="space-y-2">
                  <Label>ব্যাকগ্রাউন্ড টাইপ</Label>
                  <Select
                    value={formData.background_type}
                    onValueChange={(value) => setFormData({ ...formData, background_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gradient">গ্রেডিয়েন্ট</SelectItem>
                      <SelectItem value="color">সলিড কালার</SelectItem>
                      <SelectItem value="image">ইমেজ URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.background_type === "gradient" && (
                  <div className="space-y-3">
                    <Label>প্রিসেট গ্রেডিয়েন্ট</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {gradientPresets.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          className={`h-12 rounded-md transition-all ${
                            formData.background_value === preset.value
                              ? "ring-2 ring-primary ring-offset-2"
                              : "hover:opacity-80"
                          }`}
                          style={{ background: preset.value }}
                          onClick={() => setFormData({ ...formData, background_value: preset.value })}
                          title={preset.label}
                        />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom_gradient">অথবা কাস্টম গ্রেডিয়েন্ট CSS</Label>
                      <Input
                        id="custom_gradient"
                        value={formData.background_value}
                        onChange={(e) => setFormData({ ...formData, background_value: e.target.value })}
                        placeholder="linear-gradient(135deg, #color1 0%, #color2 100%)"
                      />
                    </div>
                  </div>
                )}

                {formData.background_type === "color" && (
                  <div className="space-y-2">
                    <Label htmlFor="bg_color">ব্যাকগ্রাউন্ড কালার</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="w-16 h-10 p-1"
                        value={formData.background_value?.startsWith("#") ? formData.background_value : "#0ea5e9"}
                        onChange={(e) => setFormData({ ...formData, background_value: e.target.value })}
                      />
                      <Input
                        id="bg_color"
                        value={formData.background_value}
                        onChange={(e) => setFormData({ ...formData, background_value: e.target.value })}
                        placeholder="#0ea5e9"
                      />
                    </div>
                  </div>
                )}

                {formData.background_type === "image" && (
                  <div className="space-y-2">
                    <Label htmlFor="bg_image">ইমেজ URL</Label>
                    <Input
                      id="bg_image"
                      value={formData.background_value}
                      onChange={(e) => setFormData({ ...formData, background_value: `url(${e.target.value})` })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                )}
              </div>

              {/* Order and Status */}
              <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">ডিসপ্লে অর্ডার</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 pt-6">
                  <Label htmlFor="is_active">সক্রিয়</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedSlide ? "আপডেট করুন" : "যোগ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>স্লাইড মুছে ফেলতে চান?</AlertDialogTitle>
            <AlertDialogDescription>
              এই স্লাইডটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
