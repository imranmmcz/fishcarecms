import { useState, useEffect } from "react";
import { Stethoscope, ChevronDown, AlertCircle, CheckCircle2, Clock, Shield, ShoppingCart, Loader2 } from "lucide-react";
import { Button3D } from "@/components/ui/button-3d";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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
}

interface Product {
  id: string;
  name: string;
  price: number;
  discount_percentage: number | null;
  image_url: string | null;
}

const categoryIcons: Record<string, string> = {
  bacterial: "🦠",
  viral: "🧬",
  fungal: "🍄",
  parasitic: "🪱",
  nutritional: "🥗",
  environmental: "🌊",
};

const severityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  low: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

export const FishHealthAdvice = () => {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    const fetchDiseases = async () => {
      const { data } = await supabase
        .from("fish_diseases")
        .select("id, name, name_en, category, severity, symptoms, causes, prevention, treatment, affected_fish, season, image_url")
        .eq("is_active", true)
        .order("display_order");
      if (data) {
        setDiseases(data.map(d => ({
          ...d,
          treatment: Array.isArray(d.treatment) ? (d.treatment as unknown as Treatment[]) : [],
        })));
      }
      setLoading(false);
    };
    fetchDiseases();
  }, []);

  useEffect(() => {
    if (!selectedDiseaseId) {
      setRecommendedProducts([]);
      return;
    }
    const fetchProducts = async () => {
      setProductsLoading(true);
      const { data } = await supabase
        .from("disease_recommended_products")
        .select("product_id, products:product_id(id, name, price, discount_percentage, image_url)")
        .eq("disease_id", selectedDiseaseId)
        .order("display_order");
      if (data) {
        const prods = data
          .map((r: any) => r.products)
          .filter(Boolean) as Product[];
        setRecommendedProducts(prods);
      }
      setProductsLoading(false);
    };
    fetchProducts();
  }, [selectedDiseaseId]);

  const currentDisease = diseases.find((d) => d.id === selectedDiseaseId);

  return (
    <section className="py-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20">
      <div className="container">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
            <Stethoscope className="h-5 w-5" />
            <span className="font-bold">ফিশ ডক্টর</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            মাছের স্বাস্থ্য পরামর্শ
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            আপনার মাছের সমস্যা নির্বাচন করুন এবং সঠিক চিকিৎসা পদ্ধতি জানুন
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Symptom Selector */}
          <div className="relative mb-8">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-4 p-5 bg-card rounded-2xl border-2 border-border shadow-soft hover:border-primary/50 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-2xl">
                  {currentDisease ? (categoryIcons[currentDisease.category] || "🐟") : "🔍"}
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">সমস্যা/রোগ নির্বাচন করুন</p>
                  <p className="text-lg font-bold text-foreground">
                    {currentDisease ? currentDisease.name : loading ? "লোড হচ্ছে..." : "এখানে ক্লিক করুন"}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-6 w-6 text-muted-foreground transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl border border-border shadow-elegant z-50 overflow-hidden animate-scale-in">
                <div className="max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">রোগের তালিকা লোড হচ্ছে...</span>
                    </div>
                  ) : diseases.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">কোনো রোগ পাওয়া যায়নি</div>
                  ) : (
                    diseases.map((disease) => (
                      <button
                        key={disease.id}
                        onClick={() => {
                          setSelectedDiseaseId(disease.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0 ${
                          selectedDiseaseId === disease.id ? "bg-primary/10" : ""
                        }`}
                      >
                        <span className="text-2xl">{categoryIcons[disease.category] || "🐟"}</span>
                        <div className="text-left flex-1">
                          <p className="font-bold text-foreground">{disease.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {disease.symptoms.slice(0, 2).join(", ")}
                            {disease.symptoms.length > 2 && "..."}
                          </p>
                        </div>
                        <Badge className={`${severityColors[disease.severity]} border-0 text-xs`}>
                          {disease.severity === "high" ? "তীব্র" : disease.severity === "medium" ? "মাঝারি" : "হালকা"}
                        </Badge>
                        {selectedDiseaseId === disease.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Disease Details Card */}
          {currentDisease && (
            <div className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden animate-fade-in">
              <div className="md:flex">
                {/* Disease Image */}
                <div className="md:w-1/3 relative">
                  {currentDisease.image_url ? (
                    <img
                      src={currentDisease.image_url}
                      alt={currentDisease.name}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 md:h-full bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900 dark:to-teal-800 flex items-center justify-center">
                      <span className="text-8xl">{categoryIcons[currentDisease.category] || "🐟"}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white/80 text-sm">{currentDisease.name_en}</p>
                    <h3 className="text-white text-xl font-bold">{currentDisease.name}</h3>
                  </div>
                </div>

                {/* Treatment Details */}
                <div className="md:w-2/3 p-6 md:p-8 space-y-6">
                  {/* Symptoms */}
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-2">লক্ষণসমূহ</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentDisease.symptoms.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-sm">{s}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Treatment */}
                  {currentDisease.treatment.length > 0 && (
                    <div className="grid sm:grid-cols-1 gap-4">
                      {currentDisease.treatment.map((t, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{t.method}</p>
                            <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                              <span>ডোজ: {t.dosage}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {t.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Prevention */}
                  {currentDisease.prevention.length > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <h5 className="font-bold text-amber-800 dark:text-amber-300">প্রতিরোধ</h5>
                      </div>
                      <ul className="space-y-2">
                        {currentDisease.prevention.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                            <span className="text-amber-500">•</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Products */}
                  {productsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>পণ্য লোড হচ্ছে...</span>
                    </div>
                  ) : recommendedProducts.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <h5 className="font-bold text-foreground">প্রস্তাবিত ঔষধ/পণ্য</h5>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {recommendedProducts.map((product) => {
                          const discountedPrice = product.discount_percentage && product.discount_percentage > 0
                            ? Math.round(product.price * (1 - product.discount_percentage / 100))
                            : null;
                          return (
                            <Link
                              key={product.id}
                              to={`/product/${product.id}`}
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors group"
                            >
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <ShoppingCart className="h-6 w-6 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                                  {product.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-primary text-sm">
                                    ৳{discountedPrice ?? product.price}
                                  </span>
                                  {discountedPrice && (
                                    <span className="text-xs text-muted-foreground line-through">৳{product.price}</span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* View Full Details */}
                  <Link to="/disease-advice">
                    <Button3D variant="success" size="lg" className="w-full gap-2">
                      <Stethoscope className="h-5 w-5" />
                      সম্পূর্ণ রোগ পরামর্শ দেখুন
                    </Button3D>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedDiseaseId && !loading && (
            <div className="text-center py-12 bg-card rounded-3xl border border-dashed border-border">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center text-4xl mb-4">
                🐟
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">সমস্যা নির্বাচন করুন</h3>
              <p className="text-muted-foreground">
                উপরের ড্রপডাউন থেকে আপনার মাছের সমস্যা বা রোগ নির্বাচন করুন
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
