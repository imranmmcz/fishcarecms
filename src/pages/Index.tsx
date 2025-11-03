import { Header } from "@/components/Header";
import { ModuleCard } from "@/components/ModuleCard";
import { Button } from "@/components/ui/button";
import { Calculator, Droplets, Fish, Scale, Pill, TrendingUp, FileText, DollarSign, Package } from "lucide-react";
import { Link } from "react-router-dom";

const modules = [
  {
    id: 1,
    title: "পুকুরের পরিমাপ",
    description: "পুকুরের জায়গা এবং পানির আয়তন সঠিকভাবে নির্ণয় করুন",
    icon: Droplets,
    path: "/pond-calculator",
    isActive: true,
  },
  {
    id: 2,
    title: "মাছের মজুদ ঘনত্ব",
    description: "পুকুরে কতটি পোনা মজুদ করবেন তা হিসাব করুন",
    icon: Fish,
    path: "/fish-stocking",
    isActive: true,
  },
  {
    id: 3,
    title: "বায়োমাস গণনা",
    description: "মাছের মোট ওজন এবং বৃদ্ধির হার নির্ণয় করুন",
    icon: Scale,
    path: "/biomass-calculator",
    isActive: true,
  },
  {
    id: 4,
    title: "খাদ্য ব্যবস্থাপনা",
    description: "প্রতিদিনের খাদ্যের পরিমাণ এবং FCR হিসাব করুন",
    icon: Package,
    path: "/feed-management",
    isActive: true,
  },
  {
    id: 5,
    title: "ঔষধ প্রয়োগ",
    description: "রোগ প্রতিরোধ এবং চিকিৎসার জন্য ঔষধের মাত্রা নির্ণয় করুন",
    icon: Pill,
    path: "/medicine-application",
    isActive: true,
  },
  {
    id: 6,
    title: "সার প্রয়োগ",
    description: "পুকুরের উৎপাদনশীলতা বাড়াতে সঠিক সার প্রয়োগ করুন",
    icon: TrendingUp,
    path: "/fertilizer-calculator",
    isActive: true,
  },
  {
    id: 7,
    title: "পানির গুণমান",
    description: "পানির pH, অক্সিজেন এবং অন্যান্য পরামিতি পরীক্ষা করুন",
    icon: Droplets,
    path: "/water-quality",
    isActive: true,
  },
  {
    id: 8,
    title: "খরচ হিসাব",
    description: "মাছ চাষের সম্পূর্ণ খরচ এবং লাভ-ক্ষতির হিসাব করুন",
    icon: DollarSign,
    path: "/cost-calculator",
    isActive: true,
  },
  {
    id: 9,
    title: "রিপোর্ট তৈরি",
    description: "খামারের সকল তথ্য একসাথে রিপোর্ট আকারে দেখুন",
    icon: FileText,
    path: "/reports",
    isActive: false,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 text-white">
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-block rounded-full bg-white/20 px-4 py-1 text-sm backdrop-blur-sm">
              বাংলাদেশের মৎস্য খাতের জন্য
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              বৈজ্ঞানিক মাছ চাষ ব্যবস্থাপনা সিস্টেম
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              আধুনিক প্রযুক্তি ব্যবহার করে আপনার মাছ চাষকে আরও লাভজনক এবং টেকসই করুন। 
              সম্পূর্ণ বৈজ্ঞানিক পদ্ধতিতে পুকুর থেকে বাজার পর্যন্ত প্রতিটি ধাপে সঠিক সিদ্ধান্ত নিন।
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/pond-calculator">
                <Button size="lg" variant="secondary" className="shadow-large">
                  <Calculator className="mr-2 h-5 w-5" />
                  এখনই শুরু করুন
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                সম্পর্কে জানুন
              </Button>
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
              সমন্বিত ক্যালকুলেটর মডিউল
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              প্রতিটি মডিউল পরস্পর সংযুক্ত এবং একে অপরের সাথে ডেটা শেয়ার করে, 
              যা আপনাকে সম্পূর্ণ খামার ব্যবস্থাপনায় সহায়তা করে
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

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              কেন এই সিস্টেম ব্যবহার করবেন?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "বৈজ্ঞানিক পদ্ধতি",
                  description: "গবেষণা-ভিত্তিক ফর্মুলা এবং আন্তর্জাতিক মান অনুসরণ করে তৈরি",
                },
                {
                  title: "সম্পদের সর্বোত্তম ব্যবহার",
                  description: "খাদ্য, ঔষধ এবং সারের অপচয় রোধ করে খরচ কমান",
                },
                {
                  title: "উৎপাদনশীলতা বৃদ্ধি",
                  description: "সঠিক ব্যবস্থাপনায় প্রতি হেক্টরে বেশি মাছ উৎপাদন করুন",
                },
                {
                  title: "সহজ ব্যবহার",
                  description: "বাংলা ভাষায় সহজবোধ্য ইন্টারফেস এবং স্পষ্ট নির্দেশনা",
                },
              ].map((benefit, index) => (
                <div key={index} className="bg-gradient-card rounded-lg p-6 shadow-soft">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary text-white">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            আপনার মাছ চাষ ব্যবস্থাপনা শুরু করুন
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            পুকুরের পরিমাপ থেকে শুরু করে সম্পূর্ণ চক্র সম্পন্ন করুন
          </p>
          <Link to="/pond-calculator">
            <Button size="lg" variant="secondary" className="shadow-large">
              <Calculator className="mr-2 h-5 w-5" />
              পুকুর পরিমাপ শুরু করুন
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
