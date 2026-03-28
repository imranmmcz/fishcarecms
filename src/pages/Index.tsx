import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import { ModuleCard } from "@/components/ModuleCard";
import { Button3D } from "@/components/ui/button-3d";
import { ProductSlider } from "@/components/ProductSlider";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FishHealthAdvice } from "@/components/FishHealthAdvice";
import { HeroSlider } from "@/components/home/HeroSlider";
import { FlashSaleSection } from "@/components/home/FlashSaleSection";

import AdUnit from "@/components/AdUnit";
import { Calculator, Droplets, Fish, Scale, Pill, TrendingUp, FileText, DollarSign, Package, MessageSquare, FlaskConical, Leaf, BarChart3, Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Index = () => {
  const { t, language } = useLanguage();

  const modules = [
    {
      id: 1,
      title: t.pondCalculator,
      description: t.pondCalculatorDesc,
      icon: Droplets,
      path: "/pond-calculator",
      isActive: true,
    },
    {
      id: 2,
      title: t.stockingDensity,
      description: t.stockingDensityDesc,
      icon: Fish,
      path: "/stocking-density",
      isActive: true,
    },
    {
      id: 3,
      title: t.fishStocking,
      description: t.fishStockingDesc,
      icon: Fish,
      path: "/fish-stocking",
      isActive: true,
    },
    {
      id: 4,
      title: t.biomassCalculator,
      description: t.biomassCalculatorDesc,
      icon: Scale,
      path: "/biomass-calculator",
      isActive: true,
    },
    {
      id: 5,
      title: t.feedManagement,
      description: t.feedManagementDesc,
      icon: Package,
      path: "/feed-management",
      isActive: true,
    },
    {
      id: 6,
      title: t.medicineApplication,
      description: t.medicineApplicationDesc,
      icon: Pill,
      path: "/medicine-application",
      isActive: true,
    },
    {
      id: 7,
      title: t.fertilizerCalculator,
      description: t.fertilizerCalculatorDesc,
      icon: TrendingUp,
      path: "/fertilizer-calculator",
      isActive: true,
    },
    {
      id: 8,
      title: t.waterQuality,
      description: t.waterQualityDesc,
      icon: Droplets,
      path: "/water-quality",
      isActive: true,
    },
    {
      id: 9,
      title: t.costCalculator,
      description: t.costCalculatorDesc,
      icon: DollarSign,
      path: "/cost-calculator",
      isActive: true,
    },
    {
      id: 10,
      title: t.reportGeneration,
      description: t.reportGenerationDesc,
      icon: FileText,
      path: "/reports",
      isActive: true,
    },
    {
      id: 11,
      title: t.fishAdvice,
      description: t.fishAdviceDesc,
      icon: MessageSquare,
      path: "/fish-advice",
      isActive: true,
    },
    {
      id: 12,
      title: language === "bn" ? "খাদ্য ফর্মুলা" : "Feed Formula",
      description: language === "bn" ? "নিজের হাতে সুষম মাছের খাদ্য তৈরির ফর্মুলা ক্যালকুলেটর" : "Create custom balanced fish feed formula",
      icon: FlaskConical,
      path: "/feed-formula",
      isActive: true,
    },
  ];

  const benefits = [
    {
      icon: FlaskConical,
      title: t.scientificMethod,
      description: t.scientificMethodDesc,
    },
    {
      icon: Leaf,
      title: t.resourceOptimization,
      description: t.resourceOptimizationDesc,
    },
    {
      icon: BarChart3,
      title: t.productivityIncrease,
      description: t.productivityIncreaseDesc,
    },
    {
      icon: Languages,
      title: t.easyToUse,
      description: t.easyToUseDesc,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={language === "bn" ? "বৈজ্ঞানিক মাছ চাষ ব্যবস্থাপনা" : "Scientific Fish Farming Management"}
        description={language === "bn" ? "আধুনিক প্রযুক্তি ব্যবহার করে মাছ চাষকে আরও লাভজনক এবং টেকসই করুন। পুকুর পরিমাপ, খাদ্য ব্যবস্থাপনা, বায়োমাস গণনা।" : "Make fish farming more profitable with modern technology."}
        url="/"
        keywords="মাছ চাষ, একুয়াকালচার, ফিশ ফার্মিং, পুকুর ব্যবস্থাপনা"
      />
      <Header />
      
      {/* Header Ad */}
      <AdUnit position="header" className="py-2 container" />

      {/* Hero Section */}
      <section className="relative">
        <HeroSlider />
      </section>
      {/* Flash Sale */}
      <FlashSaleSection />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Features Section */}
      <section className="py-10 sm:py-16 bg-muted/30">
        <div className="container px-3 sm:px-4">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              {t.integratedModules}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              {t.integratedModulesDesc}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 animate-fade-in">
            {modules.map((module) => (
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

      {/* Between Modules Ad */}
      <AdUnit position="between-modules" className="py-4 container" />

      {/* Product Slider */}
      <ProductSlider />

      {/* In-Article Ad */}
      <AdUnit position="in-article" className="py-4 container" />

      {/* Fish Health Advice */}
      <FishHealthAdvice />

      {/* Benefits Section */}
      <section className="py-10 sm:py-16">
        <div className="container px-3 sm:px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 text-foreground">
              {t.whyUseSystem}
            </h2>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {benefits.map((benefit, index) => (
                  <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <div className="bg-gradient-card rounded-xl p-6 shadow-soft h-full border border-border/50 hover:shadow-elegant transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">{benefit.title}</h3>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-2 mt-6">
                <CarouselPrevious className="static translate-y-0 bg-background hover:bg-primary hover:text-primary-foreground" />
                <CarouselNext className="static translate-y-0 bg-background hover:bg-primary hover:text-primary-foreground" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-16 bg-gradient-primary text-white">
        <div className="container text-center space-y-4 sm:space-y-6 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            {t.startManagement}
          </h2>
          <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto">
            {t.startManagementDesc}
          </p>
          <Link to="/pond-calculator">
            <Button3D size="lg" variant="warning">
              <Calculator className="mr-2 h-5 w-5" />
              {t.startPondMeasurement}
            </Button3D>
          </Link>
        </div>
      </section>

      {/* Footer Ad */}
      <AdUnit position="footer" className="py-4 container" />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
