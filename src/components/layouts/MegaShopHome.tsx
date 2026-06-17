import { Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import { Header } from "@/components/Header";
import { MegaShopFooter } from "./MegaShopFooter";
import { HeroSlider } from "@/components/home/HeroSlider";
import { FlashSaleSection } from "@/components/home/FlashSaleSection";
import { FishHealthAdvice } from "@/components/FishHealthAdvice";
import { ProductSlider } from "@/components/ProductSlider";
import { ProductCard, DisplayProduct } from "@/components/ProductCard";
import { useProducts } from "@/contexts/ProductsContext";
import AdUnit from "@/components/AdUnit";
import { Button3D } from "@/components/ui/button-3d";
import { ModuleCard } from "@/components/ModuleCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, Droplets, Fish, Scale, Pill, TrendingUp, FileText, DollarSign, Package, MessageSquare, FlaskConical, ShoppingBag, ArrowRight, Sparkles, Leaf, Flame, Star } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

const categoryLabels: Record<string, { bn: string; en: string }> = {
  medicine: { bn: "ঔষধ", en: "Medicine" },
  food: { bn: "খাদ্য", en: "Food" },
  accessories: { bn: "সরঞ্জাম", en: "Accessories" },
};

export const MegaShopHome = () => {
  const { t, language } = useLanguage();
  const { categories } = useCategories();
  const { products } = useProducts();

  const modules = [
    { id: 1, title: t.pondCalculator, description: t.pondCalculatorDesc, icon: Droplets, path: "/pond-calculator", isActive: true },
    { id: 2, title: t.stockingDensity, description: t.stockingDensityDesc, icon: Fish, path: "/stocking-density", isActive: true },
    { id: 3, title: t.fishStocking, description: t.fishStockingDesc, icon: Fish, path: "/fish-stocking", isActive: true },
    { id: 4, title: t.biomassCalculator, description: t.biomassCalculatorDesc, icon: Scale, path: "/biomass-calculator", isActive: true },
    { id: 5, title: t.feedManagement, description: t.feedManagementDesc, icon: Package, path: "/feed-management", isActive: true },
    { id: 6, title: t.medicineApplication, description: t.medicineApplicationDesc, icon: Pill, path: "/medicine-application", isActive: true },
    { id: 7, title: t.fertilizerCalculator, description: t.fertilizerCalculatorDesc, icon: TrendingUp, path: "/fertilizer-calculator", isActive: true },
    { id: 8, title: t.waterQuality, description: t.waterQualityDesc, icon: Droplets, path: "/water-quality", isActive: true },
    { id: 9, title: t.costCalculator, description: t.costCalculatorDesc, icon: DollarSign, path: "/cost-calculator", isActive: true },
    { id: 10, title: t.reportGeneration, description: t.reportGenerationDesc, icon: FileText, path: "/reports", isActive: true },
    { id: 11, title: t.fishAdvice, description: t.fishAdviceDesc, icon: MessageSquare, path: "/fish-advice", isActive: true },
    { id: 12, title: language === "bn" ? "খাদ্য ফর্মুলা" : "Feed Formula", description: language === "bn" ? "নিজের হাতে সুষম মাছের খাদ্য তৈরির ফর্মুলা ক্যালকুলেটর" : "Create custom balanced fish feed formula", icon: FlaskConical, path: "/feed-formula", isActive: true },
  ];

  const activeCategories = categories?.filter(c => c.is_active) || [];

  // Featured products for editorial grid
  const featured = [...(products || [])]
    .filter((p) => p.stock_quantity >= 0)
    .sort((a, b) => {
      const da = a.discount_percentage || 0;
      const db = b.discount_percentage || 0;
      if (db !== da) return db - da;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 7);

  const toDisplay = (p: any): DisplayProduct => {
    const disc = p.discount_percentage || 0;
    const cat = (p.category || "medicine") as "medicine" | "food" | "accessories";
    return {
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: disc > 0 ? p.price * (1 - disc / 100) : p.price,
      originalPrice: disc > 0 ? p.price : undefined,
      image_url: p.image_url || undefined,
      category: cat,
      categoryLabel: categoryLabels[cat]?.[language] || cat,
      discount_percentage: disc,
      isFromDatabase: true,
    };
  };

  const eyebrow = (en: string, bn: string) => (
    <p className="inline-flex items-center gap-2 text-[11px] font-display font-semibold uppercase tracking-[0.18em] text-primary">
      <span className="h-px w-6 bg-primary" />
      {language === "bn" ? bn : en}
    </p>
  );

  return (
    <div className="megashop-theme min-h-screen bg-background text-foreground">
      <SeoHead
        title={language === "bn" ? "বৈজ্ঞানিক মাছ চাষ ব্যবস্থাপনা" : "Scientific Fish Farming Management"}
        description={language === "bn" ? "আধুনিক প্রযুক্তি ব্যবহার করে মাছ চাষকে আরও লাভজনক এবং টেকসই করুন।" : "Make fish farming more profitable with modern technology."}
        url="/"
      />
      <Header />

      <AdUnit position="header" className="py-2 container px-3 sm:px-4" />

      {/* MAGAZINE HERO — 10-column editorial cover */}
      <section className="container px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-3 sm:gap-4 lg:gap-5">
          {/* Big hero slider (cols 1-7) */}
          <div className="lg:col-span-7 rounded-xl sm:rounded-2xl overflow-hidden shadow-magazine ring-1 ring-border/60">
            <HeroSlider />
          </div>

          {/* Editorial column (cols 8-10) */}
          <div className="lg:col-span-3 flex flex-col gap-3 sm:gap-4">
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-card border border-border/60 shadow-magazine flex flex-col justify-between min-h-[140px] sm:min-h-[180px]">
              {eyebrow("New Season", "নতুন সিজন")}
              <h2 className="font-display text-xl sm:text-2xl xl:text-3xl font-bold leading-[1.1] mt-2 sm:mt-3 text-foreground">
                {language === "bn" ? "মাছ চাষের পূর্ণাঙ্গ সমাধান।" : "The complete fish-farming toolkit."}
              </h2>
              <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                <Link to="/shop">
                  <Button3D variant="primary" size="sm" className="gap-1.5">
                    <ShoppingBag className="h-4 w-4" />
                    {language === "bn" ? "শপ" : "Shop"}
                  </Button3D>
                </Link>
                <Link to="/modules">
                  <Button3D variant="warning" size="sm" className="gap-1.5">
                    <Calculator className="h-4 w-4" />
                    {language === "bn" ? "টুলস" : "Tools"}
                  </Button3D>
                </Link>
              </div>
            </div>

            <Link
              to="/shop"
              className="group relative rounded-xl sm:rounded-2xl overflow-hidden p-4 sm:p-5 bg-[image:var(--gradient-hero)] text-primary-foreground shadow-feature min-h-[110px] sm:min-h-[140px] flex flex-col justify-between"
            >
              <div className="absolute -right-6 -top-6 opacity-20 group-hover:opacity-30 transition-opacity">
                <Leaf className="h-20 w-20 sm:h-24 sm:w-24" />
              </div>
              <Sparkles className="h-5 w-5 relative" />
              <div className="relative">
                <p className="font-display text-base sm:text-lg font-bold leading-tight">
                  {language === "bn" ? "নতুন পণ্য" : "New Arrivals"}
                </p>
                <p className="text-xs opacity-85 mt-0.5">
                  {language === "bn" ? "সর্বশেষ সংযোজন" : "Just landed"}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Category rail */}
      {activeCategories.length > 0 && (
        <section className="container px-3 sm:px-4 pb-4 sm:pb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-y border-border/60 py-2 sm:py-3 -mx-3 px-3 sm:mx-0 sm:px-0">
            {activeCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-xs sm:text-sm font-medium font-display"
              >
                {language === "bn" ? cat.name_bn : cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Flash sale band */}
      <div className="bg-foreground/[0.03] border-y border-border/60">
        <div className="container px-3 sm:px-4 py-2">
          <FlashSaleSection />
        </div>
      </div>

      {/* FEATURED — editorial product grid (cover + 6) */}
      {featured.length > 0 && (
        <section className="py-8 sm:py-12 lg:py-16">
          <div className="container px-3 sm:px-4">
            <div className="flex items-end justify-between mb-5 sm:mb-8 gap-3 sm:gap-4 flex-wrap">
              <div>
                {eyebrow("Editor's Picks", "সম্পাদকের পছন্দ")}
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-2 text-foreground leading-[1.05]">
                  {language === "bn" ? "জনপ্রিয় পণ্য" : "Featured Products"}
                </h2>
              </div>
              <Link to="/shop">
                <Button3D variant="primary" size="sm" className="gap-2">
                  {language === "bn" ? "সব দেখুন" : "View All"} <ArrowRight className="h-4 w-4" />
                </Button3D>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
              {/* Cover product 2×2 */}
              {featured[0] && (
                <div className="col-span-2 row-span-2 relative">
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex items-center gap-1 px-2 py-0.5 sm:gap-1.5 sm:px-2.5 sm:py-1 rounded-full bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-display font-semibold uppercase tracking-wider shadow-magazine">
                    <Star className="h-3 w-3 fill-current" />
                    {language === "bn" ? "কভার পিক" : "Cover Pick"}
                  </div>
                  <div className="h-full [&>*]:h-full">
                    <ProductCard product={toDisplay(featured[0])} />
                  </div>
                </div>
              )}
              {featured.slice(1, 7).map((p) => (
                <ProductCard key={p.id} product={toDisplay(p)} />
              ))}
            </div>
          </div>
        </section>
      )}

      <AdUnit position="between-modules" className="py-4 container px-3 sm:px-4" />

      {/* MODULES — bento (1 large + 6 small) */}
      <section className="py-8 sm:py-12 lg:py-16 bg-muted/40 border-y border-border/60">
        <div className="container px-3 sm:px-4">
          <div className="flex items-end justify-between mb-5 sm:mb-8 gap-3 sm:gap-4 flex-wrap">
            <div>
              {eyebrow("Farming Tools", "মাছ চাষ টুলস")}
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-2 text-foreground leading-[1.05]">
                {t.integratedModules}
              </h2>
            </div>
            <Link to="/modules">
              <Button3D variant="primary" size="sm" className="gap-1">
                {language === "bn" ? "সব দেখুন" : "View All"} <ArrowRight className="h-4 w-4" />
              </Button3D>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 auto-rows-fr">
            {/* Hero tile — Pond Calculator */}
            <Link
              to={modules[0].path}
              className="col-span-2 md:col-span-2 row-span-2 relative rounded-xl sm:rounded-2xl overflow-hidden p-4 sm:p-6 lg:p-8 bg-[image:var(--gradient-hero)] text-primary-foreground shadow-feature flex flex-col justify-between min-h-[170px] sm:min-h-[220px] group"
            >
              <div className="absolute -right-10 -bottom-10 opacity-15 group-hover:opacity-25 transition-opacity">
                <Droplets className="h-40 w-40 sm:h-56 sm:w-56" />
              </div>
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur text-[10px] font-display font-semibold uppercase tracking-wider">
                  <Flame className="h-3 w-3" /> {language === "bn" ? "ফিচার্ড" : "Featured"}
                </div>
                <h3 className="font-display text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mt-3 sm:mt-4 leading-[1.1]">
                  {modules[0].title}
                </h3>
                <p className="text-xs sm:text-sm lg:text-base opacity-85 mt-2 sm:mt-3 max-w-md line-clamp-2 sm:line-clamp-none">
                  {modules[0].description}
                </p>
              </div>
              <div className="relative inline-flex items-center gap-2 text-xs sm:text-sm font-display font-semibold mt-2">
                {language === "bn" ? "শুরু করুন" : "Get started"}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 6 small tiles */}
            {modules.slice(1, 7).map((module) => (
              <ModuleCard
                key={module.id}
                title={module.title}
                description={module.description}
                icon={module.icon}
                path={module.path}
                isActive={module.isActive}
              />
            ))}
          </div>
        </div>
      </section>

      {/* "From the Field" — editorial split */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="container px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-10">
            {eyebrow("From the Field", "মাঠ থেকে")}
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-2 text-foreground leading-[1.05]">
              {language === "bn" ? "পরামর্শ ও জনপ্রিয় পণ্য" : "Advice & Trending Products"}
            </h2>
          </div>
          <FishHealthAdvice />
        </div>
      </section>

      <AdUnit position="in-article" className="py-4 container px-3 sm:px-4" />

      <ProductSlider />

      {/* Asymmetric CTA */}
      <section className="py-8 sm:py-12 lg:py-20 relative overflow-hidden bg-[image:var(--gradient-hero)] text-primary-foreground">
        <div className="absolute -right-20 -top-20 opacity-10">
          <Leaf className="h-72 w-72 sm:h-[28rem] sm:w-[28rem]" />
        </div>
        <div className="absolute -left-16 -bottom-16 opacity-10">
          <Fish className="h-56 w-56 sm:h-72 sm:w-72" />
        </div>
        <div className="container px-3 sm:px-4 relative grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          <div className="lg:col-span-8">
            <p className="inline-flex items-center gap-2 text-[11px] font-display font-semibold uppercase tracking-[0.18em] opacity-90">
              <span className="h-px w-6 bg-current" />
              {language === "bn" ? "শুরু করুন আজই" : "Start today"}
            </p>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mt-3 leading-[1.05]">
              {t.startManagement}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg opacity-85 mt-3 sm:mt-4 max-w-2xl">
              {t.startManagementDesc}
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-2.5 sm:gap-3 w-full">
            <Link to="/pond-calculator">
              <Button3D size="lg" variant="warning" className="w-full justify-center text-sm sm:text-base">
                <Calculator className="mr-2 h-5 w-5" />
                {t.startPondMeasurement}
              </Button3D>
            </Link>
            <Link to="/shop">
              <Button3D size="lg" variant="primary" className="w-full justify-center text-sm sm:text-base border-white text-white hover:bg-white/20">
                <ShoppingBag className="mr-2 h-5 w-5" />
                {language === "bn" ? "শপ দেখুন" : "Browse Shop"}
              </Button3D>
            </Link>
          </div>
        </div>
      </section>

      <AdUnit position="footer" className="py-4 container px-3 sm:px-4" />
      <MegaShopFooter />
    </div>
  );
};
