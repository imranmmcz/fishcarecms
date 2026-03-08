import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fish, Info, ArrowRight, RotateCcw } from "lucide-react";
import { useFarming } from "@/contexts/FarmingContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdUnit from "@/components/AdUnit";
import RecommendedProductsSlider from "@/components/RecommendedProductsSlider";
import { toast } from "sonner";
import { useCalculatorParams } from "@/hooks/useCalculatorParams";

export default function FishStocking() {
  const navigate = useNavigate();
  const { pondData, setFishStockingData } = useFarming();
  const { params, loading: paramsLoading, getParam } = useCalculatorParams("fish_stocking");
  const [pondArea, setPondArea] = useState("");
  const [waterDepth, setWaterDepth] = useState("");
  const [fishType, setFishType] = useState("");
  const [stockingDensity, setStockingDensity] = useState("");
  const [result, setResult] = useState<{
    totalFish: number;
    fingerlingWeight: number;
    totalWeight: number;
  } | null>(null);

  // Build fish types from DB params
  const fishTypes = useMemo(() => {
    const fishKeys = ["rohu", "katla", "mrigal", "silver", "grass", "tilapia", "pangas", "shing", "magur"];
    const fishLabels: Record<string, string> = {
      rohu: "রুই", katla: "কাতলা", mrigal: "মৃগেল", silver: "সিলভার কার্প",
      grass: "গ্রাস কার্প", tilapia: "তেলাপিয়া", pangas: "পাঙ্গাশ", shing: "শিং", magur: "মাগুর",
    };
    // Fallback defaults
    const defaults: Record<string, { dMin: number; dMax: number; wMin: number; wMax: number }> = {
      rohu: { dMin: 3, dMax: 5, wMin: 25, wMax: 50 },
      katla: { dMin: 2, dMax: 4, wMin: 25, wMax: 50 },
      mrigal: { dMin: 2, dMax: 3, wMin: 25, wMax: 50 },
      silver: { dMin: 3, dMax: 5, wMin: 20, wMax: 40 },
      grass: { dMin: 1, dMax: 2, wMin: 30, wMax: 60 },
      tilapia: { dMin: 5, dMax: 8, wMin: 10, wMax: 20 },
      pangas: { dMin: 30, dMax: 50, wMin: 5, wMax: 10 },
      shing: { dMin: 20, dMax: 30, wMin: 2, wMax: 5 },
      magur: { dMin: 20, dMax: 30, wMin: 2, wMax: 5 },
    };

    return fishKeys.map((key) => {
      const d = defaults[key];
      const dMin = getParam(`${key}_density_min`, d.dMin);
      const dMax = getParam(`${key}_density_max`, d.dMax);
      const wMin = getParam(`${key}_weight_min`, d.wMin);
      const wMax = getParam(`${key}_weight_max`, d.wMax);
      return {
        value: key,
        label: fishLabels[key],
        density: `${dMin}-${dMax}`,
        weight: `${wMin}-${wMax}`,
        avgWeight: (wMin + wMax) / 2,
      };
    });
  }, [params, getParam]);

  // Unit conversion from DB params
  const sqmPerShotak = getParam("sqm_per_shotak", 40.47);
  const feetPerMeter = getParam("feet_per_meter", 3.281);

  // Auto-load pond data from context and convert units
  useEffect(() => {
    if (pondData) {
      const areaInShotak = pondData.area / sqmPerShotak;
      setPondArea(areaInShotak.toFixed(2));
      const depthInFeet = pondData.depth * feetPerMeter;
      setWaterDepth(depthInFeet.toFixed(2));
    }
  }, [pondData, sqmPerShotak, feetPerMeter]);

  const calculateStocking = () => {
    if (!pondArea || !stockingDensity || !fishType) return;

    const area = parseFloat(pondArea);
    const density = parseFloat(stockingDensity);
    
    const totalFish = Math.round(area * density * 100) / 100;
    
    const selectedFish = fishTypes.find(f => f.value === fishType);
    const avgWeight = selectedFish ? selectedFish.avgWeight : 25;
    
    const totalWeight = Math.round(totalFish * avgWeight * 100) / 100;

    setResult({
      totalFish,
      fingerlingWeight: avgWeight,
      totalWeight
    });
  };

  const resetForm = () => {
    setPondArea("");
    setWaterDepth("");
    setFishType("");
    setStockingDensity("");
    setResult(null);
    toast.success("ফর্ম রিসেট করা হয়েছে");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      
      {/* Header Ad */}
      <div className="container mx-auto px-4 py-4">
        <AdUnit position="header" className="mb-4" />
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary p-3">
                <Fish className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">মাছের মজুদ ক্যালকুলেটর</h1>
                <p className="text-muted-foreground mt-1">পুকুরে সঠিক সংখ্যক মাছ মজুদের হিসাব করুন</p>
              </div>
            </div>
          </div>

          {pondData && (
            <Alert className="mb-6 border-primary/30 bg-primary/5">
              <Info className="h-4 w-4" />
              <AlertDescription>
                পুকুর পরিমাপ থেকে ডাটা অটোমেটিক লোড হয়েছে: <strong>{(pondData.area / sqmPerShotak).toFixed(2)} শতক</strong> আয়তন, <strong>{(pondData.depth * feetPerMeter).toFixed(2)} ফুট</strong> গভীরতা
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-elegant animate-slide-in">
            <CardHeader>
              <CardTitle>মাছের মজুদ তথ্য</CardTitle>
              <CardDescription>পুকুরের তথ্য এবং মাছের ধরন নির্বাচন করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pondArea">পুকুরের আয়তন (শতক)</Label>
                  <Input
                    id="pondArea"
                    type="number"
                    placeholder="যেমন: 100"
                    value={pondArea}
                    onChange={(e) => setPondArea(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waterDepth">পানির গভীরতা (ফুট)</Label>
                  <Input
                    id="waterDepth"
                    type="number"
                    placeholder="যেমন: 5"
                    value={waterDepth}
                    onChange={(e) => setWaterDepth(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fishType">মাছের ধরন</Label>
                  <Select value={fishType} onValueChange={setFishType}>
                    <SelectTrigger>
                      <SelectValue placeholder="মাছের ধরন নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {fishTypes.map((fish) => (
                        <SelectItem key={fish.value} value={fish.value}>
                          {fish.label} (প্রস্তাবিত: {fish.density} টি/শতক)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockingDensity">মজুদ ঘনত্ব (সংখ্যা/শতক)</Label>
                  <Input
                    id="stockingDensity"
                    type="number"
                    placeholder="যেমন: 4"
                    value={stockingDensity}
                    onChange={(e) => setStockingDensity(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={calculateStocking} className="flex-1" size="lg">
                  হিসাব করুন
                </Button>
                <Button 
                  onClick={resetForm} 
                  variant="outline"
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  রিসেট
                </Button>
              </div>

              {result && (
                <div className="mt-6 p-6 bg-gradient-card border border-primary/20 rounded-lg space-y-4 animate-fade-in">
                  <h3 className="text-xl font-semibold text-primary mb-4">ফলাফল</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">মোট মাছের সংখ্যা</p>
                      <p className="text-2xl font-bold text-primary">{result.totalFish} টি</p>
                    </div>

                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">প্রতি পোনার ওজন (গড়)</p>
                      <p className="text-2xl font-bold text-primary">{result.fingerlingWeight} গ্রাম</p>
                    </div>

                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">মোট পোনার ওজন</p>
                      <p className="text-2xl font-bold text-primary">{result.totalWeight} গ্রাম</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">পরামর্শ:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>পোনা মজুদের আগে পুকুর ভালোভাবে প্রস্তুত করুন</li>
                      <li>সকালে বা সন্ধ্যায় পোনা ছাড়ুন যখন তাপমাত্রা কম থাকে</li>
                      <li>প্রথম সপ্তাহে নিয়মিত পানির গুণমান পরীক্ষা করুন</li>
                      <li>মিশ্র চাষের ক্ষেত্রে সঠিক অনুপাত বজায় রাখুন</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        setFishStockingData({
                          totalFish: result.totalFish,
                          density: parseFloat(stockingDensity),
                          species: [fishType],
                        });
                        toast.success("মাছের তথ্য সংরক্ষিত হয়েছে! পরবর্তী মডিউলে যাচ্ছেন...");
                        setTimeout(() => navigate("/biomass-calculator"), 1000);
                      }}
                      size="lg"
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      সংরক্ষণ করুন এবং পরবর্তী মডিউলে যান
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recommended Products */}
          <RecommendedProductsSlider category="calculator_related" titleBn="মাছ মজুদের জন্য প্রস্তাবিত পণ্য" />

          {/* Footer Ad */}
          <div className="mt-8">
            <AdUnit position="footer" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
