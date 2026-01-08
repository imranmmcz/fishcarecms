import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Fish, Info } from "lucide-react";
import { useFarming } from "@/contexts/FarmingContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FishStocking() {
  const { pondData } = useFarming();
  const [pondArea, setPondArea] = useState("");
  const [waterDepth, setWaterDepth] = useState("");
  const [fishType, setFishType] = useState("");
  const [stockingDensity, setStockingDensity] = useState("");
  const [result, setResult] = useState<{
    totalFish: number;
    fingerlingWeight: number;
    totalWeight: number;
  } | null>(null);

  // Auto-load pond data from context and convert units
  useEffect(() => {
    if (pondData) {
      // Convert area from square meters to shotak (1 shotak = 40.47 sq meters)
      const areaInShotak = pondData.area / 40.47;
      setPondArea(areaInShotak.toFixed(2));
      
      // Convert depth from meters to feet (1 meter = 3.281 feet)
      const depthInFeet = pondData.depth * 3.281;
      setWaterDepth(depthInFeet.toFixed(2));
    }
  }, [pondData]);

  const fishTypes = [
    { value: "rohu", label: "রুই", density: "3-5", weight: "25-50" },
    { value: "katla", label: "কাতলা", density: "2-4", weight: "25-50" },
    { value: "mrigal", label: "মৃগেল", density: "2-3", weight: "25-50" },
    { value: "silver", label: "সিলভার কার্প", density: "3-5", weight: "20-40" },
    { value: "grass", label: "গ্রাস কার্প", density: "1-2", weight: "30-60" },
    { value: "tilapia", label: "তেলাপিয়া", density: "5-8", weight: "10-20" },
    { value: "pangas", label: "পাঙ্গাশ", density: "30-50", weight: "5-10" },
    { value: "shing", label: "শিং", density: "20-30", weight: "2-5" },
    { value: "magur", label: "মাগুর", density: "20-30", weight: "2-5" },
  ];

  const calculateStocking = () => {
    if (!pondArea || !stockingDensity || !fishType) return;

    const area = parseFloat(pondArea);
    const density = parseFloat(stockingDensity);
    
    const totalFish = Math.round(area * density * 100) / 100;
    
    const selectedFish = fishTypes.find(f => f.value === fishType);
    const avgWeight = selectedFish 
      ? (parseFloat(selectedFish.weight.split("-")[0]) + parseFloat(selectedFish.weight.split("-")[1])) / 2 
      : 25;
    
    const totalWeight = Math.round(totalFish * avgWeight * 100) / 100;

    setResult({
      totalFish,
      fingerlingWeight: avgWeight,
      totalWeight
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
                <h1 className="text-3xl md:text-4xl font-bold">মাছের মজুদ ক্যালকুলেটর</h1>
                <p className="text-muted-foreground mt-1">পুকুরে সঠিক সংখ্যক মাছ মজুদের হিসাব করুন</p>
              </div>
            </div>
          </div>

          {pondData && (
            <Alert className="mb-6 border-primary/30 bg-primary/5">
              <Info className="h-4 w-4" />
              <AlertDescription>
                পুকুর পরিমাপ থেকে ডাটা অটোমেটিক লোড হয়েছে: <strong>{(pondData.area / 40.47).toFixed(2)} শতক</strong> আয়তন, <strong>{(pondData.depth * 3.281).toFixed(2)} ফুট</strong> গভীরতা
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

              <Button onClick={calculateStocking} className="w-full" size="lg">
                হিসাব করুন
              </Button>

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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
