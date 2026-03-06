import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Scale, ArrowRight, RotateCcw } from "lucide-react";
import AdUnit from "@/components/AdUnit";
import RecommendedProductsSlider from "@/components/RecommendedProductsSlider";
import { toast } from "sonner";

export default function BiomassCalculator() {
  const navigate = useNavigate();
  const [sampleFish, setSampleFish] = useState("");
  const [sampleWeight, setSampleWeight] = useState("");
  const [totalFish, setTotalFish] = useState("");
  const [result, setResult] = useState<{
    avgWeight: number;
    totalBiomass: number;
    biomassPerDecimal: number;
  } | null>(null);

  const calculateBiomass = () => {
    if (!sampleFish || !sampleWeight || !totalFish) return;

    const sample = parseFloat(sampleFish);
    const weight = parseFloat(sampleWeight);
    const total = parseFloat(totalFish);

    const avgWeight = Math.round((weight / sample) * 100) / 100;
    const totalBiomass = Math.round(avgWeight * total * 100) / 100;
    const biomassPerDecimal = Math.round((totalBiomass / 100) * 100) / 100; // Assuming pond area

    setResult({
      avgWeight,
      totalBiomass,
      biomassPerDecimal
    });
  };

  const resetForm = () => {
    setSampleFish("");
    setSampleWeight("");
    setTotalFish("");
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
                <Scale className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">বায়োমাস ক্যালকুলেটর</h1>
                <p className="text-muted-foreground mt-1">পুকুরের মোট মাছের ওজন নির্ণয় করুন</p>
              </div>
            </div>
          </div>

          <Card className="shadow-elegant animate-slide-in">
            <CardHeader>
              <CardTitle>বায়োমাস গণনা</CardTitle>
              <CardDescription>নমুনা মাছের তথ্য দিয়ে মোট বায়োমাস নির্ণয় করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sampleFish">নমুনা মাছের সংখ্যা</Label>
                  <Input
                    id="sampleFish"
                    type="number"
                    placeholder="যেমন: 20"
                    value={sampleFish}
                    onChange={(e) => setSampleFish(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sampleWeight">নমুনা মাছের মোট ওজন (কেজি)</Label>
                  <Input
                    id="sampleWeight"
                    type="number"
                    placeholder="যেমন: 10"
                    value={sampleWeight}
                    onChange={(e) => setSampleWeight(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalFish">পুকুরের মোট মাছ (আনুমানিক)</Label>
                  <Input
                    id="totalFish"
                    type="number"
                    placeholder="যেমন: 500"
                    value={totalFish}
                    onChange={(e) => setTotalFish(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={calculateBiomass} className="flex-1" size="lg">
                  বায়োমাস হিসাব করুন
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
                      <p className="text-sm text-muted-foreground mb-1">প্রতি মাছের গড় ওজন</p>
                      <p className="text-2xl font-bold text-primary">{result.avgWeight} কেজি</p>
                    </div>

                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">মোট বায়োমাস</p>
                      <p className="text-2xl font-bold text-primary">{result.totalBiomass} কেজি</p>
                    </div>

                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">বায়োমাস/১০০ শতক</p>
                      <p className="text-2xl font-bold text-primary">{result.biomassPerDecimal} কেজি</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">গুরুত্বপূর্ণ নোট:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>নমুনা মাছ পুকুরের বিভিন্ন স্থান থেকে সংগ্রহ করুন</li>
                      <li>মাসিক বায়োমাস গণনা করে খাদ্য সামঞ্জস্য করুন</li>
                      <li>বায়োমাস থেকে দৈনিক খাদ্যের পরিমাণ নির্ধারণ করুন</li>
                      <li>উচ্চ বায়োমাসে পানির গুণমান বেশি পর্যবেক্ষণ করুন</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        // Save biomass data to localStorage
                        localStorage.setItem("farmingBiomassData", JSON.stringify({
                          avgWeight: result.avgWeight,
                          totalBiomass: result.totalBiomass,
                          biomassPerDecimal: result.biomassPerDecimal,
                        }));
                        toast.success("বায়োমাস তথ্য সংরক্ষিত হয়েছে! পরবর্তী মডিউলে যাচ্ছেন...");
                        setTimeout(() => navigate("/feed-management"), 1000);
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

          <Card className="mt-6 shadow-elegant">
            <CardHeader>
              <CardTitle>বায়োমাস পরিমাপের পদ্ধতি</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <h4 className="font-semibold">জাল টেনে নমুনা সংগ্রহ</h4>
                    <p className="text-sm text-muted-foreground">পুকুরের বিভিন্ন স্থান থেকে ২০-৩০ টি মাছ ধরুন</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <h4 className="font-semibold">ওজন পরিমাপ</h4>
                    <p className="text-sm text-muted-foreground">সব নমুনা মাছ একসাথে ওজন করুন</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <h4 className="font-semibold">গড় ওজন নির্ণয়</h4>
                    <p className="text-sm text-muted-foreground">মোট ওজন ÷ মাছের সংখ্যা = গড় ওজন</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
                  <div>
                    <h4 className="font-semibold">মোট বায়োমাস হিসাব</h4>
                    <p className="text-sm text-muted-foreground">গড় ওজন × মোট মাছ = মোট বায়োমাস</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recommended Products */}
          <RecommendedProductsSlider category="calculator_related" />

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
