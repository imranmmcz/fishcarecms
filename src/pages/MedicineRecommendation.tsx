import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  Stethoscope, Search, AlertTriangle, Shield, Pill, Fish, Droplets, Activity,
  ChevronDown, ChevronUp, ShoppingCart, ExternalLink, Sparkles, RotateCcw, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SeoHead from "@/components/SeoHead";
import AdUnit from "@/components/AdUnit";
import RecommendedProductsSlider from "@/components/RecommendedProductsSlider";
import { FISH_SPECIES_WITH_ALL } from "@/data/fishSpeciesOptions";

// ── Types ──
interface Treatment {
  method: string;
  dosage: string;
  duration: string;
}

interface Disease {
  id: string;
  name: string;
  name_en: string;
  category: string;
  severity: string;
  symptoms: string[];
  causes: string[];
  prevention: string[];
  treatment: Treatment[];
  affected_fish: string[];
  season: string[];
  image_url: string | null;
  image_description: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  discount_percentage: number | null;
  image_url: string | null;
  external_link: string | null;
}

interface MatchedDisease {
  disease: Disease;
  matchScore: number;
  matchedSymptoms: string[];
}

// ── Symptom options ──
const symptomOptions = [
  { value: "white_spots", label: "সাদা দাগ (White Spots)", keywords: ["সাদা দাগ", "white spot", "সাদা বিন্দু", "ইকথায়োফথিরিয়াস"] },
  { value: "red_patches", label: "লাল দাগ / ক্ষত (Red Body Patches)", keywords: ["লাল দাগ", "red", "রক্তক্ষরণ", "ক্ষত", "ঘা", "আলসার"] },
  { value: "floating", label: "পানিতে ভেসে থাকা (Floating)", keywords: ["ভেসে", "floating", "ভাসমান", "উপরে"] },
  { value: "loss_appetite", label: "খাদ্য গ্রহণে অনীহা (Loss of Appetite)", keywords: ["খাদ্য গ্রহণ", "appetite", "খাবার", "অনীহা", "খাওয়া বন্ধ"] },
  { value: "slow_movement", label: "ধীর গতি (Slow Movement)", keywords: ["ধীর", "slow", "অলস", "নড়াচড়া কমে"] },
  { value: "skin_lesions", label: "চামড়ায় ক্ষত (Skin Lesions)", keywords: ["চামড়া", "skin", "lesion", "ক্ষত", "ঘা", "ফোলা"] },
  { value: "gill_damage", label: "ফুলকা ক্ষতি (Gill Damage)", keywords: ["ফুলকা", "gill", "শ্বাসকষ্ট", "কালো ফুলকা"] },
  { value: "fin_rot", label: "পাখনা পচা (Fin Rot)", keywords: ["পাখনা", "fin", "পচা", "গলে", "ক্ষয়"] },
  { value: "eye_bulging", label: "চোখ ফুলে যাওয়া (Eye Bulging)", keywords: ["চোখ", "eye", "ফুলে", "বুলজিং", "পপ"] },
  { value: "cotton_growth", label: "তুলার মতো বৃদ্ধি (Cotton-like Growth)", keywords: ["তুলা", "cotton", "ছত্রাক", "fungus", "সাদা তুলা"] },
  { value: "scratching", label: "শরীর ঘষা (Scratching/Flashing)", keywords: ["ঘষা", "scratch", "flash", "চুলকানি"] },
  { value: "bloating", label: "পেট ফোলা (Bloating)", keywords: ["পেট", "bloat", "ফোলা", "স্ফীত"] },
  { value: "color_change", label: "রঙ পরিবর্তন (Color Change)", keywords: ["রঙ", "color", "বিবর্ণ", "কালো হয়ে", "ফ্যাকাশে"] },
  { value: "mass_death", label: "গণমৃত্যু (Mass Mortality)", keywords: ["মৃত্যু", "death", "মরে যাচ্ছে", "গণমৃত্যু"] },
];

const fishSpeciesOptions = FISH_SPECIES_WITH_ALL;

const waterConditions = [
  { value: "all", label: "সকল অবস্থা" },
  { value: "high_ammonia", label: "উচ্চ অ্যামোনিয়া" },
  { value: "low_oxygen", label: "অক্সিজেন কম" },
  { value: "high_ph", label: "উচ্চ pH" },
  { value: "low_ph", label: "নিম্ন pH" },
  { value: "turbid", label: "ঘোলা পানি" },
  { value: "algae_bloom", label: "শ্যাওলা বৃদ্ধি" },
];

const severityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

const severityLabels: Record<string, string> = {
  low: "হালকা", medium: "মাঝারি", high: "গুরুতর", critical: "জটিল",
};

// ── Component ──
export default function MedicineRecommendation() {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [diseaseProducts, setDiseaseProducts] = useState<Record<string, Product[]>>({});
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState("all");
  const [selectedWaterCondition, setSelectedWaterCondition] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch diseases + products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: diseasesData } = await supabase
        .from("fish_diseases")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (diseasesData) {
        const parsed: Disease[] = diseasesData.map((d) => ({
          ...d,
          treatment: Array.isArray(d.treatment) ? (d.treatment as unknown as Treatment[]) : [],
        }));
        setDiseases(parsed);

        // Fetch recommended products for each disease
        const ids = parsed.map((d) => d.id);
        if (ids.length > 0) {
          const { data: recData } = await supabase
            .from("disease_recommended_products")
            .select("disease_id, product_id, products:product_id(id, name, price, discount_percentage, image_url, external_link)")
            .in("disease_id", ids);

          if (recData) {
            const map: Record<string, Product[]> = {};
            recData.forEach((r: any) => {
              if (!map[r.disease_id]) map[r.disease_id] = [];
              if (r.products) map[r.disease_id].push(r.products);
            });
            setDiseaseProducts(map);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleSymptom = (value: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
    setAnalyzed(false);
  };

  const resetAll = () => {
    setSelectedSymptoms([]);
    setSelectedSpecies("all");
    setSelectedWaterCondition("all");
    setAnalyzed(false);
    setExpandedId(null);
    toast.success("ফিল্টার রিসেট হয়েছে");
  };

  // Matching logic
  const matchedDiseases: MatchedDisease[] = useMemo(() => {
    if (!analyzed || selectedSymptoms.length === 0) return [];

    const selectedKeywords = selectedSymptoms.flatMap(
      (sv) => symptomOptions.find((s) => s.value === sv)?.keywords || []
    );

    return diseases
      .map((disease) => {
        // Match symptoms
        const matchedSymptoms: string[] = [];
        let score = 0;

        disease.symptoms.forEach((symptom) => {
          const symptomLower = symptom.toLowerCase();
          const matched = selectedKeywords.some((kw) => symptomLower.includes(kw.toLowerCase()));
          if (matched) {
            matchedSymptoms.push(symptom);
            score += 1;
          }
        });

        // Bonus for species match
        if (selectedSpecies !== "all" && disease.affected_fish.some((f) => f.includes(selectedSpecies))) {
          score += 0.5;
        }

        // Normalize score as percentage
        const maxPossible = Math.max(selectedSymptoms.length, disease.symptoms.length);
        const matchScore = maxPossible > 0 ? Math.min(Math.round((score / maxPossible) * 100), 100) : 0;

        return { disease, matchScore, matchedSymptoms };
      })
      .filter((m) => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [analyzed, selectedSymptoms, selectedSpecies, diseases]);

  const analyze = () => {
    if (selectedSymptoms.length === 0) {
      toast.error("অন্তত একটি লক্ষণ নির্বাচন করুন");
      return;
    }
    setAnalyzed(true);
    setExpandedId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SeoHead
        title="স্মার্ট ঔষধ সুপারিশ | Smart Medicine Recommendation"
        description="মাছের রোগের লক্ষণ অনুযায়ী সঠিক ঔষধ ও চিকিৎসা খুঁজুন"
      />
      <Header />
      <div className="container mx-auto px-4 py-4"><AdUnit position="header" className="mb-4" /></div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary p-3">
                <Stethoscope className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">স্মার্ট ঔষধ সুপারিশ</h1>
                <p className="text-muted-foreground mt-1">
                  লক্ষণ নির্বাচন করুন — AI স্বয়ংক্রিয়ভাবে রোগ শনাক্ত করে সঠিক ঔষধ সুপারিশ করবে
                </p>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <Card className="shadow-elegant mb-6 animate-slide-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" /> রোগ শনাক্তকরণ তথ্য
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Species & Water Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Fish className="h-4 w-4" /> মাছের প্রজাতি</Label>
                  <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {fishSpeciesOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Droplets className="h-4 w-4" /> পানির অবস্থা</Label>
                  <Select value={selectedWaterCondition} onValueChange={setSelectedWaterCondition}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {waterConditions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Symptom Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Activity className="h-4 w-4" /> লক্ষণ নির্বাচন করুন (একাধিক নির্বাচন যোগ্য)</Label>
                <div className="flex flex-wrap gap-2">
                  {symptomOptions.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => toggleSymptom(s.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                        selectedSymptoms.includes(s.value)
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {selectedSymptoms.includes(s.value) && <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={analyze} className="flex-1" size="lg" disabled={selectedSymptoms.length === 0}>
                  <Sparkles className="mr-2 h-4 w-4" /> রোগ বিশ্লেষণ করুন
                </Button>
                <Button onClick={resetAll} variant="outline" size="lg">
                  <RotateCcw className="mr-2 h-4 w-4" /> রিসেট
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12 text-muted-foreground">ডেটা লোড হচ্ছে...</div>
          )}

          {/* Results */}
          {analyzed && !loading && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                বিশ্লেষণ ফলাফল
                <Badge variant="secondary">{matchedDiseases.length} রোগ পাওয়া গেছে</Badge>
              </h2>

              {matchedDiseases.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-lg font-medium">কোনো মিল পাওয়া যায়নি</p>
                    <p className="text-sm mt-1">অন্য লক্ষণ নির্বাচন করে আবার চেষ্টা করুন</p>
                  </CardContent>
                </Card>
              ) : (
                matchedDiseases.map(({ disease, matchScore, matchedSymptoms }) => {
                  const isExpanded = expandedId === disease.id;
                  const products = diseaseProducts[disease.id] || [];

                  return (
                    <Card key={disease.id} className="overflow-hidden border-l-4" style={{
                      borderLeftColor: matchScore >= 70 ? "hsl(var(--destructive))" : matchScore >= 40 ? "hsl(var(--chart-4))" : "hsl(var(--chart-2))",
                    }}>
                      <CardContent className="p-0">
                        {/* Header */}
                        <button
                          className="w-full p-4 md:p-5 text-left flex items-start gap-4 hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : disease.id)}
                        >
                          {disease.image_url && (
                            <img
                              src={disease.image_url}
                              alt={disease.name}
                              className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0"
                              loading="lazy"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">{disease.name}</h3>
                              <span className="text-sm text-muted-foreground">({disease.name_en})</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge className={severityColors[disease.severity]}>
                                {severityLabels[disease.severity] || disease.severity}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                সম্ভাবনা: {matchScore}%
                              </Badge>
                              {products.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  <Pill className="h-3 w-3 mr-1" /> {products.length} ঔষধ
                                </Badge>
                              )}
                            </div>
                            {/* Match score bar */}
                            <div className="flex items-center gap-2">
                              <Progress value={matchScore} className="h-2 flex-1" />
                              <span className="text-xs font-medium text-muted-foreground">{matchScore}%</span>
                            </div>
                            {/* Matched symptoms */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {matchedSymptoms.slice(0, 3).map((s, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-primary/5">
                                  <CheckCircle2 className="h-3 w-3 mr-1 text-primary" /> {s}
                                </Badge>
                              ))}
                              {matchedSymptoms.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{matchedSymptoms.length - 3}</Badge>
                              )}
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />}
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t p-4 md:p-5 space-y-5 animate-fade-in">
                            {/* Causes */}
                            {disease.causes.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                                  <AlertTriangle className="h-4 w-4 text-destructive" /> কারণ
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                  {disease.causes.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                              </div>
                            )}

                            {/* All Symptoms */}
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                                <Activity className="h-4 w-4 text-chart-4" /> সকল লক্ষণ
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {disease.symptoms.map((s, i) => (
                                  <Badge key={i} variant={matchedSymptoms.includes(s) ? "default" : "outline"} className="text-xs">
                                    {matchedSymptoms.includes(s) && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* Treatment */}
                            {disease.treatment.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                                  <Pill className="h-4 w-4 text-primary" /> চিকিৎসা ও ঔষধ
                                </h4>
                                <div className="space-y-3">
                                  {disease.treatment.map((t, i) => (
                                    <div key={i} className="p-3 bg-muted/30 rounded-lg border">
                                      <p className="font-medium text-sm">{t.method}</p>
                                      {t.dosage && <p className="text-xs text-muted-foreground mt-1">মাত্রা: {t.dosage}</p>}
                                      {t.duration && <p className="text-xs text-muted-foreground">সময়কাল: {t.duration}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Prevention */}
                            {disease.prevention.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                                  <Shield className="h-4 w-4 text-chart-2" /> প্রতিরোধ
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                  {disease.prevention.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                              </div>
                            )}

                            {/* Recommended Products */}
                            {products.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                                  <ShoppingCart className="h-4 w-4 text-primary" /> প্রস্তাবিত ঔষধ / পণ্য
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {products.map((product) => {
                                    const discountedPrice = product.discount_percentage
                                      ? Math.round(product.price * (1 - product.discount_percentage / 100))
                                      : product.price;
                                    return (
                                      <Link
                                        key={product.id}
                                        to={product.external_link || `/product/${product.id}`}
                                        target={product.external_link ? "_blank" : undefined}
                                        className="group border rounded-lg p-3 hover:shadow-md transition-shadow bg-card"
                                      >
                                        {product.image_url && (
                                          <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-24 object-contain rounded mb-2"
                                            loading="lazy"
                                          />
                                        )}
                                        <p className="text-xs font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                                          {product.name}
                                        </p>
                                        <div className="flex items-center gap-1">
                                          <span className="text-sm font-bold text-primary">৳{discountedPrice}</span>
                                          {product.discount_percentage ? (
                                            <span className="text-xs text-muted-foreground line-through">৳{product.price}</span>
                                          ) : null}
                                        </div>
                                        {product.external_link && (
                                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-1">
                                            <ExternalLink className="h-2.5 w-2.5" /> বাহ্যিক লিংক
                                          </span>
                                        )}
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Affected Fish */}
                            {disease.affected_fish.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-xs text-muted-foreground mb-1">আক্রান্ত মাছ:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {disease.affected_fish.map((f, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* Dynamic disease-specific products slider */}
          {analyzed && matchedDiseases.length > 0 && (
            <RecommendedProductsSlider
              diseaseIds={matchedDiseases.map(m => m.disease.id)}
              category="popular_medicine"
              titleBn="AI সুপারিশকৃত ঔষধ ও পণ্য"
              title="AI Recommended Medicines"
              showAiBadge
            />
          )}

          {/* Fallback slider when no analysis done */}
          {!analyzed && (
            <RecommendedProductsSlider category="popular_medicine" titleBn="জনপ্রিয় মাছের ঔষধ" />
          )}

          <div className="mt-8"><AdUnit position="footer" /></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
