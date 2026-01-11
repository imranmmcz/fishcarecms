import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { ModuleCard } from "@/components/ModuleCard";
import { Button3D } from "@/components/ui/button-3d";
import { ProductSlider } from "@/components/ProductSlider";
import { FishHealthAdvice } from "@/components/FishHealthAdvice";
import AdUnit from "@/components/AdUnit";
import { Calculator, Droplets, Fish, Scale, Pill, TrendingUp, FileText, DollarSign, Package, MessageSquare, LayoutDashboard, FlaskConical, Leaf, BarChart3, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
const Index = () => {
  const { t } = useLanguage();

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
      <Header />
      
      {/* Header Ad */}
      <AdUnit position="header" className="py-2 container" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 text-white">
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-block rounded-full bg-white/20 px-4 py-1 text-sm backdrop-blur-sm">
              {t.heroTagline}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {t.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              {t.heroDescription}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/pond-calculator">
                <Button3D size="lg" variant="success">
                  <Calculator className="mr-2 h-5 w-5" />
                  {t.startNow}
                </Button3D>
              </Link>
              <Link to="/dashboard">
                <Button3D size="lg" variant="purple">
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  {t.dashboard}
                </Button3D>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {t.integratedModules}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.integratedModulesDesc}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
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
      <section className="py-16">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
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
      <section className="py-16 bg-gradient-primary text-white">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            {t.startManagement}
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
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
