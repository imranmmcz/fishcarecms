import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Fish, Info } from "lucide-react";
import { useFarming } from "@/contexts/FarmingContext";
import { fishSpecies, mixedFarmingModels, costRates, FishSpecies } from "@/data/fishData";

interface FishStockDetail {
  name: string;
  quantity: number;
  fingerlingCost: number;
  expectedHarvest: number;
  expectedRevenue: number;
}

interface CostBreakdown {
  pondPreparation: {
    liming: number;
    fertilizer: number;
    rotenone: number;
    pondRepair: number;
    total: number;
  };
  fingerlings: {
    total: number;
    details: FishStockDetail[];
  };
  feed: {
    monthly: number;
    total: number;
  };
  labor: {
    feeding: number;
    maintenance: number;
    harvest: number;
    total: number;
  };
  medicine: {
    monthly: number;
    waterTreatment: number;
    total: number;
  };
  equipment: {
    netHauling: number;
    netPurchase: number;
    total: number;
  };
  miscellaneous: {
    transport: number;
    marketing: number;
    total: number;
  };
  totalInvestment: number;
  expectedRevenue: number;
  expectedProfit: number;
}

export default function StockingDensity() {
  const { pondData } = useFarming();
  const [pondSize, setPondSize] = useState(pondData?.area.toString() || "");
  const [pondDepth, setPondDepth] = useState(pondData?.depth.toString() || "5");
  const [farmingMethod, setFarmingMethod] = useState("");
  const [farmingIntensity, setFarmingIntensity] = useState<"semiIntensive" | "intensive">("semiIntensive");
  const [selectedFish, setSelectedFish] = useState("");
  const [selectedMixedModel, setSelectedMixedModel] = useState("");
  const [cultureDuration, setCultureDuration] = useState("6");
  const [result, setResult] = useState<CostBreakdown | null>(null);

  const calculateStocking = () => {
    if (!pondSize || !farmingMethod) return;

    const area = parseFloat(pondSize);
    const depth = parseFloat(pondDepth);
    const duration = parseInt(cultureDuration);
    let fishDetails: FishStockDetail[] = [];
    let totalFingerlingCost = 0;
    let totalFeedRequired = 0;
    let totalExpectedHarvest = 0;
    let totalExpectedRevenue = 0;

    if (farmingMethod === "single" && selectedFish) {
      const fish = fishSpecies.find(f => f.id === selectedFish);
      if (fish) {
        const density = fish.stockingDensity[farmingIntensity];
        const totalFish = Math.round(area * density);
        const survivedFish = Math.round(totalFish * (fish.survivalRate / 100));
        const expectedHarvest = survivedFish * fish.harvestWeight;
        const expectedRevenue = expectedHarvest * fish.marketPrice;
        const fingerlingCost = totalFish * fish.fingerlingPrice;
        const feedRequired = expectedHarvest * fish.fcr;

        totalFingerlingCost = fingerlingCost;
        totalFeedRequired = feedRequired;
        totalExpectedHarvest = expectedHarvest;
        totalExpectedRevenue = expectedRevenue;

        fishDetails.push({
          name: fish.nameBn,
          quantity: totalFish,
          fingerlingCost,
          expectedHarvest,
          expectedRevenue,
        });
      }
    } else if (farmingMethod === "mixed" && selectedMixedModel) {
      const model = mixedFarmingModels.find(m => m.id === selectedMixedModel);
      if (model) {
        const totalDensity = model.totalDensity * (farmingIntensity === "intensive" ? 1.5 : 1);
        
        model.fishRatios.forEach(ratio => {
          const fish = fishSpecies.find(f => f.id === ratio.fishId);
          if (fish) {
            const fishDensity = (totalDensity * ratio.percentage) / 100;
            const totalFish = Math.round(area * fishDensity);
            const survivedFish = Math.round(totalFish * (fish.survivalRate / 100));
            const expectedHarvest = survivedFish * fish.harvestWeight;
            const expectedRevenue = expectedHarvest * fish.marketPrice;
            const fingerlingCost = totalFish * fish.fingerlingPrice;
            const feedRequired = expectedHarvest * fish.fcr;

            totalFingerlingCost += fingerlingCost;
            totalFeedRequired += feedRequired;
            totalExpectedHarvest += expectedHarvest;
            totalExpectedRevenue += expectedRevenue;

            fishDetails.push({
              name: fish.nameBn,
              quantity: totalFish,
              fingerlingCost,
              expectedHarvest,
              expectedRevenue,
            });
          }
        });
      }
    }

    // পুকুর প্রস্তুতি খরচ
    const pondPreparation = {
      liming: area * costRates.pondPreparation.liming * costRates.pondPreparation.limingPrice,
      fertilizer: area * costRates.pondPreparation.fertilizer * costRates.pondPreparation.fertilizerPrice,
      rotenone: (area * depth * costRates.pondPreparation.rotenone * costRates.pondPreparation.rotenonePrice) / 1000,
      pondRepair: area * costRates.pondPreparation.pondRepair,
      total: 0,
    };
    pondPreparation.total = pondPreparation.liming + pondPreparation.fertilizer + pondPreparation.rotenone + pondPreparation.pondRepair;

    // খাদ্য খরচ
    const feedPricePerKg = farmingIntensity === "intensive" ? costRates.feed.floatingFeedPrice : costRates.feed.sinkingFeedPrice;
    const totalFeedCost = totalFeedRequired * feedPricePerKg;
    const monthlyFeedCost = totalFeedCost / duration;

    // শ্রমিক খরচ
    const feedingLabor = costRates.labor.dailyWage * costRates.labor.feedingDays * duration;
    const maintenanceLabor = costRates.labor.dailyWage * costRates.labor.maintenanceDays * duration;
    const harvestLabor = area * costRates.labor.harvestLabor;
    const totalLaborCost = feedingLabor + maintenanceLabor + harvestLabor;

    // ঔষধ খরচ
    const monthlyMedicineCost = area * costRates.medicine.monthlyPerDecimal;
    const monthlyWaterTreatment = area * costRates.medicine.waterTreatment;
    const totalMedicineCost = (monthlyMedicineCost + monthlyWaterTreatment) * duration;

    // সরঞ্জাম খরচ
    const netHaulingCost = area * costRates.equipment.netHauling;
    const netPurchaseCost = (area / 100) * costRates.equipment.netPurchase;
    const totalEquipmentCost = netHaulingCost + netPurchaseCost;

    // অন্যান্য খরচ
    const transportCost = totalExpectedHarvest * costRates.miscellaneous.transport;
    const marketingCost = (totalExpectedRevenue * costRates.miscellaneous.marketing) / 100;
    const totalMiscCost = transportCost + marketingCost;

    const totalInvestment = pondPreparation.total + totalFingerlingCost + totalFeedCost + 
                           totalLaborCost + totalMedicineCost + totalEquipmentCost + totalMiscCost;

    const expectedProfit = totalExpectedRevenue - totalInvestment;

    setResult({
      pondPreparation,
      fingerlings: {
        total: totalFingerlingCost,
        details: fishDetails,
      },
      feed: {
        monthly: monthlyFeedCost,
        total: totalFeedCost,
      },
      labor: {
        feeding: feedingLabor,
        maintenance: maintenanceLabor,
        harvest: harvestLabor,
        total: totalLaborCost,
      },
      medicine: {
        monthly: monthlyMedicineCost,
        waterTreatment: monthlyWaterTreatment * duration,
        total: totalMedicineCost,
      },
      equipment: {
        netHauling: netHaulingCost,
        netPurchase: netPurchaseCost,
        total: totalEquipmentCost,
      },
      miscellaneous: {
        transport: transportCost,
        marketing: marketingCost,
        total: totalMiscCost,
      },
      totalInvestment,
      expectedRevenue: totalExpectedRevenue,
      expectedProfit,
    });
  };

  // মাছের ধরন অনুযায়ী গ্রুপ করা
  const groupedFish = fishSpecies.reduce((acc, fish) => {
    if (!acc[fish.category]) {
      acc[fish.category] = [];
    }
    acc[fish.category].push(fish);
    return acc;
  }, {} as Record<string, FishSpecies[]>);

  const categoryNames: Record<string, string> = {
    carp: "কার্প জাতীয়",
    catfish: "ক্যাটফিশ জাতীয়",
    tilapia: "তেলাপিয়া জাতীয়",
    pangas: "পাঙ্গাশ জাতীয়",
    indigenous: "দেশি মাছ",
    exotic: "চিংড়ি",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary p-3">
                <Fish className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">স্টকিং ডেনসিটি ক্যালকুলেটর</h1>
                <p className="text-muted-foreground mt-1">বিস্তারিত খরচ বিশ্লেষণ সহ মাছ মজুদ পরিকল্পনা</p>
              </div>
            </div>
          </div>

          {pondData && (
            <Alert className="mb-6 bg-primary/10 border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription>
                পুকুরের তথ্য স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে: {pondData.area} {pondData.unit}, গভীরতা: {pondData.depth} ফুট
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-elegant animate-slide-in">
            <CardHeader>
              <CardTitle>মাছ মজুদ পরিকল্পনা</CardTitle>
              <CardDescription>চাষ পদ্ধতি এবং মাছের ধরন নির্বাচন করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pondSize">পুকুরের আয়তন (শতক)</Label>
                  <Input
                    id="pondSize"
                    type="number"
                    placeholder="যেমন: 100"
                    value={pondSize}
                    onChange={(e) => setPondSize(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pondDepth">পুকুরের গভীরতা (ফুট)</Label>
                  <Input
                    id="pondDepth"
                    type="number"
                    placeholder="যেমন: 5"
                    value={pondDepth}
                    onChange={(e) => setPondDepth(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cultureDuration">চাষের সময়কাল (মাস)</Label>
                  <Input
                    id="cultureDuration"
                    type="number"
                    placeholder="যেমন: 6"
                    value={cultureDuration}
                    onChange={(e) => setCultureDuration(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farmingIntensity">চাষের তীব্রতা</Label>
                  <Select value={farmingIntensity} onValueChange={(value: "semiIntensive" | "intensive") => setFarmingIntensity(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="তীব্রতা নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semiIntensive">আধা-নিবিড় (Semi-Intensive)</SelectItem>
                      <SelectItem value="intensive">নিবিড় (Intensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="farmingMethod">চাষ পদ্ধতি</Label>
                  <Select value={farmingMethod} onValueChange={(value) => {
                    setFarmingMethod(value);
                    setSelectedFish("");
                    setSelectedMixedModel("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="চাষ পদ্ধতি নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">একক চাষ</SelectItem>
                      <SelectItem value="mixed">মিশ্র চাষ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {farmingMethod === "single" && (
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label htmlFor="fishType">মাছের ধরন</Label>
                    <Select value={selectedFish} onValueChange={setSelectedFish}>
                      <SelectTrigger>
                        <SelectValue placeholder="মাছের ধরন নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupedFish).map(([category, fishes]) => (
                          <div key={category}>
                            <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                              {categoryNames[category]}
                            </div>
                            {fishes.map((fish) => (
                              <SelectItem key={fish.id} value={fish.id}>
                                {fish.nameBn} ({fish.nameEn}) - ঘনত্ব: {fish.stockingDensity[farmingIntensity]}/শতক
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {farmingMethod === "mixed" && (
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label htmlFor="mixedType">মিশ্র চাষের ধরন</Label>
                    <Select value={selectedMixedModel} onValueChange={setSelectedMixedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="মিশ্র চাষের ধরন নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {mixedFarmingModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.nameBn} - {model.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button 
                onClick={calculateStocking} 
                className="w-full" 
                size="lg"
                disabled={!farmingMethod || (farmingMethod === "single" && !selectedFish) || (farmingMethod === "mixed" && !selectedMixedModel)}
              >
                বিস্তারিত হিসাব করুন
              </Button>

              {result && (
                <div className="mt-8 space-y-6 animate-fade-in">
                  {/* মাছের মজুদ বিবরণ */}
                  <div className="p-6 bg-gradient-card border border-primary/20 rounded-lg">
                    <h3 className="text-xl font-semibold text-primary mb-4">মাছের মজুদ বিবরণ</h3>
                    <div className="space-y-3">
                      {result.fingerlings.details.map((fish, index) => (
                        <div key={index} className="bg-background/50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-lg">{fish.name}</p>
                              <p className="text-sm text-muted-foreground">পোনা সংখ্যা: {fish.quantity.toLocaleString()} টি</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">৳{fish.fingerlingCost.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">পোনার খরচ</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
                            <div>
                              <p className="text-xs text-muted-foreground">প্রত্যাশিত উৎপাদন</p>
                              <p className="font-semibold">{fish.expectedHarvest.toFixed(0)} কেজি</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">প্রত্যাশিত আয়</p>
                              <p className="font-semibold text-green-600">৳{fish.expectedRevenue.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="bg-primary/10 p-4 rounded-lg mt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">মোট পোনা খরচ:</span>
                          <span className="text-xl font-bold text-primary">৳{result.fingerlings.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* খরচের বিস্তারিত বিবরণ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* পুকুর প্রস্তুতি */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">পুকুর প্রস্তুতি</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">চুন প্রয়োগ:</span>
                          <span className="font-medium">৳{result.pondPreparation.liming.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">সার প্রয়োগ:</span>
                          <span className="font-medium">৳{result.pondPreparation.fertilizer.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">রোটেনন:</span>
                          <span className="font-medium">৳{result.pondPreparation.rotenone.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">পাড় মেরামত:</span>
                          <span className="font-medium">৳{result.pondPreparation.pondRepair.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="font-semibold">মোট:</span>
                          <span className="font-bold text-primary">৳{result.pondPreparation.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* খাদ্য খরচ */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">খাদ্য খরচ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">মাসিক খরচ:</span>
                          <span className="font-medium">৳{result.feed.monthly.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="font-semibold">মোট খরচ ({cultureDuration} মাস):</span>
                          <span className="font-bold text-primary">৳{result.feed.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* শ্রমিক খরচ */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">শ্রমিক খরচ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">খাদ্য প্রদান:</span>
                          <span className="font-medium">৳{result.labor.feeding.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">রক্ষণাবেক্ষণ:</span>
                          <span className="font-medium">৳{result.labor.maintenance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">আহরণ:</span>
                          <span className="font-medium">৳{result.labor.harvest.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="font-semibold">মোট:</span>
                          <span className="font-bold text-primary">৳{result.labor.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ঔষধ ও পানি শোধন */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">ঔষধ ও পানি শোধন</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">মাসিক ঔষধ:</span>
                          <span className="font-medium">৳{result.medicine.monthly.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">পানি শোধন (মোট):</span>
                          <span className="font-medium">৳{result.medicine.waterTreatment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="font-semibold">মোট:</span>
                          <span className="font-bold text-primary">৳{result.medicine.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* সরঞ্জাম খরচ */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">সরঞ্জাম খরচ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">জাল টানা:</span>
                          <span className="font-medium">৳{result.equipment.netHauling.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">জাল ক্রয়:</span>
                          <span className="font-medium">৳{result.equipment.netPurchase.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="font-semibold">মোট:</span>
                          <span className="font-bold text-primary">৳{result.equipment.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* অন্যান্য খরচ */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">অন্যান্য খরচ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">পরিবহন:</span>
                          <span className="font-medium">৳{result.miscellaneous.transport.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">বাজারজাতকরণ:</span>
                          <span className="font-medium">৳{result.miscellaneous.marketing.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border">
                          <span className="font-semibold">মোট:</span>
                          <span className="font-bold text-primary">৳{result.miscellaneous.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* সারসংক্ষেপ */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-gradient-primary text-white rounded-lg text-center">
                      <p className="text-sm opacity-90 mb-2">মোট বিনিয়োগ</p>
                      <p className="text-3xl font-bold">৳{result.totalInvestment.toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-green-600 text-white rounded-lg text-center">
                      <p className="text-sm opacity-90 mb-2">প্রত্যাশিত আয়</p>
                      <p className="text-3xl font-bold">৳{result.expectedRevenue.toLocaleString()}</p>
                    </div>
                    <div className={`p-6 ${result.expectedProfit > 0 ? 'bg-emerald-600' : 'bg-red-600'} text-white rounded-lg text-center`}>
                      <p className="text-sm opacity-90 mb-2">প্রত্যাশিত লাভ</p>
                      <p className="text-3xl font-bold">৳{result.expectedProfit.toLocaleString()}</p>
                      <p className="text-xs opacity-75 mt-1">
                        ROI: {((result.expectedProfit / result.totalInvestment) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* পরামর্শ */}
                  <div className="p-6 bg-muted/50 border border-border rounded-lg">
                    <h4 className="font-semibold mb-3 text-foreground">গুরুত্বপূর্ণ পরামর্শ:</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>পুকুর প্রস্তুতিতে চুন প্রয়োগের ৭-১০ দিন পর পোনা ছাড়ুন</li>
                      <li>মজুদের আগে পানির pH ৭-৮.৫ এর মধ্যে রাখুন</li>
                      <li>সকালে বা সন্ধ্যায় পোনা মজুদ করুন, দুপুরে নয়</li>
                      <li>প্রথম ১৫ দিন প্রতিদিন পানির গুণমান পরীক্ষা করুন</li>
                      <li>নিয়মিত খাদ্য প্রয়োগ করুন - দিনে ২-৩ বার</li>
                      <li>মাসে অন্তত একবার জাল টেনে মাছের স্বাস্থ্য পরীক্ষা করুন</li>
                      <li>পানিতে অক্সিজেনের মাত্রা সর্বদা ৫ ppm এর উপরে রাখুন</li>
                      <li>রোগ প্রতিরোধে প্রতি মাসে চুন ও লবণ প্রয়োগ করুন</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
