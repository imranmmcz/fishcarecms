import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Droplets, AlertTriangle, CheckCircle2, Info, ArrowRight, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdUnit from "@/components/AdUnit";
import RecommendedProductsSlider from "@/components/RecommendedProductsSlider";
import { toast } from "sonner";

const WaterQuality = () => {
  const navigate = useNavigate();
  const [temperature, setTemperature] = useState("");
  const [ph, setPh] = useState("");
  const [dissolvedOxygen, setDissolvedOxygen] = useState("");
  const [ammonia, setAmmonia] = useState("");
  const [transparency, setTransparency] = useState("");
  const [result, setResult] = useState<any>(null);

  const analyzeWaterQuality = () => {
    const temp = parseFloat(temperature);
    const phValue = parseFloat(ph);
    const doValue = parseFloat(dissolvedOxygen);
    const ammoniaValue = parseFloat(ammonia);
    const transparencyValue = parseFloat(transparency);

    if (!temp || !phValue || !doValue) {
      return;
    }

    const parameters = [];

    // Temperature analysis
    const tempStatus = temp >= 25 && temp <= 32 ? "optimal" : temp >= 20 && temp <= 35 ? "acceptable" : "critical";
    parameters.push({
      name: "তাপমাত্রা",
      value: `${temp}°C`,
      status: tempStatus,
      optimal: "২৫-৩২°C",
      advice: tempStatus === "critical" 
        ? "তাপমাত্রা স্বাভাবিক সীমার বাইরে। পানির গভীরতা বাড়ান অথবা ছায়া প্রদান করুন।"
        : tempStatus === "acceptable"
        ? "তাপমাত্রা গ্রহণযোগ্য তবে উন্নতির সুযোগ আছে।"
        : "তাপমাত্রা সর্বোত্তম।",
    });

    // pH analysis
    const phStatus = phValue >= 7.0 && phValue <= 8.5 ? "optimal" : phValue >= 6.5 && phValue <= 9.0 ? "acceptable" : "critical";
    parameters.push({
      name: "pH",
      value: phValue.toString(),
      status: phStatus,
      optimal: "৭.০-৮.৫",
      advice: phStatus === "critical"
        ? phValue < 6.5 
          ? "pH অনেক কম। চুন প্রয়োগ করুন (১০০-২০০ গ্রাম/শতাংশ)।"
          : "pH অনেক বেশি। পানি পরিবর্তন করুন এবং সার প্রয়োগ বন্ধ রাখুন।"
        : phStatus === "acceptable"
        ? "pH গ্রহণযোগ্য তবে নিয়মিত পরীক্ষা করুন।"
        : "pH সর্বোত্তম।",
    });

    // Dissolved Oxygen analysis
    const doStatus = doValue >= 5.0 ? "optimal" : doValue >= 3.0 ? "acceptable" : "critical";
    parameters.push({
      name: "দ্রবীভূত অক্সিজেন (DO)",
      value: `${doValue} mg/L`,
      status: doStatus,
      optimal: "≥৫.০ mg/L",
      advice: doStatus === "critical"
        ? "অক্সিজেন মাত্রা বিপজ্জনক! অবিলম্বে এয়ারেটর চালু করুন এবং খাদ্য প্রয়োগ বন্ধ করুন।"
        : doStatus === "acceptable"
        ? "অক্সিজেন কম। এয়ারেশন বাড়ান এবং মজুদ কমানোর কথা ভাবুন।"
        : "অক্সিজেন সর্বোত্তম।",
    });

    // Ammonia analysis (if provided)
    if (ammoniaValue) {
      const ammoniaStatus = ammoniaValue <= 0.1 ? "optimal" : ammoniaValue <= 0.5 ? "acceptable" : "critical";
      parameters.push({
        name: "অ্যামোনিয়া (NH₃)",
        value: `${ammoniaValue} mg/L`,
        status: ammoniaStatus,
        optimal: "≤০.১ mg/L",
        advice: ammoniaStatus === "critical"
          ? "অ্যামোনিয়া মাত্রা বিপজ্জনক! পানি পরিবর্তন করুন এবং খাদ্য কমান।"
          : ammoniaStatus === "acceptable"
          ? "অ্যামোনিয়া বেশি। পানির প্রবাহ বাড়ান এবং জৈব পদার্থ পরিষ্কার করুন।"
          : "অ্যামোনিয়া সর্বোত্তম।",
      });
    }

    // Transparency analysis (if provided)
    if (transparencyValue) {
      const transStatus = transparencyValue >= 25 && transparencyValue <= 40 ? "optimal" : transparencyValue >= 20 && transparencyValue <= 50 ? "acceptable" : "critical";
      parameters.push({
        name: "স্বচ্ছতা (Secchi Disk)",
        value: `${transparencyValue} cm`,
        status: transStatus,
        optimal: "২৫-৪০ cm",
        advice: transStatus === "critical"
          ? transparencyValue < 20
            ? "পানি খুব ঘোলা। প্ল্যাঙ্কটন বেশি। এয়ারেশন বাড়ান এবং সার কমান।"
            : "পানি খুব পরিষ্কার। প্ল্যাঙ্কটন কম। জৈব সার প্রয়োগ করুন।"
          : transStatus === "acceptable"
          ? "স্বচ্ছতা গ্রহণযোগ্য।"
          : "স্বচ্ছতা সর্বোত্তম।",
      });
    }

    const criticalCount = parameters.filter(p => p.status === "critical").length;
    const overallStatus = criticalCount > 0 ? "critical" : parameters.some(p => p.status === "acceptable") ? "acceptable" : "optimal";

    setResult({
      parameters,
      overallStatus,
      summary: overallStatus === "critical"
        ? "জরুরি পদক্ষেপ প্রয়োজন! একাধিক পরামিতি বিপজ্জনক সীমায় আছে।"
        : overallStatus === "acceptable"
        ? "পানির গুণমান গ্রহণযোগ্য তবে উন্নতির সুযোগ আছে।"
        : "পানির গুণমান চমৎকার! বর্তমান ব্যবস্থাপনা চালিয়ে যান।",
    });
  };

  const resetForm = () => {
    setTemperature("");
    setPh("");
    setDissolvedOxygen("");
    setAmmonia("");
    setTransparency("");
    setResult(null);
    toast.success("ফর্ম রিসেট করা হয়েছে");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "bg-green-100 text-green-800 border-green-200";
      case "acceptable":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "optimal":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "acceptable":
        return <Info className="h-5 w-5 text-yellow-600" />;
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header Ad */}
      <div className="container mx-auto px-4 py-4">
        <AdUnit position="header" className="mb-4" />
      </div>
      
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Droplets className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">পানির গুণমান পরীক্ষা</h1>
            <p className="text-muted-foreground">পানির pH, অক্সিজেন এবং অন্যান্য পরামিতি পরীক্ষা করুন</p>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              নিয়মিত পানির গুণমান পরীক্ষা করলে মাছের রোগ প্রতিরোধ ক্ষমতা বাড়ে এবং মৃত্যুর হার কমে
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>পরীক্ষার ফলাফল লিখুন</CardTitle>
              <CardDescription>পানি পরীক্ষা কিটের সাহায্যে প্রাপ্ত মান লিখুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">তাপমাত্রা (°C) *</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder="যেমন: 28.5"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ph">pH *</Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.1"
                    placeholder="যেমন: 7.5"
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dissolvedOxygen">দ্রবীভূত অক্সিজেন (mg/L) *</Label>
                  <Input
                    id="dissolvedOxygen"
                    type="number"
                    step="0.1"
                    placeholder="যেমন: 5.5"
                    value={dissolvedOxygen}
                    onChange={(e) => setDissolvedOxygen(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ammonia">অ্যামোনিয়া (mg/L)</Label>
                  <Input
                    id="ammonia"
                    type="number"
                    step="0.01"
                    placeholder="যেমন: 0.15"
                    value={ammonia}
                    onChange={(e) => setAmmonia(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transparency">স্বচ্ছতা (cm)</Label>
                  <Input
                    id="transparency"
                    type="number"
                    step="1"
                    placeholder="যেমন: 30"
                    value={transparency}
                    onChange={(e) => setTransparency(e.target.value)}
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">* প্রয়োজনীয় তথ্য</div>

              <div className="flex gap-3">
                <Button onClick={analyzeWaterQuality} className="flex-1" size="lg">
                  <Droplets className="mr-2 h-5 w-5" />
                  পানির গুণমান বিশ্লেষণ করুন
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
            </CardContent>
          </Card>

          {result && (
            <Card className={`border-2 ${getStatusColor(result.overallStatus)}`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.overallStatus)}
                  <CardTitle>বিশ্লেষণ রিপোর্ট</CardTitle>
                </div>
                <CardDescription className="text-base font-semibold">
                  {result.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.parameters.map((param: any, index: number) => (
                  <div key={index} className="bg-background rounded-lg p-4 space-y-2 border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(param.status)}
                        <h4 className="font-semibold text-foreground">{param.name}</h4>
                      </div>
                      <Badge variant="outline" className={getStatusColor(param.status)}>
                        {param.value}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>সর্বোত্তম মান:</strong> {param.optimal}
                    </div>
                    <div className="text-sm text-foreground">
                      {param.advice}
                    </div>
                  </div>
                ))}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>পরামর্শ:</strong> সকাল ও সন্ধ্যায় নিয়মিত পানির গুণমান পরীক্ষা করুন। হঠাৎ পরিবর্তন দেখলে দ্রুত পদক্ষেপ নিন।
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-end mt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      // Save water quality data to localStorage
                      localStorage.setItem("farmingWaterQualityData", JSON.stringify({
                        temperature: parseFloat(temperature),
                        ph: parseFloat(ph),
                        dissolvedOxygen: parseFloat(dissolvedOxygen),
                        ammonia: ammonia ? parseFloat(ammonia) : null,
                        transparency: transparency ? parseFloat(transparency) : null,
                        overallStatus: result.overallStatus,
                      }));
                      toast.success("পানির গুণমান তথ্য সংরক্ষিত হয়েছে! পরবর্তী মডিউলে যাচ্ছেন...");
                      setTimeout(() => navigate("/cost-calculator"), 1000);
                    }}
                    size="lg"
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    সংরক্ষণ করুন এবং পরবর্তী মডিউলে যান
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Recommended Products */}
          <RecommendedProductsSlider category="calculator_related" titleBn="পানির গুণমানের জন্য প্রস্তাবিত পণ্য" />

          {/* Footer Ad */}
          <div className="mt-8">
            <AdUnit position="footer" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default WaterQuality;
