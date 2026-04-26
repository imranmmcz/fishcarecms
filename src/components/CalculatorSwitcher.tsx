import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Calculator,
  Droplets,
  Fish,
  Scale,
  Pill,
  TrendingUp,
  FileText,
  DollarSign,
  Package,
  MessageSquare,
  FlaskConical,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleEntry = {
  path: string;
  icon: LucideIcon;
  titleKey: keyof ReturnType<typeof useLanguage>["t"] | null;
  fallbackEn: string;
  fallbackBn: string;
};

const MODULES: ModuleEntry[] = [
  { path: "/pond-calculator", icon: Droplets, titleKey: "pondCalculator", fallbackEn: "Pond Calculator", fallbackBn: "পুকুর ক্যালকুলেটর" },
  { path: "/stocking-density", icon: Fish, titleKey: "stockingDensity", fallbackEn: "Stocking Density", fallbackBn: "মজুদ ঘনত্ব" },
  { path: "/fish-stocking", icon: Fish, titleKey: "fishStocking", fallbackEn: "Fish Stocking", fallbackBn: "মাছ মজুদ" },
  { path: "/biomass-calculator", icon: Scale, titleKey: "biomassCalculator", fallbackEn: "Biomass Calculator", fallbackBn: "বায়োমাস ক্যালকুলেটর" },
  { path: "/feed-management", icon: Package, titleKey: "feedManagement", fallbackEn: "Feed Management", fallbackBn: "খাদ্য ব্যবস্থাপনা" },
  { path: "/medicine-application", icon: Pill, titleKey: "medicineApplication", fallbackEn: "Medicine Application", fallbackBn: "ওষুধ প্রয়োগ" },
  { path: "/fertilizer-calculator", icon: TrendingUp, titleKey: "fertilizerCalculator", fallbackEn: "Fertilizer Calculator", fallbackBn: "সার ক্যালকুলেটর" },
  { path: "/water-quality", icon: Droplets, titleKey: "waterQuality", fallbackEn: "Water Quality", fallbackBn: "পানির গুণমান" },
  { path: "/cost-calculator", icon: DollarSign, titleKey: "costCalculator", fallbackEn: "Cost Calculator", fallbackBn: "খরচ ক্যালকুলেটর" },
  { path: "/reports", icon: FileText, titleKey: "reportGeneration", fallbackEn: "Reports", fallbackBn: "রিপোর্ট" },
  { path: "/fish-advice", icon: MessageSquare, titleKey: "fishAdvice", fallbackEn: "Fish Advice", fallbackBn: "মাছের পরামর্শ" },
  { path: "/feed-formula", icon: FlaskConical, titleKey: null, fallbackEn: "Feed Formula", fallbackBn: "খাদ্য ফর্মুলা" },
  { path: "/smart-feed-calculator", icon: Sparkles, titleKey: null, fallbackEn: "Smart Feed", fallbackBn: "স্মার্ট ফিড" },
];

export function CalculatorSwitcher() {
  const location = useLocation();
  const { t, language } = useLanguage();

  const getTitle = (m: ModuleEntry) => {
    if (m.titleKey && (t as any)[m.titleKey]) return (t as any)[m.titleKey] as string;
    return language === "bn" ? m.fallbackBn : m.fallbackEn;
  };

  const active = MODULES.find((m) => m.path === location.pathname) ?? null;
  const others = MODULES.filter((m) => m.path !== location.pathname);

  return (
    <section
      aria-label={language === "bn" ? "অন্যান্য ক্যালকুলেটর" : "Other calculators"}
      className="container py-3"
    >
      <div className="rounded-xl border border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50 p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Calculator className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            {language === "bn" ? "অন্যান্য মডিউল" : "Other Modules"}
          </h2>
          <span className="text-xs text-muted-foreground">
            {language === "bn" ? "(ক্লিক করে সুইচ করুন)" : "(click to switch)"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {active && (
            <span
              aria-current="page"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full",
                "border-2 border-primary bg-primary text-primary-foreground",
                "px-3 py-1.5 text-xs font-semibold shadow-sm",
                "ring-2 ring-primary/30"
              )}
            >
              <active.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{getTitle(active)}</span>
              <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                {language === "bn" ? "চালু" : "Active"}
              </span>
            </span>
          )}
          {others.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.path}
                to={m.path}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-border bg-background",
                  "px-3 py-1.5 text-xs font-medium text-foreground",
                  "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                  "transition-colors shadow-sm"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{getTitle(m)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CalculatorSwitcher;