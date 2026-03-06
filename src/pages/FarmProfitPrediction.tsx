import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calculator, TrendingUp, DollarSign, Fish, Save, FileText, History, Trash2 } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const FISH_SPECIES = [
  "রুই (Rohu)", "কাতলা (Catla)", "মৃগেল (Mrigal)", "পাঙ্গাস (Pangasius)",
  "তেলাপিয়া (Tilapia)", "কই (Koi)", "শিং (Shing)", "মাগুর (Magur)",
  "পাবদা (Pabda)", "গুলশা (Gulsha)", "শোল (Shol)", "বোয়াল (Boal)",
  "সিলভার কার্প (Silver Carp)", "গ্রাস কার্প (Grass Carp)", "মিরর কার্প (Mirror Carp)",
];

const FEED_TYPES = [
  "ভাসমান খাবার (Floating Feed)", "ডুবন্ত খাবার (Sinking Feed)",
  "হ্যান্ডমেড খাবার (Handmade Feed)", "মিক্সড খাবার (Mixed Feed)",
];

const CHART_COLORS = [
  "hsl(var(--primary))", "hsl(var(--destructive))", "hsl(210, 70%, 50%)",
  "hsl(45, 80%, 50%)", "hsl(160, 60%, 45%)", "hsl(280, 60%, 55%)",
];

interface FormData {
  pond_name: string;
  pond_size: number;
  pond_size_unit: string;
  fish_species: string;
  stocking_density: number;
  fingerling_price: number;
  feed_type: string;
  feed_cost_per_kg: number;
  fcr: number;
  medicine_cost: number;
  labor_cost: number;
  electricity_cost: number;
  other_cost: number;
  culture_duration: number;
  survival_rate: number;
  avg_harvest_weight: number;
  market_price_per_kg: number;
}

const defaultForm: FormData = {
  pond_name: "",
  pond_size: 100,
  pond_size_unit: "decimal",
  fish_species: "",
  stocking_density: 40,
  fingerling_price: 5,
  feed_type: "",
  feed_cost_per_kg: 45,
  fcr: 1.5,
  medicine_cost: 5000,
  labor_cost: 10000,
  electricity_cost: 3000,
  other_cost: 2000,
  culture_duration: 6,
  survival_rate: 85,
  avg_harvest_weight: 0.8,
  market_price_per_kg: 200,
};

interface SavedPrediction {
  id: string;
  pond_name: string;
  fish_species: string;
  predicted_profit: number;
  roi: number;
  created_at: string;
}

export default function FarmProfitPrediction() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isBn = language === "bn";
  const [form, setForm] = useState<FormData>(defaultForm);
  const [savedPredictions, setSavedPredictions] = useState<SavedPrediction[]>([]);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) fetchSavedPredictions();
  }, [user]);

  const fetchSavedPredictions = async () => {
    const { data } = await supabase
      .from("farm_predictions")
      .select("id, pond_name, fish_species, predicted_profit, roi, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setSavedPredictions(data);
  };

  const updateField = (field: keyof FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Convert pond size to decimal for calculations
  const pondSizeInDecimal = useMemo(() => {
    switch (form.pond_size_unit) {
      case "acre": return form.pond_size * 100;
      case "sqm": return form.pond_size / 40.46;
      default: return form.pond_size;
    }
  }, [form.pond_size, form.pond_size_unit]);

  // ===== CALCULATIONS =====
  const calc = useMemo(() => {
    const totalFishStocked = Math.round(pondSizeInDecimal * form.stocking_density);
    const survivingFish = Math.round(totalFishStocked * (form.survival_rate / 100));
    const totalHarvestBiomass = survivingFish * form.avg_harvest_weight;
    const totalFeedRequired = totalHarvestBiomass * form.fcr;

    const fingerlingCost = totalFishStocked * form.fingerling_price;
    const feedCost = totalFeedRequired * form.feed_cost_per_kg;
    const medicineCost = form.medicine_cost;
    const laborCost = form.labor_cost;
    const electricityCost = form.electricity_cost;
    const otherCost = form.other_cost;
    const totalCost = fingerlingCost + feedCost + medicineCost + laborCost + electricityCost + otherCost;

    const revenue = totalHarvestBiomass * form.market_price_per_kg;
    const profit = revenue - totalCost;
    const profitPerKg = totalHarvestBiomass > 0 ? profit / totalHarvestBiomass : 0;
    const profitPerPond = profit;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return {
      totalFishStocked, survivingFish, totalHarvestBiomass, totalFeedRequired,
      fingerlingCost, feedCost, medicineCost, laborCost, electricityCost, otherCost,
      totalCost, revenue, profit, profitPerKg, profitPerPond, roi,
    };
  }, [form, pondSizeInDecimal]);

  const costBreakdown = useMemo(() => [
    { name: isBn ? "পোনা" : "Fingerling", value: calc.fingerlingCost },
    { name: isBn ? "খাবার" : "Feed", value: calc.feedCost },
    { name: isBn ? "ওষুধ" : "Medicine", value: calc.medicineCost },
    { name: isBn ? "শ্রমিক" : "Labor", value: calc.laborCost },
    { name: isBn ? "বিদ্যুৎ" : "Electricity", value: calc.electricityCost },
    { name: isBn ? "অন্যান্য" : "Others", value: calc.otherCost },
  ], [calc, isBn]);

  const revenueVsCost = useMemo(() => [
    { name: isBn ? "মোট খরচ" : "Total Cost", value: calc.totalCost },
    { name: isBn ? "আয়" : "Revenue", value: calc.revenue },
    { name: isBn ? "লাভ" : "Profit", value: Math.max(0, calc.profit) },
  ], [calc, isBn]);

  const formatNum = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  const handleSave = async () => {
    if (!user) { toast.error(isBn ? "লগইন করুন" : "Please login"); return; }
    setSaving(true);
    const { error } = await supabase.from("farm_predictions").insert({
      user_id: user.id,
      pond_name: form.pond_name || (isBn ? "নামহীন পুকুর" : "Unnamed Pond"),
      fish_species: form.fish_species,
      pond_size: form.pond_size,
      pond_size_unit: form.pond_size_unit,
      stocking_density: form.stocking_density,
      fingerling_price: form.fingerling_price,
      feed_type: form.feed_type,
      feed_cost_per_kg: form.feed_cost_per_kg,
      fcr: form.fcr,
      medicine_cost: form.medicine_cost,
      labor_cost: form.labor_cost,
      electricity_cost: form.electricity_cost,
      other_cost: form.other_cost,
      culture_duration: form.culture_duration,
      survival_rate: form.survival_rate,
      avg_harvest_weight: form.avg_harvest_weight,
      market_price_per_kg: form.market_price_per_kg,
      total_fish_stocked: calc.totalFishStocked,
      total_harvest_biomass: calc.totalHarvestBiomass,
      total_fingerling_cost: calc.fingerlingCost,
      total_feed_cost: calc.feedCost,
      total_farming_cost: calc.totalCost,
      predicted_revenue: calc.revenue,
      predicted_profit: calc.profit,
      roi: calc.roi,
    });
    setSaving(false);
    if (error) { toast.error(isBn ? "সংরক্ষণ ব্যর্থ" : "Save failed"); console.error(error); }
    else { toast.success(isBn ? "রিপোর্ট সংরক্ষিত" : "Report saved"); fetchSavedPredictions(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("farm_predictions").delete().eq("id", id);
    toast.success(isBn ? "মুছে ফেলা হয়েছে" : "Deleted");
    fetchSavedPredictions();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Farm Profit Prediction Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Pond: ${form.pond_name || "N/A"} | Species: ${form.fish_species || "N/A"}`, 14, 30);
    doc.text(`Date: ${format(new Date(), "dd MMM yyyy")}`, 14, 37);

    autoTable(doc, {
      startY: 45,
      head: [["Parameter", "Value"]],
      body: [
        ["Pond Size", `${form.pond_size} ${form.pond_size_unit}`],
        ["Fish Stocked", `${calc.totalFishStocked}`],
        ["Survival Rate", `${form.survival_rate}%`],
        ["Harvest Biomass", `${formatNum(calc.totalHarvestBiomass)} kg`],
        ["Total Cost", `৳${formatNum(calc.totalCost)}`],
        ["Revenue", `৳${formatNum(calc.revenue)}`],
        ["Net Profit", `৳${formatNum(calc.profit)}`],
        ["ROI", `${formatNum(calc.roi)}%`],
        ["Profit/Kg", `৳${formatNum(calc.profitPerKg)}`],
      ],
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Cost Category", "Amount (৳)"]],
      body: costBreakdown.map((c) => [c.name, formatNum(c.value)]),
    });

    doc.save(`farm_prediction_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success(isBn ? "PDF ডাউনলোড হয়েছে" : "PDF downloaded");
  };

  // ===== INPUT FIELD HELPER =====
  const InputField = ({ label, labelBn, field, type = "number", unit, unitBn }: {
    label: string; labelBn: string; field: keyof FormData; type?: string; unit?: string; unitBn?: string;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{isBn ? labelBn : label}{unit && <span className="text-muted-foreground ml-1">({isBn ? unitBn || unit : unit})</span>}</Label>
      <Input
        type={type}
        value={form[field]}
        onChange={(e) => updateField(field, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="bg-background"
      />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Calculator className="h-7 w-7 text-primary" />
              {isBn ? "ফার্ম প্রফিট প্রেডিকশন" : "Farm Profit Prediction"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isBn ? "আপনার মাছ চাষের সম্ভাব্য লাভ-ক্ষতি হিসাব করুন" : "Estimate your potential fish farming profit"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4 mr-1" /> {isBn ? "ইতিহাস" : "History"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {isBn ? "সংরক্ষণ" : "Save"}
            </Button>
          </div>
        </div>

        {/* Saved History */}
        {showHistory && savedPredictions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{isBn ? "পূর্ববর্তী রিপোর্ট" : "Previous Reports"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedPredictions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{p.pond_name} - {p.fish_species}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(p.created_at), "dd MMM yyyy")} | {isBn ? "লাভ" : "Profit"}: ৳{formatNum(p.predicted_profit)} | ROI: {formatNum(p.roi)}%
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== INPUT SECTION ===== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Fish className="h-5 w-5 text-primary" />
                  {isBn ? "পুকুর ও মাছের তথ্য" : "Pond & Fish Info"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Pond Name" labelBn="পুকুরের নাম" field="pond_name" type="text" />
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{isBn ? "পুকুরের আয়তন" : "Pond Size"}</Label>
                  <div className="flex gap-2">
                    <Input type="number" value={form.pond_size} onChange={(e) => updateField("pond_size", parseFloat(e.target.value) || 0)} className="bg-background flex-1" />
                    <Select value={form.pond_size_unit} onValueChange={(v) => updateField("pond_size_unit", v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="decimal">{isBn ? "শতক" : "Decimal"}</SelectItem>
                        <SelectItem value="acre">{isBn ? "একর" : "Acre"}</SelectItem>
                        <SelectItem value="sqm">{isBn ? "বর্গমিটার" : "Sq.m"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{isBn ? "মাছের প্রজাতি" : "Fish Species"}</Label>
                  <Select value={form.fish_species} onValueChange={(v) => updateField("fish_species", v)}>
                    <SelectTrigger><SelectValue placeholder={isBn ? "প্রজাতি নির্বাচন" : "Select species"} /></SelectTrigger>
                    <SelectContent>
                      {FISH_SPECIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <InputField label="Stocking Density" labelBn="মজুদ ঘনত্ব" field="stocking_density" unit="fish/decimal" unitBn="মাছ/শতক" />
                <InputField label="Fingerling Price" labelBn="পোনার দাম" field="fingerling_price" unit="৳/pc" />
                <InputField label="Culture Duration" labelBn="চাষের সময়কাল" field="culture_duration" unit="months" unitBn="মাস" />
              </CardContent>
            </Card>

            {/* Feed & Cost */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  {isBn ? "খরচের তথ্য" : "Cost Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{isBn ? "খাবারের ধরন" : "Feed Type"}</Label>
                  <Select value={form.feed_type} onValueChange={(v) => updateField("feed_type", v)}>
                    <SelectTrigger><SelectValue placeholder={isBn ? "খাবার নির্বাচন" : "Select feed"} /></SelectTrigger>
                    <SelectContent>
                      {FEED_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <InputField label="Feed Cost" labelBn="খাবারের দাম" field="feed_cost_per_kg" unit="৳/kg" />
                <InputField label="FCR" labelBn="এফসিআর" field="fcr" />
                <InputField label="Medicine Cost" labelBn="ওষুধের খরচ" field="medicine_cost" unit="৳" />
                <InputField label="Labor Cost" labelBn="শ্রমিক খরচ" field="labor_cost" unit="৳" />
                <InputField label="Electricity Cost" labelBn="বিদ্যুৎ খরচ" field="electricity_cost" unit="৳" />
                <InputField label="Other Expenses" labelBn="অন্যান্য খরচ" field="other_cost" unit="৳" />
              </CardContent>
            </Card>

            {/* Harvest & Revenue */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {isBn ? "উৎপাদন ও আয়" : "Production & Revenue"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Survival Rate" labelBn="বেঁচে থাকার হার" field="survival_rate" unit="%" />
                <InputField label="Avg Harvest Weight" labelBn="গড় ওজন" field="avg_harvest_weight" unit="kg" unitBn="কেজি" />
                <InputField label="Market Price" labelBn="বাজার দর" field="market_price_per_kg" unit="৳/kg" unitBn="৳/কেজি" />
              </CardContent>
            </Card>
          </div>

          {/* ===== RESULTS SECTION ===== */}
          <div className="space-y-6">
            {/* Production Summary */}
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{isBn ? "উৎপাদন সারাংশ" : "Production Summary"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ResultRow label={isBn ? "মোট মজুদ" : "Total Stocked"} value={`${formatNum(calc.totalFishStocked)} ${isBn ? "টি" : "pcs"}`} />
                <ResultRow label={isBn ? "বেঁচে থাকবে" : "Surviving Fish"} value={`${formatNum(calc.survivingFish)} ${isBn ? "টি" : "pcs"}`} />
                <ResultRow label={isBn ? "মোট উৎপাদন" : "Total Biomass"} value={`${formatNum(calc.totalHarvestBiomass)} ${isBn ? "কেজি" : "kg"}`} />
                <ResultRow label={isBn ? "প্রয়োজনীয় খাবার" : "Feed Required"} value={`${formatNum(calc.totalFeedRequired)} ${isBn ? "কেজি" : "kg"}`} />
              </CardContent>
            </Card>

            {/* Cost Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{isBn ? "খরচের বিবরণ" : "Cost Breakdown"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ResultRow label={isBn ? "পোনা" : "Fingerling"} value={`৳${formatNum(calc.fingerlingCost)}`} />
                <ResultRow label={isBn ? "খাবার" : "Feed"} value={`৳${formatNum(calc.feedCost)}`} />
                <ResultRow label={isBn ? "ওষুধ" : "Medicine"} value={`৳${formatNum(calc.medicineCost)}`} />
                <ResultRow label={isBn ? "শ্রমিক" : "Labor"} value={`৳${formatNum(calc.laborCost)}`} />
                <ResultRow label={isBn ? "বিদ্যুৎ" : "Electricity"} value={`৳${formatNum(calc.electricityCost)}`} />
                <ResultRow label={isBn ? "অন্যান্য" : "Others"} value={`৳${formatNum(calc.otherCost)}`} />
                <Separator />
                <ResultRow label={isBn ? "মোট খরচ" : "Total Cost"} value={`৳${formatNum(calc.totalCost)}`} bold />
              </CardContent>
            </Card>

            {/* Profit Card */}
            <Card className={calc.profit >= 0 ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{isBn ? "লাভ-ক্ষতি বিশ্লেষণ" : "Profit Analysis"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ResultRow label={isBn ? "মোট আয়" : "Revenue"} value={`৳${formatNum(calc.revenue)}`} />
                <ResultRow label={isBn ? "নিট লাভ" : "Net Profit"} value={`৳${formatNum(calc.profit)}`} bold color={calc.profit >= 0 ? "text-green-600" : "text-destructive"} />
                <ResultRow label={isBn ? "কেজি প্রতি লাভ" : "Profit/Kg"} value={`৳${formatNum(calc.profitPerKg)}`} />
                <ResultRow label="ROI" value={`${formatNum(calc.roi)}%`} bold color={calc.roi >= 0 ? "text-green-600" : "text-destructive"} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ===== CHARTS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{isBn ? "খরচের বিভাজন" : "Cost Breakdown"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={costBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {costBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `৳${formatNum(v)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{isBn ? "আয় বনাম খরচ" : "Revenue vs Cost"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueVsCost}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(v: number) => `৳${formatNum(v)}`} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {revenueVsCost.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "hsl(var(--destructive))" : i === 1 ? "hsl(var(--primary))" : "hsl(142, 71%, 45%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ResultRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : "font-medium"} ${color || "text-foreground"}`}>{value}</span>
    </div>
  );
}
