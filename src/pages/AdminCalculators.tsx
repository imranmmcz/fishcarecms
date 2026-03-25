import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { cn } from "@/lib/utils";
import {
  Droplets, Fish, Scale, Package, Pill, TrendingUp, DollarSign,
  FileText, MessageSquare, FlaskConical, Calculator, Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Lazy-style imports for each calculator page
import PondCalculator from "./PondCalculator";
import StockingDensity from "./StockingDensity";
import FishStocking from "./FishStocking";
import BiomassCalculator from "./BiomassCalculator";
import FeedManagement from "./FeedManagement";
import MedicineApplication from "./MedicineApplication";
import FertilizerCalculator from "./FertilizerCalculator";
import WaterQuality from "./WaterQuality";
import CostCalculator from "./CostCalculator";
import Reports from "./Reports";
import FishAdvice from "./FishAdvice";
import FeedFormulaCalculator from "./FeedFormulaCalculator";
import { CalculatorParamsEditor } from "@/components/admin/CalculatorParamsEditor";

interface ModuleTab {
  id: string;
  title: string;
  icon: LucideIcon;
  component: React.ComponentType;
}

const modules: ModuleTab[] = [
  { id: "pond", title: "পুকুর ক্যালকুলেটর", icon: Droplets, component: PondCalculator },
  { id: "stocking-density", title: "মজুদ ঘনত্ব", icon: Fish, component: StockingDensity },
  { id: "fish-stocking", title: "মাছ মজুদ", icon: Fish, component: FishStocking },
  { id: "biomass", title: "বায়োমাস", icon: Scale, component: BiomassCalculator },
  { id: "feed", title: "খাদ্য ব্যবস্থাপনা", icon: Package, component: FeedManagement },
  { id: "medicine", title: "ঔষধ প্রয়োগ", icon: Pill, component: MedicineApplication },
  { id: "fertilizer", title: "সার ক্যালকুলেটর", icon: TrendingUp, component: FertilizerCalculator },
  { id: "water", title: "পানির গুণাগুণ", icon: Droplets, component: WaterQuality },
  { id: "cost", title: "খরচ ক্যালকুলেটর", icon: DollarSign, component: CostCalculator },
  { id: "reports", title: "রিপোর্ট", icon: FileText, component: Reports },
  { id: "advice", title: "মাছ পরামর্শ", icon: MessageSquare, component: FishAdvice },
  { id: "formula", title: "খাদ্য ফর্মুলা", icon: FlaskConical, component: FeedFormulaCalculator },
];

export default function AdminCalculators() {
  const [activeTab, setActiveTab] = useState(modules[0].id);
  const [showFormulas, setShowFormulas] = useState(false);
  const [formulaModule, setFormulaModule] = useState<string | null>(null);

  const activeModule = modules.find((m) => m.id === activeTab);
  const ActiveComponent = activeModule?.component;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">সমন্বিত ক্যালকুলেটর মডিউল</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setShowFormulas(!showFormulas); setFormulaModule(null); }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                showFormulas && !formulaModule
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Settings2 className="h-4 w-4" />
              সকল সূত্র সেটিংস
            </button>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          {showFormulas
            ? `${formulaModule ? (modules.find(m => m.id === formulaModule)?.title || '') + ' — ' : ''}ক্যালকুলেটরের ধ্রুবক ও প্যারামিটার পরিবর্তন করুন।`
            : "সকল মৎস্য চাষ ক্যালকুলেটর মডিউল এখানে একত্রে পাবেন। যেকোনো ট্যাবে ক্লিক করে ব্যবহার করুন।"}
        </p>

        {showFormulas ? (
          <CalculatorParamsEditor moduleFilter={formulaModule || undefined} />
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b pb-3">
              {modules.map((mod) => (
                <div key={mod.id} className="flex items-center gap-0.5">
                  <button
                    onClick={() => setActiveTab(mod.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-l-lg text-sm font-medium transition-all",
                      activeTab === mod.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <mod.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{mod.title}</span>
                  </button>
                  <button
                    onClick={() => { setShowFormulas(true); setFormulaModule(mod.id); }}
                    title={`${mod.title} সূত্র সেটিংস`}
                    className={cn(
                      "flex items-center px-1.5 py-2 rounded-r-lg text-xs transition-all border-l",
                      activeTab === mod.id
                        ? "bg-primary/80 text-primary-foreground border-primary-foreground/20"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground border-border"
                    )}
                  >
                    <Settings2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Active Module Content */}
            <div className="rounded-xl border bg-card overflow-hidden admin-calc-embed">
              <style>{`
                .admin-calc-embed header,
                .admin-calc-embed footer,
                .admin-calc-embed .ad-container {
                  display: none !important;
                }
                .admin-calc-embed > .min-h-screen {
                  min-height: auto !important;
                  background: transparent !important;
                }
                .admin-calc-embed main {
                  padding-top: 0 !important;
                }
              `}</style>
              {ActiveComponent && <ActiveComponent />}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
