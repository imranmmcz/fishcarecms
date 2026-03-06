import { useState, useCallback, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useProducts, getDiscountedPrice, Product } from "@/contexts/ProductsContext";
import { useCategories, Category } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { Button3D } from "@/components/ui/button-3d";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Package, Loader2, Eye, AlertTriangle, FolderOpen, ImagePlus, Upload, Link2, Search, Download, FileUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { CategoryManagement } from "@/components/admin/CategoryManagement";
import { ProductImageGallery } from "@/components/admin/ProductImageGallery";

const units = [
  { value: "pcs", label: "পিস" },
  { value: "kg", label: "কেজি" },
  { value: "g", label: "গ্রাম" },
  { value: "ltr", label: "লিটার" },
  { value: "ml", label: "মিলি" },
  { value: "pack", label: "প্যাক" },
  { value: "box", label: "বক্স" },
  { value: "bottle", label: "বোতল" },
  { value: "bag", label: "ব্যাগ" },
];

const getUnitLabel = (value: string) => {
  return units.find((u) => u.value === value)?.label || value;
};

interface Company {
  id: string;
  name: string;
  name_bn: string | null;
}

interface Brand {
  id: string;
  name: string;
  name_bn: string | null;
  company_id: string | null;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  cost_price: number;
  discount_percentage: number;
  category: string;
  image_url: string;
  external_link: string;
  stock_quantity: number;
  sku: string;
  unit: string;
  reorder_level: number;
  company_id: string;
  brand_id: string;
  weight_kg: number;
  focus_keyword: string;
  meta_title: string;
  meta_description: string;
  image_alt_text: string;
  seo_url: string;
  recommendation_tags: string[];
}

const emptyProduct: ProductFormData = {
  name: "",
  description: "",
  price: 0,
  cost_price: 0,
  discount_percentage: 0,
  category: "medicine",
  image_url: "",
  external_link: "https://fishcare.com.bd",
  stock_quantity: 0,
  sku: "",
  unit: "pcs",
  reorder_level: 10,
  company_id: "",
  brand_id: "",
  weight_kg: 0,
  focus_keyword: "",
  meta_title: "",
  meta_description: "",
  image_alt_text: "",
  seo_url: "",
  recommendation_tags: [],
};

// Moved ProductForm outside of AdminProducts to prevent re-creation on each render
interface ProductFormProps {
  formData: ProductFormData;
  onFormChange: (data: ProductFormData) => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting: boolean;
  companies: Company[];
  brands: Brand[];
  categories: Category[];
}

const ProductForm = ({ formData, onFormChange, onSubmit, submitLabel, isSubmitting, companies, brands, categories }: ProductFormProps) => {
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);
  const [hideExternalLink, setHideExternalLink] = useState(!formData.external_link);

  const handleChange = useCallback((field: keyof ProductFormData, value: string | number) => {
    onFormChange({ ...formData, [field]: value });
  }, [formData, onFormChange]);

  // Filter brands by selected company
  const filteredBrands = formData.company_id 
    ? brands.filter(b => b.company_id === formData.company_id)
    : brands;

  const getCategoryLabel = (value: string) => {
    const cat = categories.find((c) => c.name === value || c.slug === value);
    return cat?.name_bn || value;
  };

  return (
    <div className="grid gap-4 py-4">
      {/* Basic Info Section */}
      <div className="space-y-1">
        <h4 className="font-semibold text-sm text-muted-foreground">মৌলিক তথ্য</h4>
        <Separator />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="name">পণ্যের নাম *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="পণ্যের নাম লিখুন"
          autoComplete="off"
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="description">বিবরণ</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="পণ্যের বিস্তারিত বিবরণ লিখুন..."
          rows={4}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="category">ক্যাটাগরি *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name_bn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sku">স্কু (SKU)</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => handleChange("sku", e.target.value)}
            placeholder="PRD-001"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Pricing Section */}
      <div className="space-y-1 mt-2">
        <h4 className="font-semibold text-sm text-muted-foreground">মূল্য ও ডিসকাউন্ট</h4>
        <Separator />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cost_price">ক্রয় মূল্য (টাকা)</Label>
          <Input
            id="cost_price"
            type="number"
            value={formData.cost_price}
            onChange={(e) => handleChange("cost_price", Number(e.target.value))}
            placeholder="0"
            min={0}
          />
          <p className="text-xs text-muted-foreground">সাপ্লায়ার থেকে কেনার দাম</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price">বিক্রয় মূল্য (টাকা) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => handleChange("price", Number(e.target.value))}
            placeholder="0"
            min={0}
          />
          <p className="text-xs text-muted-foreground">কাস্টমারের কাছে বিক্রয়ের দাম</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="discount">ডিসকাউন্ট (%)</Label>
          <Input
            id="discount"
            type="number"
            value={formData.discount_percentage}
            onChange={(e) => handleChange("discount_percentage", Number(e.target.value))}
            placeholder="0"
            min={0}
            max={100}
          />
        </div>
        {formData.cost_price > 0 && formData.price > 0 && (
          <div className="flex items-end pb-2">
            <div className={`text-sm p-3 rounded-lg w-full ${
              formData.price > formData.cost_price 
                ? "bg-green-500/10 text-green-700" 
                : "bg-red-500/10 text-red-700"
            }`}>
              <span>লাভ/ক্ষতি: </span>
              <span className="font-bold">
                ৳{(formData.price - formData.cost_price).toLocaleString()} 
                ({((formData.price - formData.cost_price) / formData.cost_price * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        )}
      </div>
      
      {formData.discount_percentage > 0 && (
        <div className="text-sm bg-primary/10 text-primary p-3 rounded-lg flex items-center gap-2">
          <span>ডিসকাউন্ট পরে বিক্রয় মূল্য:</span>
          <span className="font-bold text-lg">৳{getDiscountedPrice(formData.price, formData.discount_percentage)}</span>
          <span className="text-xs">({formData.discount_percentage}% ছাড়)</span>
        </div>
      )}

      {/* Inventory Section */}
      <div className="space-y-1 mt-2">
        <h4 className="font-semibold text-sm text-muted-foreground">ইনভেন্টরি</h4>
        <Separator />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="stock">স্টক পরিমাণ</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => handleChange("stock_quantity", Number(e.target.value))}
            placeholder="0"
            min={0}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unit">একক</Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => handleChange("unit", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="একক নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="reorder">রিঅর্ডার লেভেল</Label>
          <Input
            id="reorder"
            type="number"
            value={formData.reorder_level}
            onChange={(e) => handleChange("reorder_level", Number(e.target.value))}
            placeholder="10"
            min={0}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="weight_kg">ওজন (কেজি)</Label>
          <Input
            id="weight_kg"
            type="number"
            value={formData.weight_kg}
            onChange={(e) => handleChange("weight_kg", Number(e.target.value))}
            placeholder="0.00"
            min={0}
            step="0.01"
          />
          <p className="text-xs text-muted-foreground">ডেলিভারি চার্জ ক্যালকুলেশনে ব্যবহৃত হবে</p>
        </div>
      </div>
      
      {formData.stock_quantity <= formData.reorder_level && formData.stock_quantity > 0 && (
        <div className="text-sm bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 p-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          স্টক রিঅর্ডার লেভেলে বা নিচে আছে!
        </div>
      )}

      {/* Company & Brand Section */}
      <div className="space-y-1 mt-2">
        <h4 className="font-semibold text-sm text-muted-foreground">কোম্পানি ও ব্র্যান্ড</h4>
        <Separator />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="company">কোম্পানি/সাপ্লায়ার</Label>
          <Select
            value={formData.company_id || "none"}
            onValueChange={(value) => {
              const actualValue = value === "none" ? "" : value;
              handleChange("company_id", actualValue);
              // Reset brand if company changes
              if (formData.brand_id) {
                const brand = brands.find(b => b.id === formData.brand_id);
                if (brand && brand.company_id !== actualValue) {
                  handleChange("brand_id", "");
                }
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="কোম্পানি নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">কোনোটি নয়</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name_bn || company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="brand">ব্র্যান্ড</Label>
          <Select
            value={formData.brand_id || "none"}
            onValueChange={(value) => handleChange("brand_id", value === "none" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="ব্র্যান্ড নির্বাচন করুন" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">কোনোটি নয়</SelectItem>
              {filteredBrands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name_bn || brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Media Section */}
      <div className="space-y-1 mt-2">
        <h4 className="font-semibold text-sm text-muted-foreground">মিডিয়া ও লিংক</h4>
        <Separator />
      </div>

      {/* Image Mode Toggle */}
      <div className="grid gap-2">
        <Label>পণ্যের ছবি</Label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setImageMode("upload")}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              imageMode === "upload" 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            <Upload className="h-4 w-4" />
            আপলোড
          </button>
          <button
            type="button"
            onClick={() => setImageMode("url")}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
              imageMode === "url" 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            <Link2 className="h-4 w-4" />
            URL
          </button>
        </div>

        {imageMode === "upload" ? (
          <div className="space-y-2">
            <label
              htmlFor="product-image-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">ছবি নির্বাচন করুন</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, WebP (সর্বোচ্চ 5MB)</span>
                </>
              )}
            </label>
            <input
              id="product-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  toast.error("ফাইল সাইজ ৫MB এর বেশি হতে পারবে না");
                  return;
                }
                setIsUploading(true);
                try {
                  const fileExt = file.name.split('.').pop();
                  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                  const filePath = `products/${fileName}`;
                  
                  const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file);
                  
                  if (uploadError) throw uploadError;
                  
                  const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);
                  
                  handleChange("image_url", publicUrl);
                  toast.success("ছবি আপলোড সফল হয়েছে");
                } catch (error) {
                  console.error("Upload error:", error);
                  toast.error("ছবি আপলোড করতে সমস্যা হয়েছে");
                } finally {
                  setIsUploading(false);
                  e.target.value = '';
                }
              }}
            />
          </div>
        ) : (
          <Input
            id="image"
            value={formData.image_url}
            onChange={(e) => handleChange("image_url", e.target.value)}
            placeholder="https://example.com/image.jpg"
            autoComplete="off"
          />
        )}

        {formData.image_url && (
          <div className="mt-2 relative inline-block">
            <img 
              src={formData.image_url} 
              alt="Preview" 
              className="w-20 h-20 object-cover rounded-lg border"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}
      </div>
      
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="hide-external-link"
            checked={hideExternalLink}
            onCheckedChange={(checked) => {
              setHideExternalLink(!!checked);
              if (checked) {
                handleChange("external_link", "");
              }
            }}
          />
          <Label htmlFor="hide-external-link" className="text-sm cursor-pointer">বাহ্যিক লিংক হাইড করুন</Label>
        </div>
        {!hideExternalLink && (
          <>
            <Label htmlFor="link">বাহ্যিক লিংক</Label>
            <Input
              id="link"
              value={formData.external_link}
              onChange={(e) => handleChange("external_link", e.target.value)}
              placeholder="https://fishcare.com.bd/product"
              autoComplete="off"
            />
          </>
        )}
      </div>

      {/* SEO Section */}
      <div className="space-y-1 mt-2">
        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-1">
          <Search className="h-3.5 w-3.5" />
          SEO সেটিংস
        </h4>
        <Separator />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="focus_keyword">ফোকাস কীওয়ার্ড</Label>
        <Input
          id="focus_keyword"
          value={formData.focus_keyword}
          onChange={(e) => handleChange("focus_keyword", e.target.value)}
          placeholder="যেমন: মাছের ঔষধ, ফিশ ফিড"
          autoComplete="off"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="meta_title">মেটা টাইটেল</Label>
          <span className={`text-xs ${formData.meta_title.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {formData.meta_title.length}/60
          </span>
        </div>
        <Input
          id="meta_title"
          value={formData.meta_title}
          onChange={(e) => handleChange("meta_title", e.target.value)}
          placeholder="সার্চ ইঞ্জিনে যে টাইটেল দেখাবে"
          autoComplete="off"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="meta_description">মেটা ডেসক্রিপশন</Label>
          <span className={`text-xs ${formData.meta_description.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {formData.meta_description.length}/160
          </span>
        </div>
        <Textarea
          id="meta_description"
          value={formData.meta_description}
          onChange={(e) => handleChange("meta_description", e.target.value)}
          placeholder="সার্চ রেজাল্টে দেখানো সংক্ষিপ্ত বিবরণ"
          rows={2}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="image_alt_text">ইমেজ ALT ট্যাগ</Label>
        <Input
          id="image_alt_text"
          value={formData.image_alt_text}
          onChange={(e) => handleChange("image_alt_text", e.target.value)}
          placeholder="ছবির বিবরণ (SEO এর জন্য গুরুত্বপূর্ণ)"
          autoComplete="off"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="seo_url">SEO ফ্রেন্ডলি URL</Label>
        <Input
          id="seo_url"
          value={formData.seo_url}
          onChange={(e) => handleChange("seo_url", e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-'))}
          placeholder="product-name-in-english"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          ইংরেজিতে, শুধু ছোট হাতের অক্ষর ও হাইফেন ব্যবহার করুন
        </p>
      </div>

      {/* SEO Preview */}
      {(formData.meta_title || formData.name) && (
        <div className="border rounded-lg p-3 bg-muted/30 space-y-1">
          <p className="text-xs text-muted-foreground font-medium">সার্চ প্রিভিউ:</p>
          <p className="text-blue-600 text-sm font-medium truncate">
            {formData.meta_title || formData.name}
          </p>
          <p className="text-green-700 text-xs truncate">
            fishcal.lovable.app/product/{formData.seo_url || formData.name.toLowerCase().replace(/\s+/g, '-')}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {formData.meta_description || formData.description || 'কোনো ডেসক্রিপশন দেওয়া হয়নি...'}
          </p>
        </div>
      )}

      {/* Recommendation Tags */}
      <div className="grid gap-2 mt-2">
        <Label className="font-semibold">প্রস্তাবিত পণ্য ট্যাগ</Label>
        <p className="text-xs text-muted-foreground">ক্যালকুলেটর ও অন্যান্য পেজে প্রদর্শনের জন্য ট্যাগ নির্বাচন করুন</p>
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'popular_medicine', label: 'জনপ্রিয় ঔষধ' },
            { value: 'admin_recommended', label: 'অ্যাডমিন প্রস্তাবিত' },
            { value: 'calculator_related', label: 'ক্যালকুলেটর সম্পর্কিত' },
          ].map(tag => (
            <label key={tag.value} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.recommendation_tags.includes(tag.value)}
                onCheckedChange={(checked) => {
                  const tags = checked
                    ? [...formData.recommendation_tags, tag.value]
                    : formData.recommendation_tags.filter(t => t !== tag.value);
                  onFormChange({ ...formData, recommendation_tags: tags });
                }}
              />
              <span className="text-sm">{tag.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      <Button3D
        variant="success"
        onClick={onSubmit}
        disabled={isSubmitting || !formData.name || formData.price <= 0}
        className="mt-4"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {submitLabel}
      </Button3D>
    </div>
  );
};

const AdminProducts = ({ Layout = AdminLayout }: { Layout?: React.ComponentType<{ children: React.ReactNode }> }) => {
  const { products, isLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImagesOpen, setIsImagesOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProduct);
  const [activeTab, setActiveTab] = useState("products");

  // Helper function for category label
  const getCategoryLabel = (value: string) => {
    const cat = categories.find((c) => c.name === value || c.slug === value);
    return cat?.name_bn || value;
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Fetch companies and brands
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, brandsRes] = await Promise.all([
          supabase.from("companies").select("id, name, name_bn").eq("is_active", true).order("name"),
          supabase.from("brands").select("id, name, name_bn, company_id").eq("is_active", true).order("name"),
        ]);
        
        if (companiesRes.data) setCompanies(companiesRes.data);
        if (brandsRes.data) setBrands(brandsRes.data);
      } catch (error) {
        console.error("Error fetching companies/brands:", error);
      }
    };
    fetchData();
  }, []);

  const handleFormChange = useCallback((data: ProductFormData) => {
    setFormData(data);
  }, []);

  const handleAdd = async () => {
    if (!formData.name || formData.price <= 0) {
      return;
    }
    setIsSubmitting(true);
    const success = await addProduct({
      name: formData.name,
      description: formData.description || null,
      price: formData.price,
      cost_price: formData.cost_price || 0,
      discount_percentage: formData.discount_percentage,
      category: formData.category,
      image_url: formData.image_url || null,
      external_link: formData.external_link || null,
      stock_quantity: formData.stock_quantity,
      sku: formData.sku || null,
      unit: formData.unit || "pcs",
      reorder_level: formData.reorder_level,
      company_id: formData.company_id || null,
      brand_id: formData.brand_id || null,
      weight_kg: formData.weight_kg || 0,
      focus_keyword: formData.focus_keyword || null,
      meta_title: formData.meta_title || null,
      meta_description: formData.meta_description || null,
      image_alt_text: formData.image_alt_text || null,
      seo_url: formData.seo_url || null,
    } as any);
    setIsSubmitting(false);
    if (success) {
      setFormData(emptyProduct);
      setIsAddOpen(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct || !formData.name || formData.price <= 0) {
      return;
    }
    setIsSubmitting(true);
    const success = await updateProduct(String(selectedProduct.id), {
      name: formData.name,
      description: formData.description || null,
      price: formData.price,
      cost_price: formData.cost_price || 0,
      discount_percentage: formData.discount_percentage,
      category: formData.category,
      image_url: formData.image_url || null,
      external_link: formData.external_link || null,
      stock_quantity: formData.stock_quantity,
      sku: formData.sku || null,
      unit: formData.unit || "pcs",
      reorder_level: formData.reorder_level,
      company_id: formData.company_id || null,
      brand_id: formData.brand_id || null,
      weight_kg: formData.weight_kg || 0,
      focus_keyword: formData.focus_keyword || null,
      meta_title: formData.meta_title || null,
      meta_description: formData.meta_description || null,
      image_alt_text: formData.image_alt_text || null,
      seo_url: formData.seo_url || null,
    } as any);
    setIsSubmitting(false);
    if (success) {
      setIsEditOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    const success = await deleteProduct(String(selectedProduct.id));
    setIsSubmitting(false);
    if (success) {
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    const p = product as any;
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      cost_price: product.cost_price || 0,
      discount_percentage: product.discount_percentage,
      category: product.category,
      image_url: product.image_url || "",
      external_link: product.external_link || "",
      stock_quantity: product.stock_quantity || 0,
      sku: product.sku || "",
      unit: product.unit || "pcs",
      reorder_level: product.reorder_level || 10,
      company_id: product.company_id ? String(product.company_id) : "",
      brand_id: product.brand_id ? String(product.brand_id) : "",
      weight_kg: p.weight_kg || 0,
      focus_keyword: p.focus_keyword || "",
      meta_title: p.meta_title || "",
      meta_description: p.meta_description || "",
      image_alt_text: p.image_alt_text || "",
      seo_url: p.seo_url || "",
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleOpenAddDialog = () => {
    setFormData(emptyProduct);
    setIsAddOpen(true);
  };

  const [isImporting, setIsImporting] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState<"skip" | "update">("skip");

  // Calculate stats
  const lowStockProducts = products.filter(p => (p.stock_quantity || 0) <= (p.reorder_level || 10) && (p.stock_quantity || 0) > 0);
  const outOfStockProducts = products.filter(p => (p.stock_quantity || 0) === 0);

  const handleExportCSV = () => {
    if (products.length === 0) {
      toast.error("এক্সপোর্ট করার মতো কোনো পণ্য নেই");
      return;
    }
    const headers = ["নাম", "SKU", "ক্যাটাগরি", "ক্রয় মূল্য", "বিক্রয় মূল্য", "ডিসকাউন্ট %", "স্টক", "একক", "রিঅর্ডার লেভেল", "ওজন (কেজি)", "বিবরণ", "ইমেজ URL"];
    const csvRows = [headers.join(",")];
    products.forEach((p: any) => {
      const row = [
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${p.sku || ""}"`,
        `"${p.category || ""}"`,
        p.cost_price || 0,
        p.price || 0,
        p.discount_percentage || 0,
        p.stock_quantity || 0,
        `"${p.unit || "pcs"}"`,
        p.reorder_level || 10,
        p.weight_kg || 0,
        `"${(p.description || "").replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${p.image_url || ""}"`,
      ];
      csvRows.push(row.join(","));
    });
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${products.length}টি পণ্য এক্সপোর্ট হয়েছে`);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) {
        toast.error("CSV ফাইলে কোনো ডেটা নেই");
        setIsImporting(false);
        return;
      }
      // Skip header row
      const dataLines = lines.slice(1);
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;

      for (const line of dataLines) {
        try {
          const fields: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
              else { inQuotes = !inQuotes; }
            } else if (ch === ',' && !inQuotes) {
              fields.push(current.trim()); current = "";
            } else {
              current += ch;
            }
          }
          fields.push(current.trim());

          const [name, sku, category, costPrice, price, discount, stock, unit, reorder, weight, description, imageUrl] = fields;
          if (!name || !parseFloat(price)) continue;

          const productData = {
            name,
            sku: sku || null,
            category: category || "medicine",
            cost_price: parseFloat(costPrice) || 0,
            price: parseFloat(price) || 0,
            discount_percentage: parseFloat(discount) || 0,
            stock_quantity: parseInt(stock) || 0,
            unit: unit || "pcs",
            reorder_level: parseInt(reorder) || 10,
            weight_kg: parseFloat(weight) || 0,
            description: description || null,
            image_url: imageUrl || null,
          };

          // Check for duplicate by SKU
          if (sku) {
            const { data: existing } = await supabase
              .from("products")
              .select("id")
              .eq("sku", sku)
              .maybeSingle();

            if (existing) {
              if (duplicateAction === "skip") {
                skippedCount++;
                continue;
              } else {
                // Update existing product
                const { error } = await supabase
                  .from("products")
                  .update(productData)
                  .eq("id", existing.id);
                if (error) { errorCount++; } else { updatedCount++; }
                continue;
              }
            }
          }

          const { error } = await supabase.from("products").insert(productData);
          if (error) { errorCount++; } else { successCount++; }
        } catch { errorCount++; }
      }

      if (successCount > 0) {
        toast.success(`${successCount}টি পণ্য সফলভাবে ইমপোর্ট হয়েছে`);
        window.location.reload();
      }
      const messages: string[] = [];
      if (successCount > 0) messages.push(`${successCount}টি নতুন যোগ`);
      if (updatedCount > 0) messages.push(`${updatedCount}টি আপডেট`);
      if (skippedCount > 0) messages.push(`${skippedCount}টি স্কিপ (ডুপ্লিকেট)`);
      if (messages.length > 0) {
        toast.success(messages.join(", "));
        window.location.reload();
      }
      if (errorCount > 0) {
        toast.error(`${errorCount}টি পণ্য ইমপোর্ট করতে সমস্যা হয়েছে`);
      }
    } catch (err) {
      toast.error("CSV ফাইল পড়তে সমস্যা হয়েছে");
    }
    setIsImporting(false);
    e.target.value = "";
  };

  const handleDownloadTemplate = () => {
    const headers = ["নাম", "SKU", "ক্যাটাগরি", "ক্রয় মূল্য", "বিক্রয় মূল্য", "ডিসকাউন্ট %", "স্টক", "একক", "রিঅর্ডার লেভেল", "ওজন (কেজি)", "বিবরণ", "ইমেজ URL"];
    const example = ['"ফিশ মেডিসিন"', '"SKU-001"', '"medicine"', '100', '150', '0', '50', '"pcs"', '10', '0.5', '"পণ্যের বিবরণ"', '""'];
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + example.join(",");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("টেমপ্লেট ডাউনলোড হয়েছে");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">পণ্য ব্যবস্থাপনা</h1>
            <p className="text-muted-foreground">শপের সকল পণ্য পরিচালনা করুন</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button3D variant="primary" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
              এক্সপোর্ট
            </Button3D>
            <Dialog>
              <DialogTrigger asChild>
                <Button3D variant="purple">
                  <FileUp className="h-4 w-4" />
                  ইমপোর্ট
                </Button3D>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>পণ্য ইমপোর্ট (CSV)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    CSV ফাইল থেকে পণ্য ইমপোর্ট করুন। প্রথমে টেমপ্লেট ডাউনলোড করে ফরম্যাট দেখুন।
                  </p>
                  <Button3D variant="primary" onClick={handleDownloadTemplate} className="w-full">
                    <Download className="h-4 w-4" />
                    টেমপ্লেট ডাউনলোড করুন
                  </Button3D>
                  <Separator />
                  <div className="space-y-2">
                    <Label>ডুপ্লিকেট SKU পাওয়া গেলে</Label>
                    <Select value={duplicateAction} onValueChange={(v: "skip" | "update") => setDuplicateAction(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">স্কিপ করুন (ডুপ্লিকেট বাদ দিন)</SelectItem>
                        <SelectItem value="update">আপডেট করুন (বিদ্যমান পণ্য আপডেট)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">একই SKU থাকলে কী করবে সেটি নির্বাচন করুন</p>
                  </div>
                  <Label>CSV ফাইল নির্বাচন করুন</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    disabled={isImporting}
                  />
                  {isImporting && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      ইমপোর্ট হচ্ছে...
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button3D variant="success" onClick={handleOpenAddDialog}>
                  <Plus className="h-4 w-4" />
                  নতুন পণ্য যোগ করুন
                </Button3D>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>নতুন পণ্য যোগ করুন</DialogTitle>
                </DialogHeader>
                <ProductForm
                  formData={formData}
                  onFormChange={handleFormChange}
                  onSubmit={handleAdd}
                  submitLabel="পণ্য যোগ করুন"
                  isSubmitting={isSubmitting}
                  companies={companies}
                  brands={brands}
                  categories={categories}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs for Products and Categories */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              পণ্য তালিকা
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              ক্যাটাগরি
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{products.length}</div>
                  <div className="text-sm text-muted-foreground">মোট পণ্য</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-primary">
                    {products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">মোট স্টক</div>
                </CardContent>
              </Card>
              <Card className={lowStockProducts.length > 0 ? "border-amber-500" : ""}>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-amber-600">{lowStockProducts.length}</div>
                  <div className="text-sm text-muted-foreground">কম স্টক</div>
                </CardContent>
              </Card>
              <Card className={outOfStockProducts.length > 0 ? "border-destructive" : ""}>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-destructive">{outOfStockProducts.length}</div>
                  <div className="text-sm text-muted-foreground">স্টক শেষ</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  পণ্য তালিকা ({products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading || categoriesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    কোন পণ্য নেই। উপরের বাটন দিয়ে নতুন পণ্য যোগ করুন।
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">ছবি</TableHead>
                          <TableHead>পণ্যের নাম</TableHead>
                          <TableHead>ক্যাটাগরি</TableHead>
                          <TableHead className="text-center">স্টক</TableHead>
                          <TableHead className="text-right">ক্রয় মূল্য</TableHead>
                          <TableHead className="text-right">মূল দাম</TableHead>
                          <TableHead className="text-right">বিক্রয় দাম</TableHead>
                          <TableHead className="text-center">অ্যাকশন</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => {
                          const stock = product.stock_quantity || 0;
                          const reorder = product.reorder_level || 10;
                          const isLowStock = stock <= reorder && stock > 0;
                          const isOutOfStock = stock === 0;
                          
                          return (
                            <TableRow key={product.id}>
                              <TableCell>
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{product.name}</div>
                                {product.sku && (
                                  <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{getCategoryLabel(product.category)}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {isOutOfStock ? (
                                  <Badge variant="destructive">স্টক শেষ</Badge>
                                ) : isLowStock ? (
                                  <Badge variant="secondary">
                                    {stock} {getUnitLabel(product.unit || "pcs")}
                                  </Badge>
                                ) : (
                                  <span className="font-medium">{stock} {getUnitLabel(product.unit || "pcs")}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {(product as any).cost_price > 0 ? `৳${(product as any).cost_price}` : '—'}
                              </TableCell>
                              <TableCell className="text-right">৳{product.price}</TableCell>
                              <TableCell className="text-right font-bold text-primary">
                                ৳{getDiscountedPrice(product.price, product.discount_percentage)}
                                {product.discount_percentage > 0 && (
                                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                                    ({product.discount_percentage}%)
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  <Link to={`/product/${product.id}`} target="_blank">
                                    <Button3D variant="primary" size="sm">
                                      <Eye className="h-4 w-4" />
                                    </Button3D>
                                  </Link>
                                  <Button3D
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      setIsImagesOpen(true);
                                    }}
                                    title="ছবি ম্যানেজ করুন"
                                  >
                                    <ImagePlus className="h-4 w-4" />
                                  </Button3D>
                                  <Button3D
                                    variant="primary"
                                    size="sm"
                                    onClick={() => openEditDialog(product)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button3D>
                                  <Button3D
                                    variant="danger"
                                    size="sm"
                                    onClick={() => openDeleteDialog(product)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button3D>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <CategoryManagement />
          </TabsContent>
        </Tabs>
        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>পণ্য সম্পাদনা করুন</DialogTitle>
            </DialogHeader>
            <ProductForm
              formData={formData}
              onFormChange={handleFormChange}
              onSubmit={handleEdit}
              submitLabel="আপডেট করুন"
              isSubmitting={isSubmitting}
              companies={companies}
              brands={brands}
              categories={categories}
            />
            {/* Image Gallery Manager */}
            {selectedProduct && (
              <div className="mt-4">
                <ProductImageGallery productId={selectedProduct.id} />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Images Dialog */}
        <Dialog open={isImagesOpen} onOpenChange={setIsImagesOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ছবি ম্যানেজ করুন - {selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <ProductImageGallery productId={selectedProduct.id} />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>পণ্য মুছে ফেলুন</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                আপনি কি নিশ্চিত যে আপনি "{selectedProduct?.name}" মুছে ফেলতে চান?
                এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button3D variant="primary" size="sm" onClick={() => setIsDeleteOpen(false)}>
                বাতিল
              </Button3D>
              <Button3D variant="danger" size="sm" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                মুছে ফেলুন
              </Button3D>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminProducts;
