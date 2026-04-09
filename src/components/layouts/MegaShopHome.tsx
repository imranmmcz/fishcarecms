import { Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import { MegaShopHeader } from "./MegaShopHeader";
import { MegaShopFooter } from "./MegaShopFooter";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HeroSlider } from "@/components/home/HeroSlider";
import { FlashSaleSection } from "@/components/home/FlashSaleSection";
import { FishHealthAdvice } from "@/components/FishHealthAdvice";
import { ProductSlider } from "@/components/ProductSlider";
import AdUnit from "@/components/AdUnit";
import { Button3D } from "@/components/ui/button-3d";
import { ModuleCard } from "@/components/ModuleCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, Droplets, Fish, Scale, Pill, TrendingUp, FileText, DollarSign, Package, MessageSquare, FlaskConical, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

export const MegaShopHome = () => {
  const { t, language } = useLanguage();
  const { categories } = useCategories();

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

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={language === "bn" ? "বৈজ্ঞানিক মাছ চাষ ব্যবস্থাপনা" : "Scientific Fish Farming Management"}
        description={language === "bn" ? "আধুনিক প্রযুক্তি ব্যবহার করে মাছ চাষকে আরও লাভজনক এবং টেকসই করুন।" : "Make fish farming more profitable with modern technology."}
        url="/"
      />
      <MegaShopHeader />

      <AdUnit position="header" className="py-2 container" />

      {/* Hero with side banners grid */}
      <section className="container py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Main Hero - Takes 3 cols */}
          <div className="lg:col-span-3 rounded-xl overflow-hidden">
            <HeroSlider />
          </div>
          {/* Side Banners */}
          <div className="hidden lg:flex flex-col gap-3">
            <Link to="/shop" className="flex-1 rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 flex flex-col justify-between text-primary-foreground hover:opacity-90 transition-opacity">
              <Sparkles className="h-6 w-6" />
              <div>
                <p className="text-lg font-bold">{language === "bn" ? "নতুন পণ্য" : "New Arrivals"}</p>
                <p className="text-xs opacity-80">{language === "bn" ? "সর্বশেষ সংযোজন দেখুন" : "Check latest additions"}</p>
              </div>
            </Link>
            <Link to="/shop" className="flex-1 rounded-xl bg-gradient-to-br from-accent to-accent/80 p-5 flex flex-col justify-between text-white hover:opacity-90 transition-opacity">
              <ShoppingBag className="h-6 w-6" />
              <div>
                <p className="text-lg font-bold">{language === "bn" ? "সেরা বিক্রি" : "Best Sellers"}</p>
                <p className="text-xs opacity-80">{language === "bn" ? "জনপ্রিয় পণ্যসমূহ" : "Most popular products"}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Category Quick Nav */}
      {activeCategories.length > 0 && (
        <section className="container pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {activeCategories.map((cat) => (
              <Link key={cat.id} to={`/shop?category=${cat.slug}`}
                className="shrink-0 px-4 py-2 rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-sm font-medium">
                {language === "bn" ? cat.name_bn : cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <FlashSaleSection />
      <FeaturedProducts />

      <AdUnit position="between-modules" className="py-4 container" />

      {/* Modules Grid - Compact */}
      <section className="py-10 sm:py-16 bg-muted/30">
        <div className="container px-3 sm:px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                {language === "bn" ? "মাছ চাষ টুলস" : "Farming Tools"}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{t.integratedModules}</h2>
            </div>
            <Link to="/modules">
              <Button3D variant="outline" size="sm" className="gap-1">
                {language === "bn" ? "সব দেখুন" : "View All"} <ArrowRight className="h-4 w-4" />
              </Button3D>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {modules.slice(0, 8).map((module) => (
              <ModuleCard key={module.id} title={module.title} description={module.description} icon={module.icon} path={module.path} isActive={module.isActive} />
            ))}
          </div>
        </div>
      </section>

      <ProductSlider />
      <AdUnit position="in-article" className="py-4 container" />
      <FishHealthAdvice />

      {/* CTA - Gradient Banner */}
      <section className="py-12 sm:py-16 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 50%, hsl(var(--accent)) 100%)' }}>
        <div className="container text-center space-y-5 px-4 relative z-10 text-white">
          <h2 className="text-2xl sm:text-4xl font-bold">{t.startManagement}</h2>
          <p className="text-lg text-white/80 max-w-xl mx-auto">{t.startManagementDesc}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/pond-calculator">
              <Button3D size="lg" variant="warning">
                <Calculator className="mr-2 h-5 w-5" />
                {t.startPondMeasurement}
              </Button3D>
            </Link>
            <Link to="/shop">
              <Button3D size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                <ShoppingBag className="mr-2 h-5 w-5" />
                {language === "bn" ? "শপ দেখুন" : "Browse Shop"}
              </Button3D>
            </Link>
          </div>
        </div>
      </section>

      <AdUnit position="footer" className="py-4 container" />
      <MegaShopFooter />
    </div>
  );
};
