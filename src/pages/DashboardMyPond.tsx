import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api-client";
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
  weightPerFish: number;
  pricePerPiece: number;
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
    const res = await apiClient.getPonds(String(user.id));
    const data = res.data?.data || [];
    setPonds(data.map((p: any) => ({
      id: String(p.id), name: p.name, area: Number(p.area), areaUnit: p.area_unit, depth: Number(p.depth), depthUnit: p.depth_unit,
      fishTypes: p.fish_types || [], fishCount: p.fish_count || 0, stockingDate: p.stocking_date || "",
      status: p.status, notes: p.notes || "",
      fishStockEntries: p.fish_stock_entries || [], totalStockingCost: Number(p.total_stocking_cost) || 0,
    })));
  }, [user]);

  const fetchSamplings = useCallback(async () => {
    if (!user) return;
    const res = await apiClient.getSamplings(String(user.id));
    const data = res.data?.data || [];
    setSamplingRecords(data.map((s: any) => ({
      id: String(s.id), pondId: s.pond_id ? String(s.pond_id) : "", pondName: s.pond_name, date: s.date,
      fishEntries: s.fish_entries || [], totalFish: s.total_fish || 0,
      totalWeight: Number(s.total_weight) || 0, avgWeight: Number(s.avg_weight) || 0, notes: s.notes || "",
    })));
  }, [user]);

  useEffect(() => { fetchPonds(); fetchSamplings(); }, [fetchPonds, fetchSamplings]);

  const resetForm = () => {
    setName(""); setArea(""); setAreaUnit("শতক"); setDepth(""); setDepthUnit("ফুট");
    setFishTypes([]); setFishCount(""); setStockingDate(""); setStatus("active"); setNotes("");
    setEditingPond(null);
    setFishStockEntries([{ fishType: "", quantity: 0, weightPerFish: 0, pricePerPiece: 0 }]);
  };

  const updateFishStockEntry = (index: number, field: keyof FishStockEntry, value: string | number) => {
    const newEntries = [...fishStockEntries];
    if (field === "fishType") { newEntries[index].fishType = value as string; }
    else { newEntries[index][field] = parseFloat(value as string) || 0; }
    setFishStockEntries(newEntries);
  };

  const addFishStockEntry = () => {
    setFishStockEntries([...fishStockEntries, { fishType: "", quantity: 0, weightPerFish: 0, pricePerPiece: 0 }]);
  };

  const removeFishStockEntry = (index: number) => {
    if (fishStockEntries.length > 1) setFishStockEntries(fishStockEntries.filter((_, i) => i !== index));
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
      const res = await apiClient.updatePond(editingPond.id, pondPayload);
      if (res.error) { toast.error("আপডেটে সমস্যা"); return; }
      toast.success("পুকুর আপডেট করা হয়েছে");
    } else {
      const res = await apiClient.createPond(pondPayload);
      if (res.error) { toast.error("সংরক্ষণে সমস্যা"); return; }
      toast.success("পুকুর যোগ করা হয়েছে");
    }

    // Auto-create expense record for fish stocking cost (only for new ponds)
    if (isNewPond && totalCost > 0 && stockingDate) {
      await apiClient.createExpense({
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
    setName(pond.name); setArea(pond.area.toString()); setAreaUnit(pond.areaUnit);
    setDepth(pond.depth.toString()); setDepthUnit(pond.depthUnit); setFishTypes(pond.fishTypes);
    setFishCount(pond.fishCount.toString()); setStockingDate(pond.stockingDate);
    setStatus(pond.status); setNotes(pond.notes);
    if (pond.fishStockEntries && pond.fishStockEntries.length > 0) {
      setFishStockEntries(pond.fishStockEntries);
    } else {
      setFishStockEntries([{ fishType: "", quantity: 0, weightPerFish: 0, pricePerPiece: 0 }]);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("আপনি কি এই পুকুরটি মুছে ফেলতে চান?")) {
      await apiClient.deletePond(id);
      fetchPonds();
      toast.success("পুকুর মুছে ফেলা হয়েছে");
    }
  };

  const toggleFishType = (fish: string) => {
    if (fishTypes.includes(fish)) setFishTypes(fishTypes.filter((f) => f !== fish));
    else setFishTypes([...fishTypes, fish]);
  };

  const getStatusInfo = (statusValue: string) => {
    return statusOptions.find((s) => s.value === statusValue) || statusOptions[0];
  };

  const handleOpenSellDialog = (pond: PondRecord) => {
    setSellingPond(pond); setSellFishType(pond.fishTypes[0] || "");
    setSellWeight(""); setSellPricePerKg("");
    setSellDate(new Date().toISOString().split("T")[0]); setSellBuyer("");
    setIsSellDialogOpen(true);
  };

  const handleSellFish = async () => {
    if (!user || !sellingPond || !sellWeight || !sellPricePerKg) {
      toast.error("ওজন এবং দাম দিন"); return;
    }
    const weight = parseFloat(sellWeight);
    const pricePerKg = parseFloat(sellPricePerKg);
    const totalAmount = weight * pricePerKg;

    await apiClient.createIncome({
      user_id: user.id, date: sellDate, category: "মাছ বিক্রয়", amount: totalAmount,
      description: sellBuyer ? `ক্রেতা: ${sellBuyer}` : `${sellFishType} - ${weight} কেজি @ ৳${pricePerKg}/কেজি`,
      pond_name: sellingPond.name, fish_type: sellFishType, fish_weight: weight, fish_price: pricePerKg,
    });

    toast.success(`৳${totalAmount.toLocaleString("bn-BD")} আয় রেকর্ড করা হয়েছে`);
    setIsSellDialogOpen(false); setSellingPond(null);
  };

  const handleOpenExpenseDialog = (pond: PondRecord) => {
    setExpensePond(pond); setExpenseCategory("খাবার"); setExpenseAmount("");
    setExpenseDate(new Date().toISOString().split("T")[0]); setExpenseDescription("");
    setIsExpenseDialogOpen(true);
  };

  const handleAddExpense = async () => {
    if (!user || !expensePond || !expenseAmount) {
      toast.error("খরচের পরিমাণ দিন"); return;
    }
    const amount = parseFloat(expenseAmount);
    await apiClient.createExpense({
      user_id: user.id, date: expenseDate, category: expenseCategory, amount,
      description: expenseDescription || `${expensePond.name} - ${expenseCategory}`,
      pond_name: expensePond.name,
    });
    toast.success(`৳${amount.toLocaleString("bn-BD")} খরচ রেকর্ড করা হয়েছে`);
    setIsExpenseDialogOpen(false); setExpensePond(null);
  };

  // Sampling functions
  const handleOpenSamplingDialog = (pond: PondRecord) => {
    setSamplingPond(pond); setSamplingDate(new Date().toISOString().split("T")[0]); setSamplingNotes("");
    const initialEntries: SamplingFishEntry[] = pond.fishTypes.map(fish => ({ fishType: fish, sampleCount: 0, sampleWeight: 0 }));
    setSamplingFishEntries(initialEntries.length > 0 ? initialEntries : [{ fishType: "", sampleCount: 0, sampleWeight: 0 }]);
    setIsSamplingDialogOpen(true);
  };

  const updateSamplingEntry = (index: number, field: keyof SamplingFishEntry, value: string | number) => {
    const newEntries = [...samplingFishEntries];
    if (field === "fishType") { newEntries[index].fishType = value as string; }
    else { newEntries[index][field] = parseFloat(value as string) || 0; }
    setSamplingFishEntries(newEntries);
  };

  const addSamplingEntry = () => {
    setSamplingFishEntries([...samplingFishEntries, { fishType: "", sampleCount: 0, sampleWeight: 0 }]);
  };

  const removeSamplingEntry = (index: number) => {
    if (samplingFishEntries.length > 1) setSamplingFishEntries(samplingFishEntries.filter((_, i) => i !== index));
  };

  const calculateSamplingTotals = () => {
    const totalSampleFish = samplingFishEntries.reduce((sum, e) => sum + e.sampleCount, 0);
    const totalSampleWeight = samplingFishEntries.reduce((sum, e) => sum + e.sampleWeight, 0);
    const avgWeight = totalSampleFish > 0 ? totalSampleWeight / totalSampleFish : 0;
    const totalFish = samplingPond?.fishCount || 0;
    const estimatedTotalWeight = avgWeight * totalFish;
    return { totalSampleFish, totalSampleWeight, avgWeight, totalFish, estimatedTotalWeight };
  };

  const handleSaveSampling = async () => {
    if (!user || !samplingPond) return;
    const validEntries = samplingFishEntries.filter(e => e.fishType && e.sampleCount > 0);
    if (validEntries.length === 0) { toast.error("অন্তত একটি মাছের নমুনা তথ্য দিন"); return; }
    const { avgWeight, totalFish, estimatedTotalWeight } = calculateSamplingTotals();

    await apiClient.createSampling({
      user_id: user.id, pond_id: samplingPond.id, pond_name: samplingPond.name, date: samplingDate,
      fish_entries: JSON.parse(JSON.stringify(validEntries)),
      total_fish: totalFish, total_weight: estimatedTotalWeight, avg_weight: avgWeight, notes: samplingNotes,
    });

    toast.success("নমুনায়ন সংরক্ষণ করা হয়েছে");
    fetchSamplings();
    setIsSamplingDialogOpen(false); setSamplingPond(null);
  };

  const handleViewSamplingHistory = (pond: PondRecord) => {
    setViewSamplingPond(pond); setIsViewSamplingOpen(true);
  };

  const getPondSamplings = (pondId: string) => {
    return samplingRecords.filter(s => s.pondId === pondId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const deleteSampling = async (id: string) => {
    if (confirm("আপনি কি এই নমুনায়ন রেকর্ড মুছে ফেলতে চান?")) {
      await apiClient.deleteSampling(id);
      fetchSamplings();
      toast.success("নমুনায়ন রেকর্ড মুছে ফেলা হয়েছে");
    }
  };

  // The rest of the JSX remains exactly the same as before
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Waves className="h-6 w-6 text-blue-500" />
              আমার পুকুর
            </h1>
            <p className="text-muted-foreground">পুকুর পরিচালনা ও মনিটরিং</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button3D variant="primary" className="gap-2">
                <Plus className="h-4 w-4" />
                নতুন পুকুর যোগ করুন
              </Button3D>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPond ? "পুকুর সম্পাদনা" : "নতুন পুকুর যোগ করুন"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>পুকুরের নাম *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="পুকুর ১" />
                  </div>
                  <div className="space-y-2">
                    <Label>স্ট্যাটাস</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>আয়তন *</Label>
                    <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="০" />
                  </div>
                  <div className="space-y-2">
                    <Label>একক</Label>
                    <Select value={areaUnit} onValueChange={setAreaUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="শতক">শতক</SelectItem>
                        <SelectItem value="একর">একর</SelectItem>
                        <SelectItem value="বিঘা">বিঘা</SelectItem>
                        <SelectItem value="হেক্টর">হেক্টর</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>গভীরতা *</Label>
                    <Input type="number" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="০" />
                  </div>
                  <div className="space-y-2">
                    <Label>একক</Label>
                    <Select value={depthUnit} onValueChange={setDepthUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ফুট">ফুট</SelectItem>
                        <SelectItem value="মিটার">মিটার</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fish Stock Entries */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Fish className="h-4 w-4" /> মাছের স্টক তথ্য
                    </Label>
                    <Button variant="outline" size="sm" onClick={addFishStockEntry}><Plus className="h-3 w-3 mr-1" /> যোগ করুন</Button>
                  </div>
                  {fishStockEntries.map((entry, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end p-3 rounded-lg bg-muted/50">
                      <div className="space-y-1">
                        <Label className="text-xs">মাছের ধরন</Label>
                        <Select value={entry.fishType} onValueChange={(v) => updateFishStockEntry(index, "fishType", v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                          <SelectContent>{fishTypeOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">সংখ্যা (টি)</Label>
                        <Input type="number" className="h-9" value={entry.quantity || ""} onChange={(e) => updateFishStockEntry(index, "quantity", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">ওজন/টি (গ্রাম)</Label>
                        <Input type="number" className="h-9" value={entry.weightPerFish || ""} onChange={(e) => updateFishStockEntry(index, "weightPerFish", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">দাম/টি (৳)</Label>
                        <Input type="number" className="h-9" value={entry.pricePerPiece || ""} onChange={(e) => updateFishStockEntry(index, "pricePerPiece", e.target.value)} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFishStockEntry(index)} className="h-9"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  {(() => {
                    const { totalFish, totalCost, totalWeight } = calculateStockTotals();
                    return totalFish > 0 ? (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm space-y-1">
                        <p>মোট পোনা: <strong>{totalFish.toLocaleString("bn-BD")} টি</strong></p>
                        <p>মোট ওজন: <strong>{(totalWeight / 1000).toFixed(2)} কেজি</strong></p>
                        <p>মোট খরচ: <strong>৳{totalCost.toLocaleString("bn-BD")}</strong></p>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="space-y-2">
                  <Label>মজুদের তারিখ</Label>
                  <Input type="date" value={stockingDate} onChange={(e) => setStockingDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>মাছের ধরন (ম্যানুয়াল)</Label>
                  <div className="flex flex-wrap gap-2">
                    {fishTypeOptions.map(fish => (
                      <Badge key={fish} variant={fishTypes.includes(fish) ? "default" : "outline"}
                        className="cursor-pointer" onClick={() => toggleFishType(fish)}>{fish}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>মোট মাছের সংখ্যা (ম্যানুয়াল)</Label>
                  <Input type="number" value={fishCount} onChange={(e) => setFishCount(e.target.value)} placeholder="০" />
                </div>
                <div className="space-y-2">
                  <Label>মন্তব্য</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="কোনো নোট..." />
                </div>
                <Button3D variant="primary" className="w-full" onClick={handleSubmit}>
                  {editingPond ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                </Button3D>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Ponds List */}
        {ponds.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Waves className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">কোনো পুকুর যোগ করা হয়নি</h3>
              <p className="text-muted-foreground mb-4">আপনার প্রথম পুকুর যোগ করুন</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ponds.map((pond) => {
              const statusInfo = getStatusInfo(pond.status);
              return (
                <Card key={pond.id} className="shadow-elegant">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Waves className="h-5 w-5 text-blue-500" />
                        {pond.name}
                      </CardTitle>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">আয়তন:</span> {pond.area} {pond.areaUnit}</div>
                      <div><span className="text-muted-foreground">গভীরতা:</span> {pond.depth} {pond.depthUnit}</div>
                      <div><span className="text-muted-foreground">মাছ:</span> {pond.fishCount.toLocaleString("bn-BD")} টি</div>
                      {pond.stockingDate && <div><span className="text-muted-foreground">মজুদ:</span> {pond.stockingDate}</div>}
                    </div>
                    {pond.fishTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pond.fishTypes.map(f => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}
                      </div>
                    )}
                    {pond.totalStockingCost && pond.totalStockingCost > 0 && (
                      <p className="text-xs text-muted-foreground">মজুদ খরচ: ৳{pond.totalStockingCost.toLocaleString("bn-BD")}</p>
                    )}
                    <div className="flex flex-wrap gap-1 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(pond)}><Edit className="h-3 w-3 mr-1" />সম্পাদনা</Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenSellDialog(pond)}><ShoppingCart className="h-3 w-3 mr-1" />বিক্রি</Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenExpenseDialog(pond)}><Receipt className="h-3 w-3 mr-1" />খরচ</Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenSamplingDialog(pond)}><Scale className="h-3 w-3 mr-1" />নমুনায়ন</Button>
                      <Button variant="outline" size="sm" onClick={() => handleViewSamplingHistory(pond)}><Eye className="h-3 w-3 mr-1" />ইতিহাস</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(pond.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Sell Fish Dialog */}
        <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>মাছ বিক্রয় - {sellingPond?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>মাছের ধরন</Label>
                <Select value={sellFishType} onValueChange={setSellFishType}>
                  <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
                  <SelectContent>{(sellingPond?.fishTypes || fishTypeOptions).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>ওজন (কেজি) *</Label><Input type="number" value={sellWeight} onChange={(e) => setSellWeight(e.target.value)} /></div>
                <div className="space-y-2"><Label>দাম/কেজি (৳) *</Label><Input type="number" value={sellPricePerKg} onChange={(e) => setSellPricePerKg(e.target.value)} /></div>
              </div>
              {sellWeight && sellPricePerKg && (
                <p className="text-lg font-bold text-green-600">মোট: ৳{(parseFloat(sellWeight) * parseFloat(sellPricePerKg)).toLocaleString("bn-BD")}</p>
              )}
              <div className="space-y-2"><Label>তারিখ</Label><Input type="date" value={sellDate} onChange={(e) => setSellDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>ক্রেতার নাম (ঐচ্ছিক)</Label><Input value={sellBuyer} onChange={(e) => setSellBuyer(e.target.value)} /></div>
              <Button3D variant="primary" className="w-full" onClick={handleSellFish}>বিক্রয় রেকর্ড করুন</Button3D>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Expense Dialog */}
        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>খরচ যোগ - {expensePond?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ক্যাটাগরি</Label>
                <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>পরিমাণ (৳) *</Label><Input type="number" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} /></div>
              <div className="space-y-2"><Label>তারিখ</Label><Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>বিবরণ (ঐচ্ছিক)</Label><Input value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} /></div>
              <Button3D variant="primary" className="w-full" onClick={handleAddExpense}>খরচ রেকর্ড করুন</Button3D>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sampling Dialog */}
        <Dialog open={isSamplingDialogOpen} onOpenChange={setIsSamplingDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>নমুনায়ন - {samplingPond?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>তারিখ</Label><Input type="date" value={samplingDate} onChange={(e) => setSamplingDate(e.target.value)} /></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">মাছের নমুনা</Label>
                  <Button variant="outline" size="sm" onClick={addSamplingEntry}><Plus className="h-3 w-3 mr-1" />যোগ</Button>
                </div>
                {samplingFishEntries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-end p-2 rounded bg-muted/50">
                    <div className="space-y-1">
                      <Label className="text-xs">মাছ</Label>
                      <Select value={entry.fishType} onValueChange={(v) => updateSamplingEntry(index, "fishType", v)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
                        <SelectContent>{fishTypeOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">সংখ্যা</Label><Input type="number" className="h-8" value={entry.sampleCount || ""} onChange={(e) => updateSamplingEntry(index, "sampleCount", e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">ওজন (গ্রাম)</Label><Input type="number" className="h-8" value={entry.sampleWeight || ""} onChange={(e) => updateSamplingEntry(index, "sampleWeight", e.target.value)} /></div>
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => removeSamplingEntry(index)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                {(() => {
                  const { totalSampleFish, totalSampleWeight, avgWeight, estimatedTotalWeight } = calculateSamplingTotals();
                  return totalSampleFish > 0 ? (
                    <div className="p-3 rounded bg-blue-50 dark:bg-blue-950/20 text-sm space-y-1">
                      <p>নমুনা মাছ: <strong>{totalSampleFish} টি</strong> | নমুনা ওজন: <strong>{totalSampleWeight.toFixed(0)} গ্রাম</strong></p>
                      <p>গড় ওজন: <strong>{avgWeight.toFixed(1)} গ্রাম/টি</strong></p>
                      <p>আনুমানিক মোট ওজন: <strong>{(estimatedTotalWeight / 1000).toFixed(2)} কেজি</strong></p>
                    </div>
                  ) : null;
                })()}
              </div>
              <div className="space-y-2"><Label>মন্তব্য</Label><Input value={samplingNotes} onChange={(e) => setSamplingNotes(e.target.value)} /></div>
              <Button3D variant="primary" className="w-full" onClick={handleSaveSampling}>সংরক্ষণ করুন</Button3D>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Sampling History Dialog */}
        <Dialog open={isViewSamplingOpen} onOpenChange={setIsViewSamplingOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>নমুনায়ন ইতিহাস - {viewSamplingPond?.name}</DialogTitle></DialogHeader>
            {viewSamplingPond && (() => {
              const pondSamplings = getPondSamplings(viewSamplingPond.id);
              return pondSamplings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">কোনো নমুনায়ন রেকর্ড নেই</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>মাছের ধরন</TableHead>
                      <TableHead>গড় ওজন</TableHead>
                      <TableHead>আনুমানিক ওজন</TableHead>
                      <TableHead>মন্তব্য</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pondSamplings.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.date}</TableCell>
                        <TableCell>{s.fishEntries.map(e => e.fishType).join(", ")}</TableCell>
                        <TableCell>{s.avgWeight.toFixed(1)} গ্রাম</TableCell>
                        <TableCell>{(s.totalWeight / 1000).toFixed(2)} কেজি</TableCell>
                        <TableCell className="text-xs">{s.notes}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => deleteSampling(s.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
