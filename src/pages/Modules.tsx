import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { ModuleCard } from "@/components/ModuleCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdUnit from "@/components/AdUnit";
import { Calculator, Droplets, Fish, Scale, Pill, TrendingUp, FileText, DollarSign, Package, ArrowRight, CheckCircle2, Info, MessageSquare, FlaskConical } from "lucide-react";
import { useFarming } from "@/contexts/FarmingContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

const Modules = () => {
  const { pondData, fishStockingData } = useFarming();
  const { t, language } = useLanguage();

  const modules = [
    {
      id: 1,
      title: t.pondCalculator,
      description: t.pondCalculatorDesc,
      icon: Droplets,
      path: "/pond-calculator",
      step: 1,
    },
    {
      id: 2,
      title: t.stockingDensity,
      description: t.stockingDensityDesc,
      icon: Fish,
      path: "/stocking-density",
      step: 2,
    },
    {
      id: 3,
      title: t.fishStocking,
      description: t.fishStockingDesc,
      icon: Fish,
      path: "/fish-stocking",
      step: 3,
    },
    {
      id: 4,
      title: t.biomassCalculator,
      description: t.biomassCalculatorDesc,
      icon: Scale,
      path: "/biomass-calculator",
      step: 4,
    },
    {
      id: 5,
      title: t.feedManagement,
      description: t.feedManagementDesc,
      icon: Package,
      path: "/feed-management",
      step: 5,
    },
    {
      id: 6,
      title: t.medicineApplication,
      description: t.medicineApplicationDesc,
      icon: Pill,
      path: "/medicine-application",
      step: 6,
    },
    {
      id: 7,
      title: t.fertilizerCalculator,
      description: t.fertilizerCalculatorDesc,
      icon: TrendingUp,
      path: "/fertilizer-calculator",
      step: 7,
    },
    {
      id: 8,
      title: t.waterQuality,
      description: t.waterQualityDesc,
      icon: Droplets,
      path: "/water-quality",
      step: 8,
    },
    {
      id: 9,
      title: t.costCalculator,
      description: t.costCalculatorDesc,
      icon: DollarSign,
      path: "/cost-calculator",
      step: 9,
    },
    {
      id: 10,
      title: t.reportGeneration,
      description: t.reportGenerationDesc,
      icon: FileText,
      path: "/reports",
      step: 10,
    },
    {
      id: 11,
      title: t.fishAdvice,
      description: t.fishAdviceDesc,
      icon: MessageSquare,
      path: "/fish-advice",
      step: 11,
    },
    {
      id: 12,
      title: language === "bn" ? "খাদ্য ফর্মুলা" : "Feed Formula",
      description: language === "bn" ? "নিজের হাতে সুষম মাছের খাদ্য তৈরির ফর্মুলা ক্যালকুলেটর" : "Create custom balanced fish feed formula",
      icon: FlaskConical,
      path: "/feed-formula",
      step: 12,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header Ad */}
      <AdUnit position="header" className="py-2 container" />
      
      <main className="container py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t.allModules}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.integratedModulesDesc}
            </p>
          </div>

          {/* Modules Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <>
                <ModuleCard
                  key={module.id}
                  title={module.title}
                  description={module.description}
                  icon={module.icon}
                  path={module.path}
                  isActive={true}
                />
                {/* Show ad after every 6th module */}
                {(index + 1) % 6 === 0 && index < modules.length - 1 && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <AdUnit position="between-modules" className="py-2" />
                  </div>
                )}
              </>
            ))}
          </div>

          {/* Progress Card */}
          <Card className="bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                {t.yourProgress}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {pondData ? (
                  <Alert className="border-primary/50 bg-primary/5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      <strong>{t.pondInfoSaved}:</strong>
                      <div className="text-sm mt-1 space-y-1">
                        <p>{t.area}: {pondData.area.toFixed(2)} {t.squareMeter}</p>
                        <p>{t.volume}: {pondData.volume.toFixed(2)} {t.cubicMeter}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {t.pondNotMeasured}
                    </AlertDescription>
                  </Alert>
                )}

                {fishStockingData ? (
                  <Alert className="border-primary/50 bg-primary/5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      <strong>{t.fishStockInfoSaved}:</strong>
                      <div className="text-sm mt-1">
                        <p>{t.totalFish}: {fishStockingData.totalFish}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {t.fishStockNotCalculated}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workflow Guide */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-primary" />
                {t.workflowGuide}
              </CardTitle>
              <CardDescription>
                {t.workflowGuideDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  <span>{t.step1Desc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  <span>{t.step2Desc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted-foreground text-primary-foreground text-xs font-bold">3</span>
                  <span>{t.step3Desc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted-foreground text-primary-foreground text-xs font-bold">4</span>
                  <span>{t.step4Desc}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted-foreground text-primary-foreground text-xs font-bold">5</span>
                  <span>{t.step5Desc}</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Quick Start */}
          <Card className="bg-gradient-primary text-white shadow-large">
            <CardContent className="py-8 text-center space-y-4">
              <h3 className="text-2xl font-bold">{t.quickStart}</h3>
              <p className="text-white/90">
                {t.quickStartDesc}
              </p>
              <Link to="/pond-calculator">
                <Button size="lg" variant="secondary" className="shadow-large">
                  <Calculator className="mr-2 h-5 w-5" />
                  {t.startPondMeasurement}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Footer Ad */}
      <AdUnit position="footer" className="py-4 container" />
      
      <Footer />
    </div>
  );
};

export default Modules;
