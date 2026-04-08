import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { DashboardLayout } from "@/components/DashboardLayout";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wheat, RotateCcw, Download, Save, Share2, TrendingUp, DollarSign, Scale, Fish, Package } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdUnit from "@/components/AdUnit";
import RecommendedProductsSlider from "@/components/RecommendedProductsSlider";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { registerBanglaFont, setBanglaFont } from "@/lib/pdfBanglaFont";
import { FISH_SPECIES_OPTIONS } from "@/data/fishSpeciesOptions";

interface FormData {
  fishSpecies: string;
  pondSize: string;
  pondSizeUnit: string;
  fishCount: string;
  avgWeight: string;
  weightUnit: string;
  feedType: string;
  feedPrice: string;
  fcr: string;
  cultureDuration: string;
}

interface CalcResult {
  biomass: number;
  feedRate: number;
  dailyFeed: number;
  weeklyFeed: number;
  monthlyFeed: number;
  dailyCost: number;
  weeklyCost: number;
  monthlyCost: number;
  totalFeed: number;
  totalCost: number;
  feedStage: string;
}

const fishSpeciesOptions = FISH_SPECIES_OPTIONS.map(f => ({
  value: f.key, label: f.label,
  feedRec: ["shing", "magur", "thai_magur", "pabda", "gulsha", "tengra", "boal", "ayre"].includes(f.key)
    ? "উচ্চ প্রোটিন ডুবন্ত খাদ্য"
    : ["pangas", "thai_pangas", "mrigal"].includes(f.key)
      ? "ডুবন্ত খাদ্য"
      : "ভাসমান খাদ্য",
})).concat([{ value: "other", label: "অন্যান্য", feedRec: "ভাসমান খাদ্য" }]);

const feedTypes = [
  { value: "floating", label: "ভাসমান খাদ্য (Floating Feed)" },
  { value: "sinking", label: "ডুবন্ত খাদ্য (Sinking Feed)" },
  { value: "homemade", label: "ঘরে তৈরি খাদ্য (Homemade)" },
  { value: "high_protein", label: "উচ্চ প্রোটিন খাদ্য (High Protein)" },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

function getFeedRate(avgWeightGrams: number): { rate: number; stage: string } {
  if (avgWeightGrams < 50) return { rate: 5, stage: "পোনা (Fingerling)" };
  if (avgWeightGrams < 200) return { rate: 3, stage: "বাড়ন্ত (Growing)" };
  return { rate: 1.5, stage: "প্রাপ্তবয়স্ক (Adult)" };
}

export default function SmartFeedCalculator() {
  const { user } = useAuth();
  const [form, setForm] = useState<FormData>({
    fishSpecies: "", pondSize: "", pondSizeUnit: "decimal", fishCount: "",
    avgWeight: "", weightUnit: "gram", feedType: "", feedPrice: "", fcr: "1.5", cultureDuration: "6",
  });
  const [result, setResult] = useState<CalcResult | null>(null);
  const [saving, setSaving] = useState(false);

  const updateField = (key: keyof FormData, value: string) => setForm(p => ({ ...p, [key]: value }));

  const calculate = () => {
    const fishCount = parseFloat(form.fishCount);
    const avgWeight = parseFloat(form.avgWeight);
    const feedPrice = parseFloat(form.feedPrice);
    const fcr = parseFloat(form.fcr) || 1.5;
    const duration = parseInt(form.cultureDuration) || 6;

    if (!fishCount || !avgWeight || !feedPrice) {
      toast.error("সকল প্রয়োজনীয় তথ্য পূরণ করুন");
      return;
    }

    const weightInGrams = form.weightUnit === "kg" ? avgWeight * 1000 : avgWeight;
    const weightInKg = weightInGrams / 1000;
    const biomass = fishCount * weightInKg;
    const { rate, stage } = getFeedRate(weightInGrams);
    const dailyFeed = Math.round((biomass * rate / 100) * 100) / 100;
    const weeklyFeed = Math.round(dailyFeed * 7 * 100) / 100;
    const monthlyFeed = Math.round(dailyFeed * 30 * 100) / 100;
    const totalFeed = Math.round(dailyFeed * duration * 30 * 100) / 100;

    setResult({
      biomass: Math.round(biomass * 100) / 100,
      feedRate: rate,
      dailyFeed, weeklyFeed, monthlyFeed,
      dailyCost: Math.round(dailyFeed * feedPrice * 100) / 100,
      weeklyCost: Math.round(weeklyFeed * feedPrice * 100) / 100,
      monthlyCost: Math.round(monthlyFeed * feedPrice * 100) / 100,
      totalFeed,
      totalCost: Math.round(totalFeed * feedPrice * 100) / 100,
      feedStage: stage,
    });
  };

  const resetForm = () => {
    setForm({ fishSpecies: "", pondSize: "", pondSizeUnit: "decimal", fishCount: "", avgWeight: "", weightUnit: "gram", feedType: "", feedPrice: "", fcr: "1.5", cultureDuration: "6" });
    setResult(null);
    toast.success("ফর্ম রিসেট করা হয়েছে");
  };

  const savePlan = async () => {
    if (!user || !result) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("farm_predictions").insert({
        user_id: user.id,
        pond_name: `খাদ্য পরিকল্পনা - ${fishSpeciesOptions.find(f => f.value === form.fishSpecies)?.label || form.fishSpecies}`,
        fish_species: form.fishSpecies,
        pond_size: parseFloat(form.pondSize) || 0,
        pond_size_unit: form.pondSizeUnit,
        stocking_density: parseFloat(form.fishCount) || 0,
        feed_cost_per_kg: parseFloat(form.feedPrice) || 0,
        fcr: parseFloat(form.fcr) || 1.5,
        culture_duration: parseInt(form.cultureDuration) || 6,
        total_feed_cost: result.totalCost,
        total_farming_cost: result.totalCost,
        predicted_revenue: 0,
        predicted_profit: 0,
        roi: 0,
        avg_harvest_weight: (parseFloat(form.avgWeight) || 0) / (form.weightUnit === "gram" ? 1000 : 1),
        total_fish_stocked: parseInt(form.fishCount) || 0,
        total_harvest_biomass: result.biomass,
        fingerling_price: 0, total_fingerling_cost: 0,
        medicine_cost: 0, labor_cost: 0, electricity_cost: 0, other_cost: 0,
        market_price_per_kg: 0, survival_rate: 100, feed_type: form.feedType,
      });
      if (error) throw error;
      toast.success("খাদ্য পরিকল্পনা সংরক্ষিত হয়েছে!");
    } catch {
      toast.error("সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    registerBanglaFont(doc).then(() => {
      setBanglaFont(doc, true);
    });
    doc.setFontSize(18);
    doc.text("Smart Feed Calculator Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString("bn-BD")}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [["Item", "Value"]],
      body: [
        ["Fish Species", fishSpeciesOptions.find(f => f.value === form.fishSpecies)?.label || form.fishSpecies],
        ["Fish Count", form.fishCount],
        ["Avg Weight", `${form.avgWeight} ${form.weightUnit}`],
        ["Total Biomass", `${result.biomass} kg`],
        ["Feed Stage", result.feedStage],
        ["Feed Rate", `${result.feedRate}%`],
        ["Daily Feed", `${result.dailyFeed} kg`],
        ["Weekly Feed", `${result.weeklyFeed} kg`],
        ["Monthly Feed", `${result.monthlyFeed} kg`],
        ["Daily Cost", `৳${result.dailyCost}`],
        ["Monthly Cost", `৳${result.monthlyCost}`],
        ["Total Feed (${form.cultureDuration} months)", `${result.totalFeed} kg`],
        ["Total Cost", `৳${result.totalCost}`],
      ],
    });
    doc.save("smart-feed-plan.pdf");
    toast.success("PDF ডাউনলোড হয়েছে");
  };

  const sharePlan = () => {
    if (!result) return;
    const text = `🐟 স্মার্ট ফিড ক্যালকুলেটর\nমাছ: ${fishSpeciesOptions.find(f => f.value === form.fishSpecies)?.label || ""}\nদৈনিক খাদ্য: ${result.dailyFeed} কেজি\nদৈনিক খরচ: ৳${result.dailyCost}\nমাসিক খরচ: ৳${result.monthlyCost}`;
    if (navigator.share) {
      navigator.share({ title: "স্মার্ট ফিড পরিকল্পনা", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("তথ্য কপি হয়েছে!");
    }
  };

  const feedRecommendation = useMemo(() => {
    return fishSpeciesOptions.find(f => f.value === form.fishSpecies)?.feedRec || "";
  }, [form.fishSpecies]);

  // Chart data
  const costProjection = result ? Array.from({ length: parseInt(form.cultureDuration) || 6 }, (_, i) => ({
    name: `মাস ${i + 1}`, cost: Math.round(result.monthlyCost * (i + 1)), feed: Math.round(result.monthlyFeed * (i + 1)),
  })) : [];

  const feedBreakdown = result ? [
    { name: "দৈনিক", value: result.dailyFeed },
    { name: "সাপ্তাহিক", value: result.weeklyFeed },
    { name: "মাসিক", value: result.monthlyFeed },
  ] : [];


  const renderContent = () => (
    <>
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary p-3"><Wheat className="h-8 w-8 text-primary-foreground" /></div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">স্মার্ট ফিড ক্যালকুলেটর</h1>
            <p className="text-muted-foreground mt-1">দৈনিক খাদ্যের পরিমাণ ও খরচ সঠিকভাবে নির্ধারণ করুন</p>
          </div>
        </div>
      </div>

          {/* Input Form */}
          <Card className="shadow-elegant animate-slide-in mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Fish className="h-5 w-5" /> মাছ ও পুকুরের তথ্য</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>মাছের প্রজাতি</Label>
                  <Select value={form.fishSpecies} onValueChange={v => updateField("fishSpecies", v)}>
                    <SelectTrigger><SelectValue placeholder="প্রজাতি নির্বাচন করুন" /></SelectTrigger>
                    <SelectContent>{fishSpeciesOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>পুকুরের আয়তন</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="যেমন: 10" value={form.pondSize} onChange={e => updateField("pondSize", e.target.value)} />
                    <Select value={form.pondSizeUnit} onValueChange={v => updateField("pondSizeUnit", v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="decimal">শতক</SelectItem>
                        <SelectItem value="acre">একর</SelectItem>
                        <SelectItem value="sqm">বর্গমিটার</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>মাছের সংখ্যা</Label>
                  <Input type="number" placeholder="যেমন: 5000" value={form.fishCount} onChange={e => updateField("fishCount", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>গড় ওজন</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="যেমন: 100" value={form.avgWeight} onChange={e => updateField("avgWeight", e.target.value)} />
                    <Select value={form.weightUnit} onValueChange={v => updateField("weightUnit", v)}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gram">গ্রাম</SelectItem>
                        <SelectItem value="kg">কেজি</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>খাদ্যের ধরন</Label>
                  <Select value={form.feedType} onValueChange={v => updateField("feedType", v)}>
                    <SelectTrigger><SelectValue placeholder="খাদ্যের ধরন" /></SelectTrigger>
                    <SelectContent>{feedTypes.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>খাদ্যের মূল্য (৳/কেজি)</Label>
                  <Input type="number" placeholder="যেমন: 55" value={form.feedPrice} onChange={e => updateField("feedPrice", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>FCR (ফিড কনভার্শন রেশিও)</Label>
                  <Input type="number" step="0.1" placeholder="যেমন: 1.5" value={form.fcr} onChange={e => updateField("fcr", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>চাষের সময়কাল (মাস)</Label>
                  <Input type="number" placeholder="যেমন: 6" value={form.cultureDuration} onChange={e => updateField("cultureDuration", e.target.value)} />
                </div>
              </div>

              {feedRecommendation && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                  <strong>প্রস্তাবিত খাদ্য:</strong> {feedRecommendation}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={calculate} className="flex-1" size="lg"><Scale className="mr-2 h-4 w-4" /> খাদ্য হিসাব করুন</Button>
                <Button onClick={resetForm} variant="outline" size="lg"><RotateCcw className="mr-2 h-4 w-4" /> রিসেট</Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-6 animate-fade-in">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "মোট বায়োমাস", value: `${result.biomass} কেজি`, icon: Scale, color: "text-blue-500" },
                  { label: "দৈনিক খাদ্য", value: `${result.dailyFeed} কেজি`, icon: Package, color: "text-emerald-500" },
                  { label: "দৈনিক খরচ", value: `৳${result.dailyCost}`, icon: DollarSign, color: "text-amber-500" },
                  { label: "মোট খরচ", value: `৳${result.totalCost}`, icon: TrendingUp, color: "text-rose-500" },
                ].map((item, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 text-center">
                      <item.icon className={`h-6 w-6 mx-auto mb-2 ${item.color}`} />
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-xl font-bold">{item.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detailed Results */}
              <Card>
                <CardHeader><CardTitle>বিস্তারিত ফলাফল</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground">খাদ্যের পরিমাণ</h4>
                      {[
                        { label: "মাছের ধাপ", value: result.feedStage },
                        { label: "খাদ্য হার", value: `${result.feedRate}%` },
                        { label: "দৈনিক", value: `${result.dailyFeed} কেজি` },
                        { label: "সাপ্তাহিক", value: `${result.weeklyFeed} কেজি` },
                        { label: "মাসিক", value: `${result.monthlyFeed} কেজি` },
                        { label: `মোট (${form.cultureDuration} মাস)`, value: `${result.totalFeed} কেজি` },
                      ].map((r, i) => (
                        <div key={i} className="flex justify-between p-2 bg-muted/30 rounded">
                          <span className="text-sm">{r.label}</span>
                          <span className="font-semibold text-sm">{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground">খাদ্য খরচ</h4>
                      {[
                        { label: "দৈনিক খরচ", value: `৳${result.dailyCost}` },
                        { label: "সাপ্তাহিক খরচ", value: `৳${result.weeklyCost}` },
                        { label: "মাসিক খরচ", value: `৳${result.monthlyCost}` },
                        { label: `মোট খরচ (${form.cultureDuration} মাস)`, value: `৳${result.totalCost}` },
                      ].map((r, i) => (
                        <div key={i} className="flex justify-between p-2 bg-muted/30 rounded">
                          <span className="text-sm">{r.label}</span>
                          <span className="font-bold text-sm text-primary">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">খাদ্য ব্যবহার (কেজি)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={feedBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {feedBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">খরচ প্রজেকশন (৳)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={costProjection}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="cost" fill="hsl(var(--primary))" name="ক্রমবর্ধমান খরচ (৳)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Feed Usage Trend */}
              <Card>
                <CardHeader><CardTitle className="text-base">খাদ্য ব্যবহার ট্রেন্ড</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={costProjection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="feed" stroke="hsl(var(--chart-2))" name="ক্রমবর্ধমান খাদ্য (কেজি)" strokeWidth={2} />
                      <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" name="ক্রমবর্ধমান খরচ (৳)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader><CardTitle className="text-base">খাদ্য প্রয়োগের পরামর্শ</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>দিনে ২-৩ বার খাদ্য প্রদান করুন (সকাল, দুপুর, বিকাল)</li>
                    <li>গরমকালে খাদ্যের পরিমাণ বাড়ান, শীতকালে কমান</li>
                    <li>মেঘলা/বৃষ্টির দিনে খাদ্য কমিয়ে দিন</li>
                    <li>নিয়মিত স্যাম্পলিং করে মাছের ওজন পরীক্ষা করুন</li>
                    <li>FCR ১.৫ এর নিচে রাখার চেষ্টা করুন</li>
                    <li>সকালে DO কম থাকলে খাদ্য প্রদান স্থগিত রাখুন</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {user && (
                  <Button onClick={savePlan} disabled={saving} className="flex-1 min-w-[140px]">
                    <Save className="mr-2 h-4 w-4" /> {saving ? "সংরক্ষণ হচ্ছে..." : "পরিকল্পনা সংরক্ষণ"}
                  </Button>
                )}
                <Button onClick={exportPDF} variant="outline" className="flex-1 min-w-[140px]">
                  <Download className="mr-2 h-4 w-4" /> PDF ডাউনলোড
                </Button>
                <Button onClick={sharePlan} variant="outline" className="flex-1 min-w-[140px]">
                  <Share2 className="mr-2 h-4 w-4" /> শেয়ার করুন
                </Button>
              </div>
            </div>
          )}

          {/* Recommended Products */}
          <RecommendedProductsSlider category="calculator_related" titleBn="প্রস্তাবিত মাছের খাদ্য" />

          <div className="mt-8"><AdUnit position="footer" /></div>
    </>
  );

  if (user) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-4"><AdUnit position="header" className="mb-4" /></div>
        <div className="px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <div className="container mx-auto px-4 py-4"><AdUnit position="header" className="mb-4" /></div>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
}
