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

interface FishData {
  name: string;
  ratio: number;
  density: number;
  fingerlingPrice: number;
  survivalRate: number;
}

interface CalculationResult {
  fishDetails: Array<{
    name: string;
    quantity: number;
    weight: number;
    cost: number;
  }>;
  feedCost: {
    monthly: number;
    total: number;
  };
  medicineCost: {
    monthly: number;
    total: number;
  };
  inputs: {
    lime: number;
    salt: number;
    shell: number;
    fertilizer: number;
  };
  totalInvestment: number;
}

export default function StockingDensity() {
  const { pondData } = useFarming();
  const [pondSize, setPondSize] = useState(pondData?.area.toString() || "");
  const [fishType, setFishType] = useState("");
  const [farmingMethod, setFarmingMethod] = useState("");
  const [result, setResult] = useState<CalculationResult | null>(null);

  const singleFishOptions = [
    { value: "rohu", label: "রুই", density: 5000, price: 1.5, survival: 80 },
    { value: "katla", label: "কাতলা", density: 4000, price: 1.5, survival: 80 },
    { value: "pangas", label: "পাঙ্গাশ", density: 50000, price: 0.8, survival: 85 },
    { value: "tilapia", label: "তেলাপিয়া", density: 8000, price: 0.5, survival: 85 },
    { value: "shing", label: "শিং", density: 25000, price: 2.0, survival: 75 },
  ];

  const mixedFishRatios: Record<string, FishData[]> = {
    carp: [
      { name: "রুই", ratio: 30, density: 3000, fingerlingPrice: 1.5, survivalRate: 80 },
      { name: "কাতলা", ratio: 25, density: 2500, fingerlingPrice: 1.5, survivalRate: 80 },
      { name: "মৃগেল", ratio: 20, density: 2000, fingerlingPrice: 1.2, survivalRate: 80 },
      { name: "সিলভার কার্প", ratio: 15, density: 1500, fingerlingPrice: 1.0, survivalRate: 82 },
      { name: "গ্রাস কার্প", ratio: 10, density: 1000, fingerlingPrice: 2.0, survivalRate: 78 },
    ],
    commercial: [
      { name: "পাঙ্গাশ", ratio: 60, density: 30000, fingerlingPrice: 0.8, survivalRate: 85 },
      { name: "তেলাপিয়া", ratio: 25, density: 12500, fingerlingPrice: 0.5, survivalRate: 85 },
      { name: "রুই", ratio: 15, density: 7500, fingerlingPrice: 1.5, survivalRate: 80 },
    ],
  };

  const calculateStocking = () => {
    if (!pondSize || !farmingMethod) return;

    const area = parseFloat(pondSize);
    const cultureDuration = 6; // months
    let fishDetails: CalculationResult["fishDetails"] = [];
    let totalFingerlingCost = 0;

    if (farmingMethod === "single" && fishType) {
      const selectedFish = singleFishOptions.find(f => f.value === fishType);
      if (selectedFish) {
        const quantity = Math.round(area * selectedFish.density);
        const cost = quantity * selectedFish.price;
        totalFingerlingCost = cost;
        
        fishDetails.push({
          name: selectedFish.label,
          quantity,
          weight: 25,
          cost,
        });
      }
    } else if (farmingMethod === "mixed") {
      const mixType = fishType || "carp";
      const fishList = mixedFishRatios[mixType];
      
      fishList.forEach(fish => {
        const quantity = Math.round(area * fish.density);
        const cost = quantity * fish.fingerlingPrice;
        totalFingerlingCost += cost;
        
        fishDetails.push({
          name: fish.name,
          quantity,
          weight: 25,
          cost,
        });
      });
    }

    // Feed cost calculation (60% of total cost)
    const feedCostPerMonth = area * 3000; // 3000 tk per decimal per month
    const totalFeedCost = feedCostPerMonth * cultureDuration;

    // Medicine cost (10% of total operational cost)
    const medicineCostPerMonth = area * 500;
    const totalMedicineCost = medicineCostPerMonth * cultureDuration;

    // Input materials
    const inputs = {
      lime: area * 1, // 1 kg per decimal
      salt: area * 0.5, // 0.5 kg per decimal
      shell: area * 2, // 2 kg per decimal
      fertilizer: area * 5, // 5 kg per decimal
    };

    const inputCost = (inputs.lime * 10) + (inputs.salt * 30) + (inputs.shell * 15) + (inputs.fertilizer * 20);

    setResult({
      fishDetails,
      feedCost: {
        monthly: feedCostPerMonth,
        total: totalFeedCost,
      },
      medicineCost: {
        monthly: medicineCostPerMonth,
        total: totalMedicineCost,
      },
      inputs,
      totalInvestment: totalFingerlingCost + totalFeedCost + totalMedicineCost + inputCost,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary p-3">
                <Fish className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">স্টকিং ডেনসিটি ক্যালকুলেটর</h1>
                <p className="text-muted-foreground mt-1">সম্পূর্ণ খরচ এবং উপকরণের হিসাব সহ মাছ মজুদ পরিকল্পনা</p>
              </div>
            </div>
          </div>

          {pondData && (
            <Alert className="mb-6 bg-primary/10 border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription>
                পুকুরের তথ্য স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে: {pondData.area} {pondData.unit}
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-elegant animate-slide-in">
            <CardHeader>
              <CardTitle>মাছ মজুদ পরিকল্পনা</CardTitle>
              <CardDescription>চাষ পদ্ধতি এবং মাছের ধরন নির্বাচন করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="farmingMethod">চাষ পদ্ধতি</Label>
                  <Select value={farmingMethod} onValueChange={(value) => {
                    setFarmingMethod(value);
                    setFishType("");
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="fishType">মাছের ধরন</Label>
                    <Select value={fishType} onValueChange={setFishType}>
                      <SelectTrigger>
                        <SelectValue placeholder="মাছের ধরন নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {singleFishOptions.map((fish) => (
                          <SelectItem key={fish.value} value={fish.value}>
                            {fish.label} (ঘনত্ব: {fish.density}/শতক)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {farmingMethod === "mixed" && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="mixedType">মিশ্র চাষের ধরন</Label>
                    <Select value={fishType} onValueChange={setFishType}>
                      <SelectTrigger>
                        <SelectValue placeholder="মিশ্র চাষের ধরন নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carp">ঐতিহ্যবাহী কার্প মিশ্র চাষ</SelectItem>
                        <SelectItem value="commercial">বাণিজ্যিক মিশ্র চাষ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button 
                onClick={calculateStocking} 
                className="w-full" 
                size="lg"
                disabled={!farmingMethod || (farmingMethod === "single" && !fishType)}
              >
                সম্পূর্ণ হিসাব করুন
              </Button>

              {result && (
                <div className="mt-6 space-y-6 animate-fade-in">
                  {/* Fish Stocking Details */}
                  <div className="p-6 bg-gradient-card border border-primary/20 rounded-lg">
                    <h3 className="text-xl font-semibold text-primary mb-4">মাছের মজুদ বিবরণ</h3>
                    <div className="space-y-3">
                      {result.fishDetails.map((fish, index) => (
                        <div key={index} className="bg-background/50 p-4 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{fish.name}</p>
                            <p className="text-sm text-muted-foreground">সংখ্যা: {fish.quantity} টি</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">৳{fish.cost.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">পোনার খরচ</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-background border border-border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-foreground">খাদ্য খরচ</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">মাসিক খরচ:</span>
                          <span className="font-medium">৳{result.feedCost.monthly.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">৬ মাসের মোট:</span>
                          <span className="font-bold text-primary">৳{result.feedCost.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background border border-border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-foreground">ঔষধ খরচ</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">মাসিক খরচ:</span>
                          <span className="font-medium">৳{result.medicineCost.monthly.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">৬ মাসের মোট:</span>
                          <span className="font-bold text-primary">৳{result.medicineCost.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inputs Required */}
                  <div className="p-6 bg-muted/50 border border-border rounded-lg">
                    <h4 className="font-semibold mb-4 text-foreground">প্রয়োজনীয় উপকরণ</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{result.inputs.lime} কেজি</p>
                        <p className="text-sm text-muted-foreground">চুন</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{result.inputs.salt} কেজি</p>
                        <p className="text-sm text-muted-foreground">লবণ</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{result.inputs.shell} কেজি</p>
                        <p className="text-sm text-muted-foreground">খোল</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{result.inputs.fertilizer} কেজি</p>
                        <p className="text-sm text-muted-foreground">সার</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Investment */}
                  <div className="p-6 bg-gradient-primary text-white rounded-lg text-center">
                    <p className="text-sm opacity-90 mb-2">মোট বিনিয়োগ (৬ মাস)</p>
                    <p className="text-4xl font-bold">৳{result.totalInvestment.toLocaleString()}</p>
                  </div>

                  {/* Recommendations */}
                  <div className="p-6 bg-muted/50 border border-border rounded-lg">
                    <h4 className="font-semibold mb-3 text-foreground">গুরুত্বপূর্ণ পরামর্শ:</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>পুকুর প্রস্তুতিতে চুন প্রয়োগের ৭-১০ দিন পর পোনা ছাড়ুন</li>
                      <li>মজুদের আগে পানির pH ৭-৮ এর মধ্যে রাখুন</li>
                      <li>সকালে বা সন্ধ্যায় পোনা মজুদ করুন</li>
                      <li>প্রথম ১৫ দিন প্রতিদিন পানির গুণমান পরীক্ষা করুন</li>
                      <li>নিয়মিত খাদ্য ও ঔষধ প্রয়োগ করুন</li>
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
