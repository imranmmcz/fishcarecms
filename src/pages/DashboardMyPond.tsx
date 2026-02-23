import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Button3D } from "@/components/ui/button-3d";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Waves, Edit, Fish, ShoppingCart, Receipt, Scale, Eye } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface IncomeRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  pondName?: string;
  fishType?: string;
  fishWeight?: number;
  fishPrice?: number;
}

interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  pondName?: string;
}

interface SamplingFishEntry {
  fishType: string;
  sampleCount: number;
  sampleWeight: number;
}

interface SamplingRecord {
  id: string;
  pondId: string;
  pondName: string;
  date: string;
  fishEntries: SamplingFishEntry[];
  totalFish: number;
  totalWeight: number;
  avgWeight: number;
  notes: string;
}

interface FishStockEntry {
  fishType: string;
  quantity: number;
  weightPerFish: number; // গ্রাম
  pricePerPiece: number; // টাকা/পিস
}

const expenseCategories = [
  "খাবার", "ওষুধ", "সার", "চুন", "পোনা ক্রয়", "শ্রমিক", "বিদ্যুৎ", "যন্ত্রপাতি", "অন্যান্য"
];

interface PondRecord {
  id: string;
  name: string;
  area: number;
  areaUnit: string;
  depth: number;
  depthUnit: string;
  fishTypes: string[];
  fishCount: number;
  stockingDate: string;
  status: string;
  notes: string;
  fishStockEntries?: FishStockEntry[];
  totalStockingCost?: number;
}

const fishTypeOptions = [
  "রুই", "কাতলা", "মৃগেল", "সিলভার কার্প", "গ্রাস কার্প", 
  "কমন কার্প", "তেলাপিয়া", "পাঙ্গাস", "শিং", "মাগুর", "কই", "পাবদা"
];

const statusOptions = [
  { value: "active", label: "চলমান", color: "bg-green-500" },
  { value: "harvested", label: "আহরণ সম্পন্ন", color: "bg-blue-500" },
  { value: "preparation", label: "প্রস্তুতি", color: "bg-yellow-500" },
  { value: "empty", label: "খালি", color: "bg-gray-500" },
];

export default function DashboardMyPond() {
  const { user } = useAuth();
  const [ponds, setPonds] = useState<PondRecord[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPond, setEditingPond] = useState<PondRecord | null>(null);

  // Sell fish dialog state
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [sellingPond, setSellingPond] = useState<PondRecord | null>(null);
  const [sellFishType, setSellFishType] = useState("");
  const [sellWeight, setSellWeight] = useState("");
  const [sellPricePerKg, setSellPricePerKg] = useState("");
  const [sellDate, setSellDate] = useState(new Date().toISOString().split("T")[0]);
  const [sellBuyer, setSellBuyer] = useState("");

  // Add expense dialog state
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [expensePond, setExpensePond] = useState<PondRecord | null>(null);
  const [expenseCategory, setExpenseCategory] = useState("খাবার");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expenseDescription, setExpenseDescription] = useState("");

  // Sampling dialog state
  const [isSamplingDialogOpen, setIsSamplingDialogOpen] = useState(false);
  const [samplingPond, setSamplingPond] = useState<PondRecord | null>(null);
  const [samplingDate, setSamplingDate] = useState(new Date().toISOString().split("T")[0]);
  const [samplingFishEntries, setSamplingFishEntries] = useState<SamplingFishEntry[]>([]);
  const [samplingNotes, setSamplingNotes] = useState("");
  const [samplingRecords, setSamplingRecords] = useState<SamplingRecord[]>([]);

  // View sampling history dialog
  const [isViewSamplingOpen, setIsViewSamplingOpen] = useState(false);
  const [viewSamplingPond, setViewSamplingPond] = useState<PondRecord | null>(null);

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("শতক");
  const [depth, setDepth] = useState("");
  const [depthUnit, setDepthUnit] = useState("ফুট");
  const [fishTypes, setFishTypes] = useState<string[]>([]);
  const [fishCount, setFishCount] = useState("");
  const [stockingDate, setStockingDate] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");
  const [fishStockEntries, setFishStockEntries] = useState<FishStockEntry[]>([
    { fishType: "", quantity: 0, weightPerFish: 0, pricePerPiece: 0 }
  ]);

  const fetchPonds = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("farmer_ponds").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) {
      setPonds(data.map(p => ({
        id: p.id, name: p.name, area: Number(p.area), areaUnit: p.area_unit, depth: Number(p.depth), depthUnit: p.depth_unit,
        fishTypes: p.fish_types || [], fishCount: p.fish_count || 0, stockingDate: p.stocking_date || "",
        status: p.status, notes: p.notes || "",
        fishStockEntries: (p.fish_stock_entries as any) || [], totalStockingCost: Number(p.total_stocking_cost) || 0,
      })));
    }
  }, [user]);

  const fetchSamplings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("farmer_samplings").select("*").eq("user_id", user.id).order("date", { ascending: false });
    if (data) {
      setSamplingRecords(data.map(s => ({
        id: s.id, pondId: s.pond_id || "", pondName: s.pond_name, date: s.date,
        fishEntries: (s.fish_entries as any) || [], totalFish: s.total_fish || 0,
        totalWeight: Number(s.total_weight) || 0, avgWeight: Number(s.avg_weight) || 0, notes: s.notes || "",
      })));
    }
  }, [user]);

  useEffect(() => { fetchPonds(); fetchSamplings(); }, [fetchPonds, fetchSamplings]);

  const savePonds = async (newPonds: PondRecord[]) => {
    setPonds(newPonds);
  };

  const resetForm = () => {
    setName("");
    setArea("");
    setAreaUnit("শতক");
    setDepth("");
    setDepthUnit("ফুট");
    setFishTypes([]);
    setFishCount("");
    setStockingDate("");
    setStatus("active");
    setNotes("");
    setEditingPond(null);
    setFishStockEntries([{ fishType: "", quantity: 0, weightPerFish: 0, pricePerPiece: 0 }]);
  };

  // Fish stock entry management
  const updateFishStockEntry = (index: number, field: keyof FishStockEntry, value: string | number) => {
    const newEntries = [...fishStockEntries];
    if (field === "fishType") {
      newEntries[index].fishType = value as string;
    } else {
      newEntries[index][field] = parseFloat(value as string) || 0;
    }
    setFishStockEntries(newEntries);
  };

  const addFishStockEntry = () => {
    setFishStockEntries([...fishStockEntries, { fishType: "", quantity: 0, weightPerFish: 0, pricePerPiece: 0 }]);
  };

  const removeFishStockEntry = (index: number) => {
    if (fishStockEntries.length > 1) {
      setFishStockEntries(fishStockEntries.filter((_, i) => i !== index));
    }
  };

  const calculateStockTotals = () => {
    const validEntries = fishStockEntries.filter(e => e.fishType && e.quantity > 0);
    const totalFish = validEntries.reduce((sum, e) => sum + e.quantity, 0);
    const totalCost = validEntries.reduce((sum, e) => sum + (e.quantity * e.pricePerPiece), 0);
    const totalWeight = validEntries.reduce((sum, e) => sum + (e.quantity * e.weightPerFish), 0);
    return { totalFish, totalCost, totalWeight, validEntries };
  };

  const handleSubmit = async () => {
    if (!user || !name || !area || !depth) {
      toast.error("পুকুরের নাম, আয়তন ও গভীরতা দিন");
      return;
    }

    const { totalFish, totalCost, validEntries } = calculateStockTotals();
    const derivedFishTypes = validEntries.map(e => e.fishType).filter((v, i, a) => a.indexOf(v) === i);

    const pondPayload = {
      user_id: user.id,
      name,
      area: parseFloat(area),
      area_unit: areaUnit,
      depth: parseFloat(depth),
      depth_unit: depthUnit,
      fish_types: derivedFishTypes.length > 0 ? derivedFishTypes : fishTypes,
      fish_count: totalFish > 0 ? totalFish : (parseInt(fishCount) || 0),
      stocking_date: stockingDate || null,
      status,
      notes,
      fish_stock_entries: JSON.parse(JSON.stringify(validEntries)),
      total_stocking_cost: totalCost,
    };

    const isNewPond = !editingPond;

    if (editingPond) {
      const { error } = await supabase.from("farmer_ponds").update(pondPayload).eq("id", editingPond.id);
      if (error) { toast.error("আপডেটে সমস্যা"); return; }
      toast.success("পুকুর আপডেট করা হয়েছে");
    } else {
      const { error } = await supabase.from("farmer_ponds").insert(pondPayload);
      if (error) { toast.error("সংরক্ষণে সমস্যা"); return; }
      toast.success("পুকুর যোগ করা হয়েছে");
    }

    // Auto-create expense record for fish stocking cost (only for new ponds)
    if (isNewPond && totalCost > 0 && stockingDate) {
      await supabase.from("farmer_expenses").insert({
        user_id: user.id,
        date: stockingDate,
        category: "পোনা ক্রয়",
        amount: totalCost,
        description: `${name} - পোনা মজুদ (${totalFish} টি)`,
        pond_name: name,
      });
      toast.success(`৳${totalCost.toLocaleString("bn-BD")} পোনা ক্রয় খরচ রেকর্ড করা হয়েছে`);
    }

    fetchPonds();
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (pond: PondRecord) => {
    setEditingPond(pond);
    setName(pond.name);
    setArea(pond.area.toString());
    setAreaUnit(pond.areaUnit);
    setDepth(pond.depth.toString());
    setDepthUnit(pond.depthUnit);
    setFishTypes(pond.fishTypes);
    setFishCount(pond.fishCount.toString());
    setStockingDate(pond.stockingDate);
    setStatus(pond.status);
    setNotes(pond.notes);
    // Load fish stock entries if available
    if (pond.fishStockEntries && pond.fishStockEntries.length > 0) {
      setFishStockEntries(pond.fishStockEntries);
    } else {
      setFishStockEntries([{ fishType: "", quantity: 0, weightPerFish: 0, pricePerPiece: 0 }]);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("আপনি কি এই পুকুরটি মুছে ফেলতে চান?")) {
      await supabase.from("farmer_ponds").delete().eq("id", id);
      fetchPonds();
      toast.success("পুকুর মুছে ফেলা হয়েছে");
    }
  };

  const toggleFishType = (fish: string) => {
    if (fishTypes.includes(fish)) {
      setFishTypes(fishTypes.filter((f) => f !== fish));
    } else {
      setFishTypes([...fishTypes, fish]);
    }
  };

  const getStatusInfo = (statusValue: string) => {
    return statusOptions.find((s) => s.value === statusValue) || statusOptions[0];
  };

  const handleOpenSellDialog = (pond: PondRecord) => {
    setSellingPond(pond);
    setSellFishType(pond.fishTypes[0] || "");
    setSellWeight("");
    setSellPricePerKg("");
    setSellDate(new Date().toISOString().split("T")[0]);
    setSellBuyer("");
    setIsSellDialogOpen(true);
  };

  const handleSellFish = async () => {
    if (!user || !sellingPond || !sellWeight || !sellPricePerKg) {
      toast.error("ওজন এবং দাম দিন");
      return;
    }
    const weight = parseFloat(sellWeight);
    const pricePerKg = parseFloat(sellPricePerKg);
    const totalAmount = weight * pricePerKg;

    await supabase.from("farmer_incomes").insert({
      user_id: user.id, date: sellDate, category: "মাছ বিক্রয়", amount: totalAmount,
      description: sellBuyer ? `ক্রেতা: ${sellBuyer}` : `${sellFishType} - ${weight} কেজি @ ৳${pricePerKg}/কেজি`,
      pond_name: sellingPond.name, fish_type: sellFishType, fish_weight: weight, fish_price: pricePerKg,
    });

    toast.success(`৳${totalAmount.toLocaleString("bn-BD")} আয় রেকর্ড করা হয়েছে`);
    setIsSellDialogOpen(false);
    setSellingPond(null);
  };

  const handleOpenExpenseDialog = (pond: PondRecord) => {
    setExpensePond(pond);
    setExpenseCategory("খাবার");
    setExpenseAmount("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setExpenseDescription("");
    setIsExpenseDialogOpen(true);
  };

  const handleAddExpense = async () => {
    if (!user || !expensePond || !expenseAmount) {
      toast.error("খরচের পরিমাণ দিন");
      return;
    }
    const amount = parseFloat(expenseAmount);
    await supabase.from("farmer_expenses").insert({
      user_id: user.id, date: expenseDate, category: expenseCategory, amount,
      description: expenseDescription || `${expensePond.name} - ${expenseCategory}`,
      pond_name: expensePond.name,
    });
    toast.success(`৳${amount.toLocaleString("bn-BD")} খরচ রেকর্ড করা হয়েছে`);
    setIsExpenseDialogOpen(false);
    setExpensePond(null);
  };

  // Sampling functions
  const handleOpenSamplingDialog = (pond: PondRecord) => {
    setSamplingPond(pond);
    setSamplingDate(new Date().toISOString().split("T")[0]);
    setSamplingNotes("");
    // Initialize fish entries from pond's fish types
    const initialEntries: SamplingFishEntry[] = pond.fishTypes.map(fish => ({
      fishType: fish,
      sampleCount: 0,
      sampleWeight: 0
    }));
    setSamplingFishEntries(initialEntries.length > 0 ? initialEntries : [{ fishType: "", sampleCount: 0, sampleWeight: 0 }]);
    setIsSamplingDialogOpen(true);
  };

  const updateSamplingEntry = (index: number, field: keyof SamplingFishEntry, value: string | number) => {
    const newEntries = [...samplingFishEntries];
    if (field === "fishType") {
      newEntries[index].fishType = value as string;
    } else {
      newEntries[index][field] = parseFloat(value as string) || 0;
    }
    setSamplingFishEntries(newEntries);
  };

  const addSamplingEntry = () => {
    setSamplingFishEntries([...samplingFishEntries, { fishType: "", sampleCount: 0, sampleWeight: 0 }]);
  };

  const removeSamplingEntry = (index: number) => {
    if (samplingFishEntries.length > 1) {
      setSamplingFishEntries(samplingFishEntries.filter((_, i) => i !== index));
    }
  };

  const calculateSamplingTotals = () => {
    const totalSampleFish = samplingFishEntries.reduce((sum, e) => sum + e.sampleCount, 0);
    const totalSampleWeight = samplingFishEntries.reduce((sum, e) => sum + e.sampleWeight, 0);
    const avgWeight = totalSampleFish > 0 ? totalSampleWeight / totalSampleFish : 0;
    
    // Estimate total weight based on pond's total fish count
    const totalFish = samplingPond?.fishCount || 0;
    const estimatedTotalWeight = avgWeight * totalFish;
    
    return { totalSampleFish, totalSampleWeight, avgWeight, totalFish, estimatedTotalWeight };
  };

  const handleSaveSampling = async () => {
    if (!user || !samplingPond) return;
    const validEntries = samplingFishEntries.filter(e => e.fishType && e.sampleCount > 0);
    if (validEntries.length === 0) { toast.error("অন্তত একটি মাছের নমুনা তথ্য দিন"); return; }
    const { avgWeight, totalFish, estimatedTotalWeight } = calculateSamplingTotals();

    await supabase.from("farmer_samplings").insert({
      user_id: user.id, pond_id: samplingPond.id, pond_name: samplingPond.name, date: samplingDate,
      fish_entries: JSON.parse(JSON.stringify(validEntries)),
      total_fish: totalFish, total_weight: estimatedTotalWeight, avg_weight: avgWeight, notes: samplingNotes,
    });

    toast.success("নমুনায়ন সংরক্ষণ করা হয়েছে");
    fetchSamplings();
    setIsSamplingDialogOpen(false);
    setSamplingPond(null);
  };

  const handleViewSamplingHistory = (pond: PondRecord) => {
    setViewSamplingPond(pond);
    setIsViewSamplingOpen(true);
  };

  const getPondSamplings = (pondId: string) => {
    return samplingRecords.filter(s => s.pondId === pondId).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const deleteSampling = async (id: string) => {
    if (confirm("আপনি কি এই নমুনায়ন রেকর্ড মুছে ফেলতে চান?")) {
      await supabase.from("farmer_samplings").delete().eq("id", id);
      fetchSamplings();
      toast.success("নমুনায়ন রেকর্ড মুছে ফেলা হয়েছে");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Waves className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">আমার পুকুর</h1>
              <p className="text-muted-foreground">আপনার সকল পুকুরের তথ্য</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button3D variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                নতুন পুকুর যোগ করুন
              </Button3D>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPond ? "পুকুর সম্পাদনা" : "নতুন পুকুর যোগ করুন"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>পুকুরের নাম *</Label>
                  <Input placeholder="যেমন: পশ্চিম পুকুর" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>স্ট্যাটাস</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>আয়তন *</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="০" value={area} onChange={(e) => setArea(e.target.value)} />
                    <Select value={areaUnit} onValueChange={setAreaUnit}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="শতক">শতক</SelectItem>
                        <SelectItem value="একর">একর</SelectItem>
                        <SelectItem value="বর্গমিটার">বর্গমিটার</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>গভীরতা *</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="০" value={depth} onChange={(e) => setDepth(e.target.value)} />
                    <Select value={depthUnit} onValueChange={setDepthUnit}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ফুট">ফুট</SelectItem>
                        <SelectItem value="মিটার">মিটার</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>মজুদের তারিখ</Label>
                  <Input type="date" value={stockingDate} onChange={(e) => setStockingDate(e.target.value)} />
                </div>

                {/* Fish Stocking Details Section */}
                <div className="space-y-3 md:col-span-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Fish className="h-5 w-5 text-primary" />
                      পোনা মজুদের বিস্তারিত
                    </Label>
                  </div>
                  
                  <div className="space-y-3">
                    {fishStockEntries.map((entry, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end bg-muted/50 p-2 rounded-lg">
                        <div className="col-span-12 md:col-span-3">
                          <Label className="text-xs">মাছের প্রজাতি</Label>
                          <Select 
                            value={entry.fishType} 
                            onValueChange={(val) => updateFishStockEntry(index, "fishType", val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="নির্বাচন করুন" />
                            </SelectTrigger>
                            <SelectContent>
                              {fishTypeOptions.map((fish) => (
                                <SelectItem key={fish} value={fish}>{fish}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <Label className="text-xs">সংখ্যা</Label>
                          <Input 
                            type="number" 
                            placeholder="০"
                            value={entry.quantity || ""}
                            onChange={(e) => updateFishStockEntry(index, "quantity", e.target.value)}
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <Label className="text-xs">ওজন/পিস (গ্রাম)</Label>
                          <Input 
                            type="number" 
                            placeholder="০"
                            value={entry.weightPerFish || ""}
                            onChange={(e) => updateFishStockEntry(index, "weightPerFish", e.target.value)}
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <Label className="text-xs">দাম/পিস (৳)</Label>
                          <Input 
                            type="number" 
                            placeholder="০"
                            value={entry.pricePerPiece || ""}
                            onChange={(e) => updateFishStockEntry(index, "pricePerPiece", e.target.value)}
                          />
                        </div>
                        <div className="col-span-8 md:col-span-2 text-sm">
                          <Label className="text-xs">মোট</Label>
                          <p className="font-semibold text-primary py-2">
                            ৳{(entry.quantity * entry.pricePerPiece).toLocaleString("bn-BD")}
                          </p>
                        </div>
                        <div className="col-span-4 md:col-span-1 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            type="button"
                            onClick={() => removeFishStockEntry(index)}
                            disabled={fishStockEntries.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button variant="outline" size="sm" type="button" onClick={addFishStockEntry}>
                      <Plus className="h-4 w-4 mr-1" />
                      আরো মাছ যোগ করুন
                    </Button>
                  </div>

                  {/* Auto calculated summary */}
                  {(() => {
                    const { totalFish, totalCost, totalWeight } = calculateStockTotals();
                    if (totalFish > 0) {
                      return (
                        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg mt-3">
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="text-center">
                              <span className="text-muted-foreground block">মোট মাছ</span>
                              <p className="font-bold text-lg">{totalFish.toLocaleString("bn-BD")} টি</p>
                            </div>
                            <div className="text-center">
                              <span className="text-muted-foreground block">মোট ওজন</span>
                              <p className="font-bold text-lg">{(totalWeight / 1000).toFixed(2)} কেজি</p>
                            </div>
                            <div className="text-center">
                              <span className="text-muted-foreground block">মোট খরচ</span>
                              <p className="font-bold text-lg text-green-600">৳{totalCost.toLocaleString("bn-BD")}</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            * এই খরচ স্বয়ংক্রিয়ভাবে ব্যয়ের তালিকায় যোগ হবে
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>নোট</Label>
                  <Input placeholder="অতিরিক্ত তথ্য লিখুন" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <Button3D className="mt-4 w-full" onClick={handleSubmit} variant="success">
                {editingPond ? "আপডেট করুন" : "সংরক্ষণ করুন"}
              </Button3D>
            </DialogContent>
          </Dialog>
        </div>

        {ponds.length === 0 ? (
          <Card className="shadow-elegant">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Waves className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">কোনো পুকুর যোগ করা হয়নি</p>
              <p className="text-muted-foreground text-sm">উপরের বাটনে ক্লিক করে নতুন পুকুর যোগ করুন</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ponds.map((pond) => {
              const statusInfo = getStatusInfo(pond.status);
              return (
                <Card key={pond.id} className="shadow-elegant hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Waves className="h-5 w-5 text-blue-500" />
                          {pond.name}
                        </CardTitle>
                        <Badge className={`mt-2 ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(pond)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(pond.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">আয়তন:</span>
                        <p className="font-medium">{pond.area} {pond.areaUnit}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">গভীরতা:</span>
                        <p className="font-medium">{pond.depth} {pond.depthUnit}</p>
                      </div>
                    </div>
                    {pond.fishCount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Fish className="h-4 w-4 text-primary" />
                          <span>{pond.fishCount.toLocaleString("bn-BD")} টি মাছ</span>
                        </div>
                        {pond.totalStockingCost && pond.totalStockingCost > 0 && (
                          <span className="text-green-600 font-medium">
                            ৳{pond.totalStockingCost.toLocaleString("bn-BD")}
                          </span>
                        )}
                      </div>
                    )}
                    {pond.fishStockEntries && pond.fishStockEntries.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pond.fishStockEntries.map((entry, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {entry.fishType}: {entry.quantity}টি
                          </Badge>
                        ))}
                      </div>
                    )}
                    {(!pond.fishStockEntries || pond.fishStockEntries.length === 0) && pond.fishTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pond.fishTypes.map((fish) => (
                          <Badge key={fish} variant="secondary" className="text-xs">
                            {fish}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {pond.stockingDate && (
                      <p className="text-xs text-muted-foreground">
                        মজুদের তারিখ: {pond.stockingDate}
                      </p>
                    )}
                    {pond.status === "active" && (
                      <div className="space-y-2 mt-2">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleOpenSellDialog(pond)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            বিক্রি
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-orange-600 border-orange-600 hover:bg-orange-50"
                            onClick={() => handleOpenExpenseDialog(pond)}
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            খরচ
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-purple-600 border-purple-600 hover:bg-purple-50"
                            onClick={() => handleOpenSamplingDialog(pond)}
                          >
                            <Scale className="h-4 w-4 mr-1" />
                            নমুনায়ন
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={() => handleViewSamplingHistory(pond)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            ইতিহাস
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Sell Fish Dialog */}
        <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                মাছ বিক্রি - {sellingPond?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>তারিখ</Label>
                <Input 
                  type="date" 
                  value={sellDate} 
                  onChange={(e) => setSellDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>মাছের প্রজাতি</Label>
                <Select value={sellFishType} onValueChange={setSellFishType}>
                  <SelectTrigger>
                    <SelectValue placeholder="প্রজাতি নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {(sellingPond?.fishTypes.length ? sellingPond.fishTypes : fishTypeOptions).map((fish) => (
                      <SelectItem key={fish} value={fish}>{fish}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ওজন (কেজি) *</Label>
                  <Input 
                    type="number" 
                    placeholder="০" 
                    value={sellWeight} 
                    onChange={(e) => setSellWeight(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>দাম/কেজি (৳) *</Label>
                  <Input 
                    type="number" 
                    placeholder="০" 
                    value={sellPricePerKg} 
                    onChange={(e) => setSellPricePerKg(e.target.value)} 
                  />
                </div>
              </div>
              {sellWeight && sellPricePerKg && (
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">মোট আয়</p>
                  <p className="text-2xl font-bold text-green-600">
                    ৳{(parseFloat(sellWeight) * parseFloat(sellPricePerKg)).toLocaleString("bn-BD")}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>ক্রেতার নাম (ঐচ্ছিক)</Label>
                <Input 
                  placeholder="ক্রেতার নাম লিখুন" 
                  value={sellBuyer} 
                  onChange={(e) => setSellBuyer(e.target.value)} 
                />
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSellFish}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                বিক্রি রেকর্ড করুন
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Expense Dialog */}
        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-orange-600" />
                খরচ যোগ করুন - {expensePond?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>তারিখ</Label>
                <Input 
                  type="date" 
                  value={expenseDate} 
                  onChange={(e) => setExpenseDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>খরচের ধরন</Label>
                <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="ধরন নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>পরিমাণ (৳) *</Label>
                <Input 
                  type="number" 
                  placeholder="০" 
                  value={expenseAmount} 
                  onChange={(e) => setExpenseAmount(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>বিবরণ (ঐচ্ছিক)</Label>
                <Input 
                  placeholder="বিস্তারিত লিখুন" 
                  value={expenseDescription} 
                  onChange={(e) => setExpenseDescription(e.target.value)} 
                />
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={handleAddExpense}>
                <Receipt className="h-4 w-4 mr-2" />
                খরচ রেকর্ড করুন
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sampling Dialog */}
        <Dialog open={isSamplingDialogOpen} onOpenChange={setIsSamplingDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-purple-600" />
                নমুনায়ন - {samplingPond?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>তারিখ</Label>
                  <Input 
                    type="date" 
                    value={samplingDate} 
                    onChange={(e) => setSamplingDate(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>পুকুরে মোট মাছ</Label>
                  <Input 
                    type="text" 
                    value={`${samplingPond?.fishCount?.toLocaleString("bn-BD") || "০"} টি`}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>নমুনা তথ্য (মাছের প্রজাতি অনুযায়ী)</Label>
                {samplingFishEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Select 
                        value={entry.fishType} 
                        onValueChange={(val) => updateSamplingEntry(index, "fishType", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="মাছ" />
                        </SelectTrigger>
                        <SelectContent>
                          {fishTypeOptions.map((fish) => (
                            <SelectItem key={fish} value={fish}>{fish}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input 
                        type="number" 
                        placeholder="সংখ্যা"
                        value={entry.sampleCount || ""}
                        onChange={(e) => updateSamplingEntry(index, "sampleCount", e.target.value)}
                      />
                    </div>
                    <div className="col-span-4">
                      <Input 
                        type="number" 
                        placeholder="ওজন (গ্রাম)"
                        value={entry.sampleWeight || ""}
                        onChange={(e) => updateSamplingEntry(index, "sampleWeight", e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeSamplingEntry(index)}
                        disabled={samplingFishEntries.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addSamplingEntry}>
                  <Plus className="h-4 w-4 mr-1" />
                  আরো যোগ করুন
                </Button>
              </div>

              {/* Auto calculated summary */}
              {(() => {
                const { totalSampleFish, totalSampleWeight, avgWeight, totalFish, estimatedTotalWeight } = calculateSamplingTotals();
                return (
                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold text-purple-700 dark:text-purple-300">গণনা ফলাফল</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">নমুনা মাছ:</span>
                        <p className="font-medium">{totalSampleFish.toLocaleString("bn-BD")} টি</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">নমুনা ওজন:</span>
                        <p className="font-medium">{totalSampleWeight.toLocaleString("bn-BD")} গ্রাম</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">গড় ওজন/মাছ:</span>
                        <p className="font-medium text-purple-600">{avgWeight.toFixed(2)} গ্রাম</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">আনুমানিক মোট ওজন:</span>
                        <p className="font-bold text-lg text-purple-600">
                          {(estimatedTotalWeight / 1000).toFixed(2)} কেজি
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <Label>নোট (ঐচ্ছিক)</Label>
                <Input 
                  placeholder="অতিরিক্ত তথ্য লিখুন" 
                  value={samplingNotes} 
                  onChange={(e) => setSamplingNotes(e.target.value)} 
                />
              </div>

              <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleSaveSampling}>
                <Scale className="h-4 w-4 mr-2" />
                সংরক্ষণ করুন
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Sampling History Dialog */}
        <Dialog open={isViewSamplingOpen} onOpenChange={setIsViewSamplingOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                নমুনায়ন ইতিহাস - {viewSamplingPond?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {viewSamplingPond && getPondSamplings(viewSamplingPond.id).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Scale className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>এই পুকুরে কোনো নমুনায়ন রেকর্ড নেই</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>নমুনা</TableHead>
                      <TableHead>গড় ওজন</TableHead>
                      <TableHead>মোট মাছ</TableHead>
                      <TableHead>আনুমানিক ওজন</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewSamplingPond && getPondSamplings(viewSamplingPond.id).map((sampling) => (
                      <TableRow key={sampling.id}>
                        <TableCell>{sampling.date}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {sampling.fishEntries.map((entry, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {entry.fishType}: {entry.sampleCount}টি
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{sampling.avgWeight.toFixed(1)} গ্রাম</TableCell>
                        <TableCell>{sampling.totalFish.toLocaleString("bn-BD")} টি</TableCell>
                        <TableCell className="font-semibold text-purple-600">
                          {(sampling.totalWeight / 1000).toFixed(2)} কেজি
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteSampling(sampling.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
