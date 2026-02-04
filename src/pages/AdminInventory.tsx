/**
 * Admin Inventory Management Page
 * Manages companies, brands, stock levels, and purchase orders
 */

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import PurchaseOrders from "@/components/PurchaseOrders";
import { StockHistory } from "@/components/StockHistory";
import {
  Building2,
  Tag,
  Package,
  ShoppingCart,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  Search,
} from "lucide-react";

// Types
interface Company {
  id: string;
  name: string;
  name_bn: string | null;
  company_type: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
}

interface Brand {
  id: string;
  name: string;
  name_bn: string | null;
  company_id: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock_quantity: number;
  sku: string | null;
  reorder_level: number;
  brand_id: string | null;
  company_id: string | null;
  unit: string;
}

const AdminInventory = () => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState("stock");
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [companyDialog, setCompanyDialog] = useState(false);
  const [brandDialog, setBrandDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: "",
    name_bn: "",
    company_type: "supplier",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    is_active: true,
  });

  const [brandForm, setBrandForm] = useState({
    name: "",
    name_bn: "",
    company_id: "",
    description: "",
    is_active: true,
  });

  const translations = {
    title: language === "bn" ? "ইনভেন্টরি ম্যানেজমেন্ট" : "Inventory Management",
    stock: language === "bn" ? "স্টক" : "Stock",
    companies: language === "bn" ? "কোম্পানি" : "Companies",
    brands: language === "bn" ? "ব্র্যান্ড" : "Brands",
    purchases: language === "bn" ? "ক্রয়" : "Purchases",
    addCompany: language === "bn" ? "কোম্পানি যোগ করুন" : "Add Company",
    addBrand: language === "bn" ? "ব্র্যান্ড যোগ করুন" : "Add Brand",
    name: language === "bn" ? "নাম" : "Name",
    nameBn: language === "bn" ? "নাম (বাংলা)" : "Name (Bengali)",
    type: language === "bn" ? "ধরন" : "Type",
    contact: language === "bn" ? "যোগাযোগ" : "Contact",
    phone: language === "bn" ? "ফোন" : "Phone",
    email: language === "bn" ? "ইমেইল" : "Email",
    address: language === "bn" ? "ঠিকানা" : "Address",
    active: language === "bn" ? "সক্রিয়" : "Active",
    save: language === "bn" ? "সংরক্ষণ" : "Save",
    cancel: language === "bn" ? "বাতিল" : "Cancel",
    supplier: language === "bn" ? "সাপ্লায়ার" : "Supplier",
    manufacturer: language === "bn" ? "প্রস্তুতকারক" : "Manufacturer",
    distributor: language === "bn" ? "পরিবেশক" : "Distributor",
    description: language === "bn" ? "বিবরণ" : "Description",
    selectCompany: language === "bn" ? "কোম্পানি নির্বাচন করুন" : "Select Company",
    product: language === "bn" ? "পণ্য" : "Product",
    category: language === "bn" ? "ক্যাটাগরি" : "Category",
    stockQty: language === "bn" ? "স্টক" : "Stock",
    reorderLevel: language === "bn" ? "রিঅর্ডার লেভেল" : "Reorder Level",
    status: language === "bn" ? "স্ট্যাটাস" : "Status",
    lowStock: language === "bn" ? "কম স্টক" : "Low Stock",
    outOfStock: language === "bn" ? "স্টক নেই" : "Out of Stock",
    inStock: language === "bn" ? "স্টক আছে" : "In Stock",
    search: language === "bn" ? "খুঁজুন..." : "Search...",
    refresh: language === "bn" ? "রিফ্রেশ" : "Refresh",
    lowStockAlert: language === "bn" ? "কম স্টক সতর্কতা" : "Low Stock Alert",
    noData: language === "bn" ? "কোন ডাটা নেই" : "No data found",
    edit: language === "bn" ? "সম্পাদনা" : "Edit",
    delete: language === "bn" ? "মুছুন" : "Delete",
  };

  const companyTypes = [
    { value: "supplier", label: translations.supplier },
    { value: "manufacturer", label: translations.manufacturer },
    { value: "distributor", label: translations.distributor },
  ];

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      // Fetch companies
      const companiesRes = await fetch(`${supabaseUrl}/rest/v1/companies?select=*&order=name`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken || supabaseKey}`,
        },
      });
      if (companiesRes.ok) setCompanies(await companiesRes.json());

      // Fetch brands
      const brandsRes = await fetch(`${supabaseUrl}/rest/v1/brands?select=*&order=name`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken || supabaseKey}`,
        },
      });
      if (brandsRes.ok) setBrands(await brandsRes.json());

      // Fetch products with stock info
      const productsRes = await fetch(
        `${supabaseUrl}/rest/v1/products?select=id,name,category,price,stock_quantity,sku,reorder_level,brand_id,company_id,unit&order=name`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken || supabaseKey}`,
          },
        }
      );
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "ডাটা লোড করতে সমস্যা হয়েছে" : "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Company CRUD
  const handleSaveCompany = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const body = {
        name: companyForm.name,
        name_bn: companyForm.name_bn || null,
        company_type: companyForm.company_type,
        contact_person: companyForm.contact_person || null,
        phone: companyForm.phone || null,
        email: companyForm.email || null,
        address: companyForm.address || null,
        is_active: companyForm.is_active,
      };

      let url = `${supabaseUrl}/rest/v1/companies`;
      let method = "POST";

      if (editingCompany) {
        url += `?id=eq.${editingCompany.id}`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method,
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken || supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: language === "bn" ? "সফল" : "Success",
          description: language === "bn" ? "কোম্পানি সংরক্ষিত হয়েছে" : "Company saved",
        });
        setCompanyDialog(false);
        resetCompanyForm();
        fetchData();
      }
    } catch (error) {
      console.error("Error saving company:", error);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm(language === "bn" ? "আপনি কি নিশ্চিত?" : "Are you sure?")) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      await fetch(`${supabaseUrl}/rest/v1/companies?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken || supabaseKey}`,
        },
      });

      fetchData();
      toast({
        title: language === "bn" ? "মুছে ফেলা হয়েছে" : "Deleted",
        description: language === "bn" ? "কোম্পানি মুছে ফেলা হয়েছে" : "Company deleted",
      });
    } catch (error) {
      console.error("Error deleting company:", error);
    }
  };

  const resetCompanyForm = () => {
    setCompanyForm({
      name: "",
      name_bn: "",
      company_type: "supplier",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      is_active: true,
    });
    setEditingCompany(null);
  };

  const openEditCompany = (company: Company) => {
    setEditingCompany(company);
    setCompanyForm({
      name: company.name,
      name_bn: company.name_bn || "",
      company_type: company.company_type,
      contact_person: company.contact_person || "",
      phone: company.phone || "",
      email: company.email || "",
      address: company.address || "",
      is_active: company.is_active,
    });
    setCompanyDialog(true);
  };

  // Brand CRUD
  const handleSaveBrand = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const body = {
        name: brandForm.name,
        name_bn: brandForm.name_bn || null,
        company_id: brandForm.company_id || null,
        description: brandForm.description || null,
        is_active: brandForm.is_active,
      };

      let url = `${supabaseUrl}/rest/v1/brands`;
      let method = "POST";

      if (editingBrand) {
        url += `?id=eq.${editingBrand.id}`;
        method = "PATCH";
      }

      const res = await fetch(url, {
        method,
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken || supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({
          title: language === "bn" ? "সফল" : "Success",
          description: language === "bn" ? "ব্র্যান্ড সংরক্ষিত হয়েছে" : "Brand saved",
        });
        setBrandDialog(false);
        resetBrandForm();
        fetchData();
      }
    } catch (error) {
      console.error("Error saving brand:", error);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm(language === "bn" ? "আপনি কি নিশ্চিত?" : "Are you sure?")) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      await fetch(`${supabaseUrl}/rest/v1/brands?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken || supabaseKey}`,
        },
      });

      fetchData();
      toast({
        title: language === "bn" ? "মুছে ফেলা হয়েছে" : "Deleted",
        description: language === "bn" ? "ব্র্যান্ড মুছে ফেলা হয়েছে" : "Brand deleted",
      });
    } catch (error) {
      console.error("Error deleting brand:", error);
    }
  };

  const resetBrandForm = () => {
    setBrandForm({
      name: "",
      name_bn: "",
      company_id: "",
      description: "",
      is_active: true,
    });
    setEditingBrand(null);
  };

  const openEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      name_bn: brand.name_bn || "",
      company_id: brand.company_id || "",
      description: brand.description || "",
      is_active: brand.is_active,
    });
    setBrandDialog(true);
  };

  // Stock helpers
  const getStockStatus = (product: Product) => {
    if (product.stock_quantity <= 0) {
      return { label: translations.outOfStock, color: "bg-red-500" };
    }
    if (product.stock_quantity <= product.reorder_level) {
      return { label: translations.lowStock, color: "bg-yellow-500" };
    }
    return { label: translations.inStock, color: "bg-green-500" };
  };

  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= p.reorder_level
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCompanyName = (id: string | null) => {
    if (!id) return "-";
    const company = companies.find((c) => c.id === id);
    return language === "bn" && company?.name_bn ? company.name_bn : company?.name || "-";
  };

  const getBrandName = (id: string | null) => {
    if (!id) return "-";
    const brand = brands.find((b) => b.id === id);
    return language === "bn" && brand?.name_bn ? brand.name_bn : brand?.name || "-";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{translations.title}</h1>
            <p className="text-muted-foreground">
              {language === "bn"
                ? "পণ্য স্টক, কোম্পানি ও ব্র্যান্ড ম্যানেজ করুন"
                : "Manage product stock, companies and brands"}
            </p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {translations.refresh}
          </Button>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="h-5 w-5" />
                {translations.lowStockAlert} ({lowStockProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStockProducts.slice(0, 10).map((p) => (
                  <Badge key={p.id} variant="outline" className="border-yellow-500 text-yellow-600">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {p.name} ({p.stock_quantity}/{p.reorder_level})
                  </Badge>
                ))}
                {lowStockProducts.length > 10 && (
                  <Badge variant="outline">+{lowStockProducts.length - 10} more</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {translations.stock}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {language === "bn" ? "হিস্ট্রি" : "History"}
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {translations.companies}
            </TabsTrigger>
            <TabsTrigger value="brands" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {translations.brands}
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {translations.purchases}
            </TabsTrigger>
          </TabsList>

          {/* Stock Tab */}
          <TabsContent value="stock" className="space-y-4 mt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={translations.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{translations.product}</TableHead>
                          <TableHead>{translations.category}</TableHead>
                          <TableHead>{translations.brands}</TableHead>
                          <TableHead>{translations.companies}</TableHead>
                          <TableHead className="text-right">{translations.stockQty}</TableHead>
                          <TableHead className="text-right">{translations.reorderLevel}</TableHead>
                          <TableHead>{translations.status}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => {
                          const status = getStockStatus(product);
                          return (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{product.category}</Badge>
                              </TableCell>
                              <TableCell>{getBrandName(product.brand_id)}</TableCell>
                              <TableCell>{getCompanyName(product.company_id)}</TableCell>
                              <TableCell className="text-right font-medium">
                                {product.stock_quantity} {product.unit}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {product.reorder_level}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${status.color} text-white`}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredProducts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              {translations.noData}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock History Tab */}
          <TabsContent value="history" className="mt-6">
            <StockHistory />
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Dialog open={companyDialog} onOpenChange={(open) => {
                setCompanyDialog(open);
                if (!open) resetCompanyForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {translations.addCompany}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCompany
                        ? language === "bn" ? "কোম্পানি সম্পাদনা" : "Edit Company"
                        : translations.addCompany}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{translations.name}</Label>
                        <Input
                          value={companyForm.name}
                          onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{translations.nameBn}</Label>
                        <Input
                          value={companyForm.name_bn}
                          onChange={(e) => setCompanyForm({ ...companyForm, name_bn: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{translations.type}</Label>
                      <Select
                        value={companyForm.company_type}
                        onValueChange={(v) => setCompanyForm({ ...companyForm, company_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {companyTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{translations.contact}</Label>
                        <Input
                          value={companyForm.contact_person}
                          onChange={(e) => setCompanyForm({ ...companyForm, contact_person: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{translations.phone}</Label>
                        <Input
                          value={companyForm.phone}
                          onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{translations.email}</Label>
                      <Input
                        type="email"
                        value={companyForm.email}
                        onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{translations.address}</Label>
                      <Textarea
                        value={companyForm.address}
                        onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={companyForm.is_active}
                        onCheckedChange={(checked) => setCompanyForm({ ...companyForm, is_active: checked })}
                      />
                      <Label>{translations.active}</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCompanyDialog(false)}>
                        {translations.cancel}
                      </Button>
                      <Button onClick={handleSaveCompany}>{translations.save}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{translations.name}</TableHead>
                      <TableHead>{translations.type}</TableHead>
                      <TableHead>{translations.contact}</TableHead>
                      <TableHead>{translations.phone}</TableHead>
                      <TableHead>{translations.status}</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">
                          {language === "bn" && company.name_bn ? company.name_bn : company.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {companyTypes.find((t) => t.value === company.company_type)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{company.contact_person || "-"}</TableCell>
                        <TableCell>{company.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge className={company.is_active ? "bg-green-500" : "bg-gray-500"}>
                            {company.is_active
                              ? language === "bn" ? "সক্রিয়" : "Active"
                              : language === "bn" ? "নিষ্ক্রিয়" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditCompany(company)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCompany(company.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {companies.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {translations.noData}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="space-y-4 mt-6">
            <div className="flex justify-end">
              <Dialog open={brandDialog} onOpenChange={(open) => {
                setBrandDialog(open);
                if (!open) resetBrandForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {translations.addBrand}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingBrand
                        ? language === "bn" ? "ব্র্যান্ড সম্পাদনা" : "Edit Brand"
                        : translations.addBrand}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{translations.name}</Label>
                        <Input
                          value={brandForm.name}
                          onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{translations.nameBn}</Label>
                        <Input
                          value={brandForm.name_bn}
                          onChange={(e) => setBrandForm({ ...brandForm, name_bn: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{translations.companies}</Label>
                      <Select
                        value={brandForm.company_id || "none"}
                        onValueChange={(v) => setBrandForm({ ...brandForm, company_id: v === "none" ? "" : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={translations.selectCompany} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-</SelectItem>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {language === "bn" && c.name_bn ? c.name_bn : c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{translations.description}</Label>
                      <Textarea
                        value={brandForm.description}
                        onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={brandForm.is_active}
                        onCheckedChange={(checked) => setBrandForm({ ...brandForm, is_active: checked })}
                      />
                      <Label>{translations.active}</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setBrandDialog(false)}>
                        {translations.cancel}
                      </Button>
                      <Button onClick={handleSaveBrand}>{translations.save}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{translations.name}</TableHead>
                      <TableHead>{translations.companies}</TableHead>
                      <TableHead>{translations.description}</TableHead>
                      <TableHead>{translations.status}</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell className="font-medium">
                          {language === "bn" && brand.name_bn ? brand.name_bn : brand.name}
                        </TableCell>
                        <TableCell>{getCompanyName(brand.company_id)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {brand.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={brand.is_active ? "bg-green-500" : "bg-gray-500"}>
                            {brand.is_active
                              ? language === "bn" ? "সক্রিয়" : "Active"
                              : language === "bn" ? "নিষ্ক্রিয়" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditBrand(brand)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBrand(brand.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {brands.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {translations.noData}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="space-y-4 mt-6">
            <PurchaseOrders 
              companies={companies}
              products={products.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                unit: p.unit,
              }))}
              onRefresh={fetchData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminInventory;
