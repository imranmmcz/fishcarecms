import { Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import { ModernHeader } from "./ModernHeader";
import { ModernFooter } from "./ModernFooter";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HeroSlider } from "@/components/home/HeroSlider";
import { FlashSaleSection } from "@/components/home/FlashSaleSection";
import { FishHealthAdvice } from "@/components/FishHealthAdvice";
import { ProductSlider } from "@/components/ProductSlider";
import AdUnit from "@/components/AdUnit";
import { Button3D } from "@/components/ui/button-3d";
import { ModuleCard } from "@/components/ModuleCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, Droplets, Fish, Scale, Pill, TrendingUp, FileText, DollarSign, Package, MessageSquare, FlaskConical, Leaf, BarChart3, Languages, ArrowRight, Star, ShieldCheck, Zap } from "lucide-react";

export const ModernHome = () => {
  const { t, language } = useLanguage();

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

  const stats = [
    { icon: ShieldCheck, value: "১০০+", label: language === "bn" ? "মডিউল ও টুল" : "Modules & Tools" },
    { icon: Star, value: "৫০০০+", label: language === "bn" ? "সক্রিয় ব্যবহারকারী" : "Active Users" },
    { icon: Zap, value: "২৪/৭", label: language === "bn" ? "সাপোর্ট" : "Support" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={language === "bn" ? "বৈজ্ঞানিক মাছ চাষ ব্যবস্থাপনা" : "Scientific Fish Farming Management"}
        description={language === "bn" ? "আধুনিক প্রযুক্তি ব্যবহার করে মাছ চাষকে আরও লাভজনক এবং টেকসই করুন।" : "Make fish farming more profitable with modern technology."}
        url="/"
      />
      <ModernHeader />

      <AdUnit position="header" className="py-2 container" />

      {/* Hero */}
      <section className="relative">
        <HeroSlider />
      </section>

      {/* Stats Bar */}
      <section className="bg-primary/5 border-y border-border">
        <div className="container py-6">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FlashSaleSection />
      <FeaturedProducts />

      {/* Modules - Modern Card Style */}
      <section className="py-12 sm:py-20">
        <div className="container px-3 sm:px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{t.integratedModules}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{t.integratedModulesDesc}</p>
            </div>
            <Link to="/modules">
              <Button3D variant="primary" size="sm" className="hidden sm:flex gap-1">
                {language === "bn" ? "সব দেখুন" : "View All"} <ArrowRight className="h-4 w-4" />
              </Button3D>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {modules.slice(0, 8).map((module) => (
              <ModuleCard key={module.id} title={module.title} description={module.description} icon={module.icon} path={module.path} isActive={module.isActive} />
            ))}
          </div>
        </div>
      </section>

      <AdUnit position="between-modules" className="py-4 container" />
      <ProductSlider />
      <AdUnit position="in-article" className="py-4 container" />
      <FishHealthAdvice />

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary via-primary to-primary/80 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container text-center space-y-5 px-4 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-bold">{t.startManagement}</h2>
          <p className="text-lg text-white/80 max-w-xl mx-auto">{t.startManagementDesc}</p>
          <Link to="/pond-calculator">
            <Button3D size="lg" variant="warning" className="rounded-full">
              <Calculator className="mr-2 h-5 w-5" />
              {t.startPondMeasurement}
            </Button3D>
          </Link>
        </div>
      </section>

      <AdUnit position="footer" className="py-4 container" />
      <ModernFooter />
    </div>
  );
};
