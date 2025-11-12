import { Header } from "@/components/Header";
import { ModuleCard } from "@/components/ModuleCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, Droplets, Fish, Scale, Pill, TrendingUp, FileText, DollarSign, Package, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { useFarming } from "@/contexts/FarmingContext";
import { Link } from "react-router-dom";

const modules = [
  {
    id: 1,
    title: "পুকুরের পরিমাপ",
    description: "পুকুরের জায়গা এবং পানির আয়তন সঠিকভাবে নির্ণয় করুন",
    icon: Droplets,
    path: "/pond-calculator",
    step: 1,
  },
  {
    id: 2,
    title: "স্টকিং ডেনসিটি",
    description: "সম্পূর্ণ খরচ ও উপকরণ সহ মাছ মজুদ পরিকল্পনা করুন",
    icon: Fish,
    path: "/stocking-density",
    step: 2,
  },
  {
    id: 3,
    title: "মাছের মজুদ ঘনত্ব",
    description: "পুকুরে কতটি পোনা মজুদ করবেন তা হিসাব করুন",
    icon: Fish,
    path: "/fish-stocking",
    step: 3,
  },
  {
    id: 4,
    title: "বায়োমাস গণনা",
    description: "মাছের মোট ওজন এবং বৃদ্ধির হার নির্ণয় করুন",
    icon: Scale,
    path: "/biomass-calculator",
    step: 4,
  },
  {
    id: 5,
    title: "খাদ্য ব্যবস্থাপনা",
    description: "প্রতিদিনের খাদ্যের পরিমাণ এবং FCR হিসাব করুন",
    icon: Package,
    path: "/feed-management",
    step: 5,
  },
  {
    id: 6,
    title: "ঔষধ প্রয়োগ",
    description: "রোগ প্রতিরোধ এবং চিকিৎসার জন্য ঔষধের মাত্রা নির্ণয় করুন",
    icon: Pill,
    path: "/medicine-application",
    step: 6,
  },
  {
    id: 7,
    title: "সার প্রয়োগ",
    description: "পুকুরের উৎপাদনশীলতা বাড়াতে সঠিক সার প্রয়োগ করুন",
    icon: TrendingUp,
    path: "/fertilizer-calculator",
    step: 7,
  },
  {
    id: 8,
    title: "পানির গুণমান",
    description: "পানির pH, অক্সিজেন এবং অন্যান্য পরামিতি পরীক্ষা করুন",
    icon: Droplets,
    path: "/water-quality",
    step: 8,
  },
  {
    id: 9,
    title: "খরচ হিসাব",
    description: "মাছ চাষের সম্পূর্ণ খরচ এবং লাভ-ক্ষতির হিসাব করুন",
    icon: DollarSign,
    path: "/cost-calculator",
    step: 9,
  },
  {
    id: 10,
    title: "রিপোর্ট তৈরি",
    description: "খামারের সকল তথ্য একসাথে রিপোর্ট আকারে দেখুন",
    icon: FileText,
    path: "/reports",
    step: 10,
  },
];

const Modules = () => {
  const { pondData, fishStockingData } = useFarming();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              সকল মডিউল
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              মাছ চাষের সম্পূর্ণ প্রক্রিয়া ধাপে ধাপে সম্পন্ন করুন। প্রতিটি মডিউলের ডেটা পরবর্তী মডিউলে স্বয়ংক্রিয়ভাবে যুক্ত হবে।
            </p>
          </div>

          {/* Progress Card */}
          <Card className="bg-gradient-card shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                আপনার অগ্রগতি
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {pondData ? (
                  <Alert className="border-primary/50 bg-primary/5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      <strong>পুকুরের তথ্য সংরক্ষিত:</strong>
                      <div className="text-sm mt-1 space-y-1">
                        <p>ক্ষেত্রফল: {pondData.area.toFixed(2)} বর্গ মিটার</p>
                        <p>আয়তন: {pondData.volume.toFixed(2)} ঘন মিটার</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      পুকুরের পরিমাপ এখনো করা হয়নি
                    </AlertDescription>
                  </Alert>
                )}

                {fishStockingData ? (
                  <Alert className="border-primary/50 bg-primary/5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      <strong>মাছের মজুদ তথ্য সংরক্ষিত:</strong>
                      <div className="text-sm mt-1">
                        <p>মোট মাছ: {fishStockingData.totalFish} টি</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      মাছের মজুদ ঘনত্ব হিসাব করা হয়নি
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
                কার্যপ্রবাহ গাইড
              </CardTitle>
              <CardDescription>
                সর্বোত্তম ফলাফলের জন্য এই ক্রমানুসারে মডিউলগুলি ব্যবহার করুন
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  <span><strong>পুকুরের পরিমাপ:</strong> প্রথমে পুকুরের আয়তন নির্ণয় করুন - এটি অন্যান্য সব হিসাবের ভিত্তি</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  <span><strong>মাছের মজুদ:</strong> পুকুরের আয়তন অনুযায়ী মাছের সংখ্যা নির্ধারণ করুন</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted-foreground text-primary-foreground text-xs font-bold">3</span>
                  <span><strong>বায়োমাস ও খাদ্য:</strong> মাছের ওজন এবং খাদ্যের পরিমাণ হিসাব করুন</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted-foreground text-primary-foreground text-xs font-bold">4</span>
                  <span><strong>ঔষধ ও সার:</strong> পুকুরের আয়তন ব্যবহার করে সঠিক মাত্রা নির্ণয় করুন</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted-foreground text-primary-foreground text-xs font-bold">5</span>
                  <span><strong>খরচ ও রিপোর্ট:</strong> শেষে সম্পূর্ণ খরচ এবং রিপোর্ট তৈরি করুন</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Modules Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                title={module.title}
                description={module.description}
                icon={module.icon}
                path={module.path}
                isActive={true}
              />
            ))}
          </div>

          {/* Quick Start */}
          <Card className="bg-gradient-primary text-white shadow-large">
            <CardContent className="py-8 text-center space-y-4">
              <h3 className="text-2xl font-bold">এখনই শুরু করুন</h3>
              <p className="text-white/90">
                পুকুরের পরিমাপ থেকে শুরু করে সম্পূর্ণ চক্র সম্পন্ন করুন
              </p>
              <Link to="/pond-calculator">
                <Button size="lg" variant="secondary" className="shadow-large">
                  <Calculator className="mr-2 h-5 w-5" />
                  পুকুর পরিমাপ শুরু করুন
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Modules;
