import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Info, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useFarming } from "@/contexts/FarmingContext";

const FertilizerCalculator = () => {
  const navigate = useNavigate();
  const { pondData } = useFarming();
  const [pondArea, setPondArea] = useState("");
  const [waterDepth, setWaterDepth] = useState("");
  const [pondType, setPondType] = useState("new");
  const [fertilizerType, setFertilizerType] = useState("urea");
  const [result, setResult] = useState<any>(null);

  // Auto-load pond data
  useEffect(() => {
    if (pondData) {
      // Convert area from square meters to shotak
      const areaInShotak = pondData.area / 40.47;
      setPondArea(areaInShotak.toFixed(2));
      
      // Convert depth from meters to feet
      const depthInFeet = pondData.depth / 0.3048;
      setWaterDepth(depthInFeet.toFixed(2));
      
      toast.success("পুকুরের তথ্য স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে!");
    }
  }, [pondData]);

  const calculateFertilizer = () => {
    const areaInShotak = parseFloat(pondArea);
    const depthInFeet = parseFloat(waterDepth);

    if (!areaInShotak || !depthInFeet || areaInShotak <= 0 || depthInFeet <= 0) {
      return;
    }

    // Convert feet to meters for volume calculation
    const depthInMeters = depthInFeet * 0.3048;
    const areaInSqMeters = areaInShotak * 40.47;
    const volume = areaInSqMeters * depthInMeters;

    // Fertilizer doses based on pond type (kg/decimal or shotak)
    const doses: any = {
      new: {
        urea: 0.1,
        tsp: 0.15,
        lime: 0.5,
        cowdung: 5,
      },
      regular: {
        urea: 0.05,
        tsp: 0.08,
        lime: 0.3,
        cowdung: 3,
      },
    };

    // Since 1 shotak = 1 decimal, we can use the area directly
    const selectedDose = doses[pondType as keyof typeof doses];

    const fertilizers = {
      urea: (selectedDose.urea * areaInShotak).toFixed(2),
      tsp: (selectedDose.tsp * areaInShotak).toFixed(2),
      lime: (selectedDose.lime * areaInShotak).toFixed(2),
      cowdung: (selectedDose.cowdung * areaInShotak).toFixed(2),
    };

    const applicationSchedule = pondType === "new" 
      ? "পুকুর প্রস্তুতির সময় একবার প্রয়োগ করুন"
      : "প্রতি ১৫ দিন পর পর প্রয়োগ করুন";

    const applicationData = {
      fertilizers,
      schedule: applicationSchedule,
      pondType: pondType === "new" ? "নতুন পুকুর" : "নিয়মিত রক্ষণাবেক্ষণ",
      date: new Date().toISOString(),
      area: areaInShotak,
      depth: depthInFeet,
    };

    // Save to localStorage for reports
    const savedReports = JSON.parse(localStorage.getItem("fertilizerReports") || "[]");
    savedReports.push(applicationData);
    localStorage.setItem("fertilizerReports", JSON.stringify(savedReports));

    setResult(applicationData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">সার প্রয়োগ ক্যালকুলেটর</h1>
            <p className="text-muted-foreground">পুকুরের উৎপাদনশীলতা বাড়াতে সঠিক সার প্রয়োগ করুন</p>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              সঠিক পরিমাণে সার প্রয়োগ করলে পুকুরে প্রাকৃতিক খাদ্য বৃদ্ধি পায় এবং মাছের উৎপাদন ২০-৩০% বাড়ে
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>পুকুরের তথ্য লিখুন</CardTitle>
              <CardDescription>সঠিক সার প্রয়োগের জন্য তথ্য প্রদান করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {pondData && (
                <Alert className="border-primary/50 bg-primary/5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <strong>পুকুরের তথ্য যুক্ত হয়েছে:</strong> আয়তন {(pondData.area / 40.47).toFixed(2)} শতক, গভীরতা {(pondData.depth / 0.3048).toFixed(2)} ফুট
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pondArea">পুকুরের আয়তন (শতক)</Label>
                  <Input
                    id="pondArea"
                    type="number"
                    placeholder="যেমন: ২৫"
                    value={pondArea}
                    onChange={(e) => setPondArea(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waterDepth">পানির গভীরতা (ফুট)</Label>
                  <Input
                    id="waterDepth"
                    type="number"
                    step="0.1"
                    placeholder="যেমন: ৫"
                    value={waterDepth}
                    onChange={(e) => setWaterDepth(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pondType">পুকুরের ধরন</Label>
                  <Select value={pondType} onValueChange={setPondType}>
                    <SelectTrigger id="pondType">
                      <SelectValue placeholder="নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">নতুন পুকুর প্রস্তুতি</SelectItem>
                      <SelectItem value="regular">নিয়মিত রক্ষণাবেক্ষণ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={calculateFertilizer} className="w-full" size="lg">
                <TrendingUp className="mr-2 h-5 w-5" />
                সার প্রয়োগের হিসাব করুন
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">সার প্রয়োগের সুপারিশ</CardTitle>
                <CardDescription>{result.pondType}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-background rounded-lg p-4 space-y-2">
                    <div className="text-sm text-muted-foreground">ইউরিয়া</div>
                    <div className="text-2xl font-bold text-foreground">{result.fertilizers.urea} কেজি</div>
                  </div>

                  <div className="bg-background rounded-lg p-4 space-y-2">
                    <div className="text-sm text-muted-foreground">টিএসপি</div>
                    <div className="text-2xl font-bold text-foreground">{result.fertilizers.tsp} কেজি</div>
                  </div>

                  <div className="bg-background rounded-lg p-4 space-y-2">
                    <div className="text-sm text-muted-foreground">চুন</div>
                    <div className="text-2xl font-bold text-foreground">{result.fertilizers.lime} কেজি</div>
                  </div>

                  <div className="bg-background rounded-lg p-4 space-y-2">
                    <div className="text-sm text-muted-foreground">গোবর</div>
                    <div className="text-2xl font-bold text-foreground">{result.fertilizers.cowdung} কেজি</div>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>প্রয়োগ সময়সূচী:</strong> {result.schedule}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <h4 className="font-semibold text-foreground">প্রয়োগ নির্দেশনা:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>চুন প্রয়োগের ৩-৪ দিন পর অন্যান্য সার প্রয়োগ করুন</li>
                    <li>রৌদ্রজ্জ্বল দিনে সকাল ১০টা থেকে দুপুর ২টার মধ্যে সার প্রয়োগ করুন</li>
                    <li>গোবর অবশ্যই পচানো অবস্থায় প্রয়োগ করুন</li>
                    <li>সার প্রয়োগের দিন মাছকে খাদ্য দেবেন না</li>
                  </ul>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      toast.success("পরবর্তী মডিউলে যাচ্ছেন...");
                      setTimeout(() => navigate("/water-quality"), 1000);
                    }}
                    size="lg"
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    পরবর্তী মডিউল (পানির গুণমান)
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FertilizerCalculator;
