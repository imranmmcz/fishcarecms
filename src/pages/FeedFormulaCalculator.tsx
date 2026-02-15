import { useState } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskConical, Plus, Trash2, RotateCcw, Download, Lightbulb, AlertTriangle, CheckCircle2, Info, Beaker } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdUnit from "@/components/AdUnit";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Ingredient {
  id: string;
  name: string;
  nameBn: string;
  percentage: number;
  protein: number;
  fat: number;
  fiber: number;
  moisture: number;
  ash: number;
  costPerKg: number;
  category: string;
}

const availableIngredients: Omit<Ingredient, "id" | "percentage">[] = [
  // Protein Sources
  { name: "Fish Meal", nameBn: "ফিশ মিল", protein: 60, fat: 10, fiber: 1, moisture: 8, ash: 20, costPerKg: 120, category: "protein" },
  { name: "Soybean Meal", nameBn: "সয়াবিন খৈল", protein: 44, fat: 2, fiber: 7, moisture: 12, ash: 6, costPerKg: 55, category: "protein" },
  { name: "Mustard Oil Cake", nameBn: "সরিষার খৈল", protein: 35, fat: 8, fiber: 12, moisture: 10, ash: 8, costPerKg: 40, category: "protein" },
  { name: "Groundnut Cake", nameBn: "বাদামের খৈল", protein: 42, fat: 6, fiber: 5, moisture: 10, ash: 5, costPerKg: 50, category: "protein" },
  { name: "Sesame Meal", nameBn: "তিলের খৈল", protein: 38, fat: 7, fiber: 6, moisture: 9, ash: 10, costPerKg: 45, category: "protein" },
  { name: "Blood Meal", nameBn: "ব্লাড মিল", protein: 80, fat: 1.5, fiber: 1, moisture: 10, ash: 5, costPerKg: 90, category: "protein" },
  { name: "Meat & Bone Meal", nameBn: "মিট ও বোন মিল", protein: 50, fat: 10, fiber: 2, moisture: 8, ash: 28, costPerKg: 65, category: "protein" },
  { name: "Shrimp Meal", nameBn: "চিংড়ির গুঁড়া", protein: 45, fat: 3, fiber: 8, moisture: 10, ash: 30, costPerKg: 80, category: "protein" },
  { name: "Silkworm Pupae", nameBn: "সিল্কওয়ার্ম পিউপি", protein: 55, fat: 25, fiber: 2, moisture: 8, ash: 5, costPerKg: 100, category: "protein" },

  // Energy Sources
  { name: "Rice Bran", nameBn: "চালের কুঁড়া", protein: 12, fat: 14, fiber: 12, moisture: 10, ash: 10, costPerKg: 25, category: "energy" },
  { name: "Wheat Bran", nameBn: "গমের ভুসি", protein: 15, fat: 4, fiber: 10, moisture: 12, ash: 6, costPerKg: 22, category: "energy" },
  { name: "Wheat Flour", nameBn: "গমের আটা", protein: 12, fat: 2, fiber: 2, moisture: 12, ash: 1.5, costPerKg: 35, category: "energy" },
  { name: "Corn/Maize", nameBn: "ভুট্টা গুঁড়া", protein: 9, fat: 4, fiber: 2, moisture: 12, ash: 1.5, costPerKg: 30, category: "energy" },
  { name: "Broken Rice", nameBn: "চাউলের গুঁড়া", protein: 8, fat: 1, fiber: 1, moisture: 12, ash: 1, costPerKg: 28, category: "energy" },
  { name: "Molasses", nameBn: "চিটাগুড়", protein: 3, fat: 0.5, fiber: 0, moisture: 25, ash: 10, costPerKg: 15, category: "energy" },

  // Additives
  { name: "Vitamin Premix", nameBn: "ভিটামিন প্রিমিক্স", protein: 0, fat: 0, fiber: 0, moisture: 5, ash: 90, costPerKg: 500, category: "additive" },
  { name: "Mineral Premix", nameBn: "মিনারেল প্রিমিক্স", protein: 0, fat: 0, fiber: 0, moisture: 5, ash: 95, costPerKg: 400, category: "additive" },
  { name: "Salt", nameBn: "লবণ", protein: 0, fat: 0, fiber: 0, moisture: 0.5, ash: 99, costPerKg: 20, category: "additive" },
  { name: "Binding Agent", nameBn: "বাইন্ডার", protein: 0, fat: 0, fiber: 0, moisture: 10, ash: 2, costPerKg: 150, category: "additive" },
  { name: "Fish Oil", nameBn: "ফিশ অয়েল", protein: 0, fat: 99, fiber: 0, moisture: 0.5, ash: 0, costPerKg: 200, category: "additive" },
];

const fishTypePresets = [
  {
    name: "তেলাপিয়া (স্টার্টার)",
    protein: { min: 35, max: 40 },
    fat: { min: 6, max: 10 },
    fiber: { max: 8 },
    ingredients: ["Fish Meal", "Soybean Meal", "Rice Bran", "Wheat Flour", "Vitamin Premix", "Mineral Premix"],
    percentages: [15, 30, 20, 30, 2, 3],
  },
  {
    name: "তেলাপিয়া (গ্রোয়ার)",
    protein: { min: 28, max: 32 },
    fat: { min: 5, max: 8 },
    fiber: { max: 10 },
    ingredients: ["Fish Meal", "Soybean Meal", "Rice Bran", "Wheat Bran", "Corn/Maize", "Vitamin Premix"],
    percentages: [10, 25, 25, 20, 17, 3],
  },
  {
    name: "পাঙ্গাস",
    protein: { min: 25, max: 30 },
    fat: { min: 5, max: 8 },
    fiber: { max: 12 },
    ingredients: ["Soybean Meal", "Mustard Oil Cake", "Rice Bran", "Wheat Bran", "Fish Meal", "Vitamin Premix"],
    percentages: [25, 15, 25, 20, 12, 3],
  },
  {
    name: "রুই/কাতলা (কার্প)",
    protein: { min: 22, max: 28 },
    fat: { min: 4, max: 7 },
    fiber: { max: 12 },
    ingredients: ["Mustard Oil Cake", "Rice Bran", "Wheat Bran", "Soybean Meal", "Fish Meal", "Mineral Premix"],
    percentages: [20, 30, 20, 15, 10, 5],
  },
  {
    name: "শিং/মাগুর (ক্যাটফিশ)",
    protein: { min: 32, max: 40 },
    fat: { min: 6, max: 10 },
    fiber: { max: 8 },
    ingredients: ["Fish Meal", "Soybean Meal", "Blood Meal", "Wheat Flour", "Fish Oil", "Vitamin Premix"],
    percentages: [25, 25, 10, 30, 5, 5],
  },
  {
    name: "চিংড়ি (প্রন)",
    protein: { min: 35, max: 42 },
    fat: { min: 5, max: 8 },
    fiber: { max: 6 },
    ingredients: ["Fish Meal", "Shrimp Meal", "Soybean Meal", "Wheat Flour", "Fish Oil", "Vitamin Premix", "Binding Agent"],
    percentages: [20, 15, 20, 30, 5, 3, 7],
  },
];

export default function FeedFormulaCalculator() {
  const { language } = useLanguage();
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [totalBatch, setTotalBatch] = useState("100");
  const [selectedPreset, setSelectedPreset] = useState("");

  const addIngredient = (ingredientName: string) => {
    const ingredient = availableIngredients.find((i) => i.name === ingredientName);
    if (!ingredient) return;
    if (selectedIngredients.find((i) => i.name === ingredientName)) {
      toast.error(language === "bn" ? "এই উপাদান ইতিমধ্যে যোগ করা হয়েছে" : "This ingredient is already added");
      return;
    }
    setSelectedIngredients([
      ...selectedIngredients,
      { ...ingredient, id: Date.now().toString(), percentage: 0 },
    ]);
  };

  const updatePercentage = (id: string, value: number) => {
    setSelectedIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, percentage: value } : i))
    );
  };

  const removeIngredient = (id: string) => {
    setSelectedIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const totalPercentage = selectedIngredients.reduce((sum, i) => sum + i.percentage, 0);

  const formulaAnalysis = {
    protein: selectedIngredients.reduce((sum, i) => sum + (i.protein * i.percentage) / 100, 0),
    fat: selectedIngredients.reduce((sum, i) => sum + (i.fat * i.percentage) / 100, 0),
    fiber: selectedIngredients.reduce((sum, i) => sum + (i.fiber * i.percentage) / 100, 0),
    moisture: selectedIngredients.reduce((sum, i) => sum + (i.moisture * i.percentage) / 100, 0),
    ash: selectedIngredients.reduce((sum, i) => sum + (i.ash * i.percentage) / 100, 0),
    costPerKg: selectedIngredients.reduce((sum, i) => sum + (i.costPerKg * i.percentage) / 100, 0),
  };

  const batchWeight = parseFloat(totalBatch) || 100;
  const totalCost = formulaAnalysis.costPerKg * batchWeight;

  const loadPreset = (presetName: string) => {
    const preset = fishTypePresets.find((p) => p.name === presetName);
    if (!preset) return;
    const newIngredients: Ingredient[] = preset.ingredients.map((name, idx) => {
      const base = availableIngredients.find((i) => i.name === name)!;
      return { ...base, id: Date.now().toString() + idx, percentage: preset.percentages[idx] };
    });
    setSelectedIngredients(newIngredients);
    setSelectedPreset(presetName);
    toast.success(language === "bn" ? `${presetName} ফর্মুলা লোড করা হয়েছে` : `${presetName} formula loaded`);
  };

  const resetAll = () => {
    setSelectedIngredients([]);
    setSelectedPreset("");
    toast.success(language === "bn" ? "ফর্মুলা রিসেট করা হয়েছে" : "Formula reset");
  };

  const getProteinStatus = () => {
    if (formulaAnalysis.protein < 20) return { color: "text-red-500", label: language === "bn" ? "খুব কম" : "Too Low", icon: AlertTriangle };
    if (formulaAnalysis.protein < 25) return { color: "text-yellow-500", label: language === "bn" ? "কম" : "Low", icon: AlertTriangle };
    if (formulaAnalysis.protein <= 40) return { color: "text-green-500", label: language === "bn" ? "ভালো" : "Good", icon: CheckCircle2 };
    return { color: "text-orange-500", label: language === "bn" ? "বেশি" : "High", icon: AlertTriangle };
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, { bn: string; en: string }> = {
      protein: { bn: "🥩 প্রোটিন উৎস", en: "🥩 Protein Sources" },
      energy: { bn: "🌾 শক্তি উৎস", en: "🌾 Energy Sources" },
      additive: { bn: "💊 সংযোজন", en: "💊 Additives" },
    };
    return language === "bn" ? labels[cat]?.bn : labels[cat]?.en;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <div className="container mx-auto px-4 py-4">
        <AdUnit position="header" className="mb-4" />
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 shadow-lg">
                <FlaskConical className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  {language === "bn" ? "মাছের খাদ্য ফর্মুলা ক্যালকুলেটর" : "Fish Feed Formula Calculator"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {language === "bn"
                    ? "নিজের হাতে সুষম মাছের খাদ্য তৈরি করুন — উপাদান বাছাই করুন, পুষ্টিমান বিশ্লেষণ দেখুন"
                    : "Create balanced fish feed — select ingredients and analyze nutrition"}
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="formula" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="formula">
                <Beaker className="h-4 w-4 mr-2" />
                {language === "bn" ? "ফর্মুলা তৈরি" : "Build Formula"}
              </TabsTrigger>
              <TabsTrigger value="presets">
                <Lightbulb className="h-4 w-4 mr-2" />
                {language === "bn" ? "রেডি ফর্মুলা" : "Ready Formulas"}
              </TabsTrigger>
            </TabsList>

            {/* Presets Tab */}
            <TabsContent value="presets" className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fishTypePresets.map((preset) => (
                  <Card
                    key={preset.name}
                    className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                    onClick={() => {
                      loadPreset(preset.name);
                      // Switch to formula tab
                      const formulaTab = document.querySelector('[data-value="formula"]') as HTMLElement;
                      formulaTab?.click();
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{preset.name}</CardTitle>
                      <CardDescription>
                        {language === "bn" ? "প্রোটিন" : "Protein"}: {preset.protein.min}-{preset.protein.max}% |{" "}
                        {language === "bn" ? "ফ্যাট" : "Fat"}: {preset.fat.min}-{preset.fat.max}%
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {preset.ingredients.map((ing, idx) => {
                          const base = availableIngredients.find((i) => i.name === ing);
                          return (
                            <Badge key={idx} variant="secondary" className="text-[10px]">
                              {language === "bn" ? base?.nameBn : ing} ({preset.percentages[idx]}%)
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Formula Builder Tab */}
            <TabsContent value="formula" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Ingredient Selection */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Add Ingredient */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        {language === "bn" ? "উপাদান যোগ করুন" : "Add Ingredient"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {["protein", "energy", "additive"].map((category) => (
                        <div key={category}>
                          <p className="text-sm font-semibold mb-2">{getCategoryLabel(category)}</p>
                          <div className="flex flex-wrap gap-2">
                            {availableIngredients
                              .filter((i) => i.category === category)
                              .map((ingredient) => {
                                const isAdded = selectedIngredients.some((s) => s.name === ingredient.name);
                                return (
                                  <Button
                                    key={ingredient.name}
                                    size="sm"
                                    variant={isAdded ? "default" : "outline"}
                                    className="text-xs h-8"
                                    onClick={() => !isAdded && addIngredient(ingredient.name)}
                                    disabled={isAdded}
                                  >
                                    {language === "bn" ? ingredient.nameBn : ingredient.name}
                                    {isAdded && <CheckCircle2 className="h-3 w-3 ml-1" />}
                                  </Button>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Selected Ingredients with Percentages */}
                  {selectedIngredients.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {language === "bn" ? "ফর্মুলা মিশ্রণ" : "Formula Mix"}
                          </CardTitle>
                          <Button variant="ghost" size="sm" onClick={resetAll}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            {language === "bn" ? "রিসেট" : "Reset"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedIngredients.map((ingredient) => (
                          <div
                            key={ingredient.id}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {language === "bn" ? ingredient.nameBn : ingredient.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                P:{ingredient.protein}% F:{ingredient.fat}% | ৳{ingredient.costPerKg}/kg
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={ingredient.percentage || ""}
                                onChange={(e) => updatePercentage(ingredient.id, parseFloat(e.target.value) || 0)}
                                className="w-20 h-8 text-center text-sm"
                                placeholder="%"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removeIngredient(ingredient.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Total Percentage Bar */}
                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {language === "bn" ? "মোট শতাংশ" : "Total Percentage"}
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                totalPercentage === 100
                                  ? "text-green-500"
                                  : totalPercentage > 100
                                  ? "text-red-500"
                                  : "text-yellow-500"
                              }`}
                            >
                              {totalPercentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(totalPercentage, 100)}
                            className="h-3"
                          />
                          {totalPercentage !== 100 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {totalPercentage < 100
                                ? language === "bn"
                                  ? `আরো ${(100 - totalPercentage).toFixed(1)}% যোগ করুন`
                                  : `Add ${(100 - totalPercentage).toFixed(1)}% more`
                                : language === "bn"
                                ? `${(totalPercentage - 100).toFixed(1)}% বেশি হয়েছে`
                                : `${(totalPercentage - 100).toFixed(1)}% over`}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Batch Calculator */}
                  {selectedIngredients.length > 0 && totalPercentage === 100 && (
                    <Card className="border-primary/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">
                          {language === "bn" ? "ব্যাচ হিসাব" : "Batch Calculation"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Label className="whitespace-nowrap">
                            {language === "bn" ? "মোট ব্যাচ ওজন (কেজি)" : "Total Batch (kg)"}
                          </Label>
                          <Input
                            type="number"
                            value={totalBatch}
                            onChange={(e) => setTotalBatch(e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">{language === "bn" ? "উপাদান" : "Ingredient"}</th>
                                <th className="text-right py-2">%</th>
                                <th className="text-right py-2">{language === "bn" ? "পরিমাণ (কেজি)" : "Amount (kg)"}</th>
                                <th className="text-right py-2">{language === "bn" ? "খরচ (৳)" : "Cost (৳)"}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedIngredients.map((ing) => (
                                <tr key={ing.id} className="border-b border-muted">
                                  <td className="py-2">{language === "bn" ? ing.nameBn : ing.name}</td>
                                  <td className="text-right">{ing.percentage}%</td>
                                  <td className="text-right font-medium">
                                    {((ing.percentage / 100) * batchWeight).toFixed(2)}
                                  </td>
                                  <td className="text-right">
                                    ৳{((ing.percentage / 100) * batchWeight * ing.costPerKg).toFixed(0)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="font-bold">
                                <td className="py-2">{language === "bn" ? "মোট" : "Total"}</td>
                                <td className="text-right">100%</td>
                                <td className="text-right">{batchWeight.toFixed(2)}</td>
                                <td className="text-right text-primary">৳{totalCost.toFixed(0)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {language === "bn" ? "প্রতি কেজি খরচ" : "Cost per kg"}: <strong className="text-primary">৳{formulaAnalysis.costPerKg.toFixed(2)}</strong>
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right: Nutrition Analysis Panel */}
                <div className="space-y-4">
                  <Card className="sticky top-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-primary" />
                        {language === "bn" ? "পুষ্টিমান বিশ্লেষণ" : "Nutrition Analysis"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedIngredients.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Beaker className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">
                            {language === "bn"
                              ? "উপাদান যোগ করুন বা রেডি ফর্মুলা ব্যবহার করুন"
                              : "Add ingredients or use a ready formula"}
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Protein */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{language === "bn" ? "প্রোটিন" : "Protein"}</span>
                              <div className="flex items-center gap-1">
                                {(() => {
                                  const status = getProteinStatus();
                                  return (
                                    <>
                                      <status.icon className={`h-3 w-3 ${status.color}`} />
                                      <span className={`text-xs ${status.color}`}>{status.label}</span>
                                    </>
                                  );
                                })()}
                                <span className="text-sm font-bold ml-1">{formulaAnalysis.protein.toFixed(1)}%</span>
                              </div>
                            </div>
                            <Progress value={Math.min((formulaAnalysis.protein / 50) * 100, 100)} className="h-2" />
                          </div>

                          {/* Fat */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{language === "bn" ? "ফ্যাট/তেল" : "Fat/Oil"}</span>
                              <span className="text-sm font-bold">{formulaAnalysis.fat.toFixed(1)}%</span>
                            </div>
                            <Progress value={Math.min((formulaAnalysis.fat / 20) * 100, 100)} className="h-2" />
                          </div>

                          {/* Fiber */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{language === "bn" ? "ফাইবার" : "Fiber"}</span>
                              <span className="text-sm font-bold">{formulaAnalysis.fiber.toFixed(1)}%</span>
                            </div>
                            <Progress value={Math.min((formulaAnalysis.fiber / 15) * 100, 100)} className="h-2" />
                          </div>

                          {/* Moisture */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{language === "bn" ? "আর্দ্রতা" : "Moisture"}</span>
                              <span className="text-sm font-bold">{formulaAnalysis.moisture.toFixed(1)}%</span>
                            </div>
                            <Progress value={Math.min((formulaAnalysis.moisture / 15) * 100, 100)} className="h-2" />
                          </div>

                          {/* Ash */}
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{language === "bn" ? "অ্যাশ/খনিজ" : "Ash/Mineral"}</span>
                              <span className="text-sm font-bold">{formulaAnalysis.ash.toFixed(1)}%</span>
                            </div>
                            <Progress value={Math.min((formulaAnalysis.ash / 20) * 100, 100)} className="h-2" />
                          </div>

                          {/* Cost */}
                          <div className="pt-3 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{language === "bn" ? "খরচ/কেজি" : "Cost/kg"}</span>
                              <span className="text-lg font-bold text-primary">
                                ৳{formulaAnalysis.costPerKg.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Warnings */}
                          {totalPercentage !== 100 && (
                            <Alert variant="destructive" className="mt-3">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                {language === "bn"
                                  ? "মোট শতাংশ ১০০% হতে হবে"
                                  : "Total percentage must be 100%"}
                              </AlertDescription>
                            </Alert>
                          )}

                          {totalPercentage === 100 && formulaAnalysis.protein >= 22 && formulaAnalysis.protein <= 42 && (
                            <Alert className="mt-3 border-green-500/50 bg-green-500/5">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <AlertDescription className="text-xs">
                                {language === "bn"
                                  ? "ফর্মুলা সুষম আছে! এটি ব্যবহারযোগ্য।"
                                  : "Formula is balanced! Ready to use."}
                              </AlertDescription>
                            </Alert>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tips Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        {language === "bn" ? "গুরুত্বপূর্ণ টিপস" : "Important Tips"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {language === "bn"
                            ? "সকল উপাদান ভালোভাবে মিশিয়ে পেলেট মেশিনে দিন"
                            : "Mix all ingredients well before pelleting"}
                        </li>
                        <li className="flex items-start gap-2">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {language === "bn"
                            ? "ফিড শুকনো এবং ঠাণ্ডা জায়গায় সংরক্ষণ করুন"
                            : "Store feed in a cool, dry place"}
                        </li>
                        <li className="flex items-start gap-2">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {language === "bn"
                            ? "ভিটামিন প্রিমিক্স ২-৩% এর বেশি দেবেন না"
                            : "Don't exceed 2-3% vitamin premix"}
                        </li>
                        <li className="flex items-start gap-2">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {language === "bn"
                            ? "তৈরি খাবার ৩০ দিনের মধ্যে ব্যবহার করুন"
                            : "Use prepared feed within 30 days"}
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8">
            <AdUnit position="footer" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
