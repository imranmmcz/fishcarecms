import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { marketPricesRepo } from "@/repositories/marketPrices";
import { getDivisions, getDistrictsByDivision, getUpazilasByDistrict } from "@/data/bangladeshLocationData";
import { Plus, Pencil, Trash2, Fish, Search, Loader2, MapPin } from "lucide-react";
import { format } from "date-fns";

interface MarketPrice {
  id: string;
  fish_name: string;
  fish_name_bn: string;
  price_per_kg: number;
  min_price: number | null;
  max_price: number | null;
  division: string;
  district: string;
  upazila: string;
  market_name: string | null;
  price_date: string;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  fish_name: "",
  fish_name_bn: "",
  price_per_kg: "",
  min_price: "",
  max_price: "",
  division: "",
  district: "",
  upazila: "",
  market_name: "",
};

const AdminMarketPrices = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<MarketPrice | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);
  const [upazilas, setUpazilas] = useState<string[]>([]);

  const divisions = getDivisions();

  // Fetch market prices
  const fetchPrices = async () => {
    setLoading(true);
    try {
      const data = await marketPricesRepo.list({ search: searchQuery || undefined });
      setPrices(data);
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast.error("তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  // Update districts when division changes
  useEffect(() => {
    if (form.division) {
      setDistricts(getDistrictsByDivision(form.division));
    } else {
      setDistricts([]);
    }
  }, [form.division]);

  // Update upazilas when district changes
  useEffect(() => {
    if (form.district) {
      setUpazilas(getUpazilasByDistrict(form.district));
    } else {
      setUpazilas([]);
    }
  }, [form.district]);

  const handleOpenDialog = (price?: MarketPrice) => {
    if (price) {
      setSelectedPrice(price);
      setForm({
        fish_name: price.fish_name,
        fish_name_bn: price.fish_name_bn,
        price_per_kg: String(price.price_per_kg),
        min_price: price.min_price ? String(price.min_price) : "",
        max_price: price.max_price ? String(price.max_price) : "",
        division: price.division,
        district: price.district,
        upazila: price.upazila,
        market_name: price.market_name || "",
      });
      // Pre-load districts and upazilas for editing
      setDistricts(getDistrictsByDivision(price.division));
      setUpazilas(getUpazilasByDistrict(price.district));
    } else {
      setSelectedPrice(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPrice(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    // Validation
    if (!form.fish_name || !form.fish_name_bn || !form.price_per_kg || !form.division || !form.district || !form.upazila) {
      toast.error("সকল প্রয়োজনীয় ফিল্ড পূরণ করুন");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fish_name: form.fish_name,
        fish_name_bn: form.fish_name_bn,
        price_per_kg: parseFloat(form.price_per_kg),
        min_price: form.min_price ? parseFloat(form.min_price) : null,
        max_price: form.max_price ? parseFloat(form.max_price) : null,
        division: form.division,
        district: form.district,
        upazila: form.upazila,
        market_name: form.market_name || null,
        price_date: new Date().toISOString().split("T")[0],
      };

      if (selectedPrice) {
        // Update
        await marketPricesRepo.update(selectedPrice.id, payload);
        toast.success("বাজার দর সফলভাবে আপডেট হয়েছে");
      } else {
        // Insert
        await marketPricesRepo.create(payload);
        toast.success("বাজার দর সফলভাবে যোগ হয়েছে");
      }

      handleCloseDialog();
      fetchPrices();
    } catch (error) {
      console.error("Error saving price:", error);
      toast.error("সংরক্ষণ করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPrice) return;

    setSaving(true);
    try {
      await marketPricesRepo.remove(selectedPrice.id);
      toast.success("বাজার দর সফলভাবে মুছে ফেলা হয়েছে");
      setDeleteDialogOpen(false);
      setSelectedPrice(null);
      fetchPrices();
    } catch (error) {
      console.error("Error deleting price:", error);
      toast.error("মুছে ফেলতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("bn-BD").format(price);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Fish className="h-6 w-6 text-primary" />
              বাজার দর পরিচালনা
            </h1>
            <p className="text-muted-foreground">মাছের বাজার দর যোগ, সম্পাদনা ও মুছুন</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            নতুন দাম যোগ করুন
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="মাছ, বিভাগ বা জেলা দিয়ে খুঁজুন..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchPrices()}
                />
              </div>
              <Button onClick={fetchPrices} variant="secondary">
                খুঁজুন
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">সকল বাজার দর ({prices.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : prices.length > 0 ? (
               <div className="overflow-x-auto">
                <Table className="text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-2 sm:px-4">মাছ</TableHead>
                      <TableHead className="text-right px-2 sm:px-4">দাম (৳/কেজি)</TableHead>
                      <TableHead className="hidden sm:table-cell px-2 sm:px-4">পরিসীমা</TableHead>
                      <TableHead className="px-2 sm:px-4">অবস্থান</TableHead>
                      <TableHead className="hidden md:table-cell px-2 sm:px-4">বাজার</TableHead>
                      <TableHead className="hidden sm:table-cell px-2 sm:px-4">আপডেট</TableHead>
                      <TableHead className="text-right px-2 sm:px-4">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prices.map((price) => (
                      <TableRow key={price.id}>
                        <TableCell className="px-2 sm:px-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Fish className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{price.fish_name_bn}</div>
                              <div className="text-[10px] sm:text-xs text-muted-foreground">{price.fish_name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-2 sm:px-4">
                          <span className="font-bold text-primary whitespace-nowrap">৳{formatPrice(price.price_per_kg)}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell px-2 sm:px-4">
                          {price.min_price && price.max_price ? (
                            <span className="text-muted-foreground whitespace-nowrap">
                              ৳{formatPrice(price.min_price)} - ৳{formatPrice(price.max_price)}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="px-2 sm:px-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0 hidden sm:block" />
                            <div className="min-w-0">
                              <div className="truncate">{price.upazila}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {price.district}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell px-2 sm:px-4">
                          {price.market_name || "-"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell px-2 sm:px-4">
                          <span className="text-muted-foreground whitespace-nowrap">
                            {format(new Date(price.updated_at), "dd/MM/yyyy")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right px-2 sm:px-4">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(price)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setSelectedPrice(price); setDeleteDialogOpen(true); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Fish className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>কোনো বাজার দর পাওয়া যায়নি</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fish className="h-5 w-5" />
              {selectedPrice ? "বাজার দর সম্পাদনা" : "নতুন বাজার দর যোগ করুন"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fish_name">মাছের নাম (English) *</Label>
                <Input
                  id="fish_name"
                  value={form.fish_name}
                  onChange={(e) => setForm({ ...form, fish_name: e.target.value })}
                  placeholder="Rohu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fish_name_bn">মাছের নাম (বাংলা) *</Label>
                <Input
                  id="fish_name_bn"
                  value={form.fish_name_bn}
                  onChange={(e) => setForm({ ...form, fish_name_bn: e.target.value })}
                  placeholder="রুই"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_per_kg">দাম (৳/কেজি) *</Label>
                <Input
                  id="price_per_kg"
                  type="number"
                  value={form.price_per_kg}
                  onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })}
                  placeholder="280"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_price">সর্বনিম্ন দাম</Label>
                <Input
                  id="min_price"
                  type="number"
                  value={form.min_price}
                  onChange={(e) => setForm({ ...form, min_price: e.target.value })}
                  placeholder="260"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_price">সর্বোচ্চ দাম</Label>
                <Input
                  id="max_price"
                  type="number"
                  value={form.max_price}
                  onChange={(e) => setForm({ ...form, max_price: e.target.value })}
                  placeholder="300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>বিভাগ *</Label>
                <Select
                  value={form.division}
                  onValueChange={(value) =>
                    setForm({ ...form, division: value, district: "", upazila: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="বিভাগ নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((div) => (
                      <SelectItem key={div} value={div}>
                        {div}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>জেলা *</Label>
                <Select
                  value={form.district}
                  onValueChange={(value) =>
                    setForm({ ...form, district: value, upazila: "" })
                  }
                  disabled={!form.division}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="জেলা নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((dist) => (
                      <SelectItem key={dist} value={dist}>
                        {dist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>উপজেলা *</Label>
                <Select
                  value={form.upazila}
                  onValueChange={(value) => setForm({ ...form, upazila: value })}
                  disabled={!form.district}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="উপজেলা নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {upazilas.map((upz) => (
                      <SelectItem key={upz} value={upz}>
                        {upz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="market_name">বাজারের নাম</Label>
              <Input
                id="market_name"
                value={form.market_name}
                onChange={(e) => setForm({ ...form, market_name: e.target.value })}
                placeholder="স্থানীয় বাজার"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              বাতিল
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedPrice ? "আপডেট করুন" : "যোগ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>মুছে ফেলার নিশ্চিতকরণ</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            আপনি কি নিশ্চিত যে আপনি "{selectedPrice?.fish_name_bn}" এর বাজার দর মুছে ফেলতে চান?
            এই পদক্ষেপটি পূর্বাবস্থায় ফেরানো যাবে না।
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              বাতিল
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              মুছে ফেলুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminMarketPrices;
