import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pill, CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useFarming } from "@/contexts/FarmingContext";
import AdUnit from "@/components/AdUnit";
import RecommendedProductsSlider from "@/components/RecommendedProductsSlider";

export default function MedicineApplication() {
  const navigate = useNavigate();
  const { pondData } = useFarming();
  const [waterVolume, setWaterVolume] = useState("");
  const [medicineType, setMedicineType] = useState("");
  const [biomass, setBiomass] = useState("");
  const [result, setResult] = useState<{
    medicineAmount: number;
    applicationMethod: string;
    frequency: string;
    duration: string;
  } | null>(null);

  // Auto-load pond data
  useEffect(() => {
    if (pondData && pondData.volume) {
      setWaterVolume(pondData.volume.toFixed(2));
      toast.success("পুকুরের তথ্য স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে!");
    }
  }, [pondData]);

  const medicines = [
    { 
      value: "lime", 
      label: "চুন (Lime)", 
      dose: "250", 
      unit: "গ্রাম/শতক",
      method: "পানিতে গুলে ছিটিয়ে",
      frequency: "সাপ্তাহিক",
      duration: "সারা মৌসুম"
    },
    { 
      value: "salt", 
      label: "লবণ (Salt)", 
      dose: "1", 
      unit: "কেজি/শতক",
      method: "সরাসরি ছিটিয়ে",
      frequency: "প্রয়োজন অনুযায়ী",
      duration: "৩-৫ দিন"
    },
    { 
      value: "potash", 
      label: "পটাশ (Potassium Permanganate)", 
      dose: "1.5", 
      unit: "গ্রাম/শতক",
      method: "পানিতে গুলে",
      frequency: "মাসিক",
      duration: "১ দিন"
    },
    { 
      value: "zeolite", 
      label: "জিওলাইট", 
      dose: "500", 
      unit: "গ্রাম/শতক",
      method: "সরাসরি ছিটিয়ে",
      frequency: "মাসিক",
      duration: "সারা মৌসুম"
    },
    { 
      value: "chlorine", 
      label: "ক্লোরিন (Bleaching Powder)", 
      dose: "200", 
      unit: "গ্রাম/শতক",
      method: "পানিতে গুলে",
      frequency: "প্রয়োজন অনুযায়ী",
      duration: "১ দিন"
    },
    { 
      value: "oxytetracycline", 
      label: "অক্সিটেট্রাসাইক্লিন", 
      dose: "50", 
      unit: "মিগ্রা/কেজি খাদ্য",
      method: "খাদ্যের সাথে মিশিয়ে",
      frequency: "দৈনিক",
      duration: "৭-১০ দিন"
    },
  ];

  const calculateMedicine = () => {
    if (!waterVolume || !medicineType) return;

    const volume = parseFloat(waterVolume);
    const selectedMedicine = medicines.find(m => m.value === medicineType);
    
    if (!selectedMedicine) return;

    let medicineAmount = 0;
    
    // Calculate based on unit type
    if (selectedMedicine.unit.includes("শতক")) {
      // Dose per decimal (assuming 1 decimal = 435.6 sq ft)
      medicineAmount = parseFloat(selectedMedicine.dose) * (volume / 100);
    } else if (selectedMedicine.unit.includes("খাদ্য") && biomass) {
      // Dose per kg of biomass for feed-mixed medicines
      const biomassKg = parseFloat(biomass);
      medicineAmount = parseFloat(selectedMedicine.dose) * biomassKg / 1000; // Convert mg to g
    }

    medicineAmount = Math.round(medicineAmount * 100) / 100;

    setResult({
      medicineAmount,
      applicationMethod: selectedMedicine.method,
      frequency: selectedMedicine.frequency,
      duration: selectedMedicine.duration
    });
  };

  const resetForm = () => {
    setWaterVolume("");
    setMedicineType("");
    setBiomass("");
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
                <Pill className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">ঔষধ প্রয়োগ ক্যালকুলেটর</h1>
                <p className="text-muted-foreground mt-1">সঠিক মাত্রায় ঔষধ ও রাসায়নিক প্রয়োগ</p>
              </div>
            </div>
          </div>

          <Card className="shadow-elegant animate-slide-in">
            <CardHeader>
              <CardTitle>ঔষধ ও রাসায়নিক গণনা</CardTitle>
              <CardDescription>পুকুরের আয়তন অনুযায়ী সঠিক মাত্রা নির্ধারণ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {pondData && (
                <Alert className="border-primary/50 bg-primary/5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <strong>পুকুরের তথ্য যুক্ত হয়েছে:</strong> আয়তন {pondData.volume.toFixed(2)} ঘন মিটার
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="waterVolume">পানির আয়তন (ঘনফুট)</Label>
                  <Input
                    id="waterVolume"
                    type="number"
                    placeholder="যেমন: 43560"
                    value={waterVolume}
                    onChange={(e) => setWaterVolume(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biomass">মোট বায়োমাস (কেজি) - ঔষধ মিশ্রিত খাদ্যের জন্য</Label>
                  <Input
                    id="biomass"
                    type="number"
                    placeholder="যেমন: 500"
                    value={biomass}
                    onChange={(e) => setBiomass(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medicineType">ঔষধ/রাসায়নিকের ধরন</Label>
                  <Select value={medicineType} onValueChange={setMedicineType}>
                    <SelectTrigger>
                      <SelectValue placeholder="নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map((medicine) => (
                        <SelectItem key={medicine.value} value={medicine.value}>
                          {medicine.label} - {medicine.dose} {medicine.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={calculateMedicine} className="flex-1" size="lg">
                  মাত্রা হিসাব করুন
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">প্রয়োজনীয় পরিমাণ</p>
                      <p className="text-2xl font-bold text-primary">{result.medicineAmount} {medicineType === "oxytetracycline" ? "গ্রাম" : "কেজি"}</p>
                    </div>

                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">প্রয়োগ পদ্ধতি</p>
                      <p className="text-lg font-semibold text-primary">{result.applicationMethod}</p>
                    </div>

                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">প্রয়োগের ফ্রিকোয়েন্সি</p>
                      <p className="text-lg font-semibold text-primary">{result.frequency}</p>
                    </div>

                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">সময়কাল</p>
                      <p className="text-lg font-semibold text-primary">{result.duration}</p>
                    </div>
                  </div>

                   <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">⚠️ সতর্কতা:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>ঔষধ প্রয়োগের আগে অবশ্যই মৎস্য বিশেষজ্ঞের পরামর্শ নিন</li>
                      <li>নির্ধারিত মাত্রার বেশি ব্যবহার করবেন না</li>
                      <li>ঔষধ প্রয়োগের পর নির্দিষ্ট সময় খাদ্য বন্ধ রাখুন</li>
                      <li>সকালে বা সন্ধ্যায় প্রয়োগ করুন</li>
                      <li>বাজারজাতকরণের আগে প্রত্যাহার সময় (withdrawal period) মেনে চলুন</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        toast.success("পরবর্তী মডিউলে যাচ্ছেন...");
                        setTimeout(() => navigate("/fertilizer-calculator"), 1000);
                      }}
                      size="lg"
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      পরবর্তী মডিউল (সার প্রয়োগ)
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6 shadow-elegant">
            <CardHeader>
              <CardTitle>সাধারণ পুকুর ব্যবস্থাপনা রাসায়নিক</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">চুন (Lime)</h4>
                  <p className="text-sm text-muted-foreground">pH নিয়ন্ত্রণ, ক্ষারত্ব বৃদ্ধি এবং পানি জীবাণুমুক্তকরণে ব্যবহৃত হয়</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">লবণ (Salt)</h4>
                  <p className="text-sm text-muted-foreground">পরজীবী নিয়ন্ত্রণ, osmotic stress কমাতে এবং ক্ষত নিরাময়ে সাহায্য করে</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">জিওলাইট</h4>
                  <p className="text-sm text-muted-foreground">অ্যামোনিয়া শোষণ এবং পানির গুণমান উন্নত করে</p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">পটাশ (Potassium Permanganate)</h4>
                  <p className="text-sm text-muted-foreground">শক্তিশালী অক্সিডাইজিং এজেন্ট, পানি জীবাণুমুক্ত এবং পরজীবী নিয়ন্ত্রণে ব্যবহৃত হয়</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recommended Products */}
          <RecommendedProductsSlider category="popular_medicine" titleBn="ঔষধ প্রয়োগের জন্য প্রস্তাবিত পণ্য" />

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
