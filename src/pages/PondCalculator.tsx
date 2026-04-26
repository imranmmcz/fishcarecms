import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CalculatorSwitcher } from "@/components/CalculatorSwitcher";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button3D } from "@/components/ui/button-3d";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Droplets, Ruler, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import AdUnit from "@/components/AdUnit";
import RecommendedProductsSlider from "@/components/RecommendedProductsSlider";
import { useFarming } from "@/contexts/FarmingContext";

// Pond shape images
import pondRectangle from "@/assets/pond-rectangle.png";
import pondSquare from "@/assets/pond-square.png";
import pondCircle from "@/assets/pond-circle.png";
import pondTrapezoid from "@/assets/pond-trapezoid.png";

type PondShape = "rectangle" | "square" | "circle" | "trapezoid";
type InputUnit = "meter" | "feet" | "centimeter";
type OutputUnit = "shotak" | "katha" | "bigha" | "acre" | "hectare";

export default function PondCalculator() {
  const navigate = useNavigate();
  const { setPondData } = useFarming();
  const [shape, setShape] = useState<PondShape>("rectangle");
  const [inputUnit, setInputUnit] = useState<InputUnit>("meter");
  const [outputUnit, setOutputUnit] = useState<OutputUnit>("shotak");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [radius, setRadius] = useState("");
  const [topLength, setTopLength] = useState("");
  const [bottomLength, setBottomLength] = useState("");
  const [depth, setDepth] = useState("");
  const [results, setResults] = useState<{
    area: number;
    volume: number;
  } | null>(null);

  // Convert input to meters
  const convertToMeters = (value: number): number => {
    switch (inputUnit) {
      case "meter":
        return value;
      case "feet":
        return value * 0.3048;
      case "centimeter":
        return value / 100;
      default:
        return value;
    }
  };

  // Convert square meters to selected output unit
  const convertArea = (areaInSqMeters: number): { value: number; unit: string } => {
    switch (outputUnit) {
      case "shotak":
        return { value: areaInSqMeters / 40.47, unit: "শতক" };
      case "katha":
        return { value: areaInSqMeters / 66.89, unit: "কাঠা" };
      case "bigha":
        return { value: areaInSqMeters / 1338.84, unit: "বিঘা" };
      case "acre":
        return { value: areaInSqMeters / 4046.86, unit: "একর" };
      case "hectare":
        return { value: areaInSqMeters / 10000, unit: "হেক্টর" };
      default:
        return { value: areaInSqMeters, unit: "বর্গ মিটার" };
    }
  };

  const calculatePond = () => {
    let area = 0;
    const depthNum = parseFloat(depth);

    if (!depthNum || depthNum <= 0) {
      toast.error("অনুগ্রহ করে সঠিক গভীরতা প্রদান করুন");
      return;
    }

    const depthInMeters = convertToMeters(depthNum);

    switch (shape) {
      case "rectangle":
        const lengthNum = parseFloat(length);
        const widthNum = parseFloat(width);
        if (!lengthNum || !widthNum || lengthNum <= 0 || widthNum <= 0) {
          toast.error("অনুগ্রহ করে সঠিক দৈর্ঘ্য এবং প্রস্থ প্রদান করুন");
          return;
        }
        area = convertToMeters(lengthNum) * convertToMeters(widthNum);
        break;

      case "square":
        const sideLength = parseFloat(length);
        if (!sideLength || sideLength <= 0) {
          toast.error("অনুগ্রহ করে সঠিক বাহুর দৈর্ঘ্য প্রদান করুন");
          return;
        }
        const sideInMeters = convertToMeters(sideLength);
        area = sideInMeters * sideInMeters;
        break;

      case "circle":
        const radiusNum = parseFloat(radius);
        if (!radiusNum || radiusNum <= 0) {
          toast.error("অনুগ্রহ করে সঠিক ব্যাসার্ধ প্রদান করুন");
          return;
        }
        const radiusInMeters = convertToMeters(radiusNum);
        area = Math.PI * radiusInMeters * radiusInMeters;
        break;

      case "trapezoid":
        const topNum = parseFloat(topLength);
        const bottomNum = parseFloat(bottomLength);
        const heightNum = parseFloat(width);
        if (!topNum || !bottomNum || !heightNum || topNum <= 0 || bottomNum <= 0 || heightNum <= 0) {
          toast.error("অনুগ্রহ করে সঠিক মাপ প্রদান করুন");
          return;
        }
        area = ((convertToMeters(topNum) + convertToMeters(bottomNum)) / 2) * convertToMeters(heightNum);
        break;
    }

    const volume = area * depthInMeters;
    setResults({ area, volume });
    
    // Save to context
    setPondData({
      area,
      volume,
      depth: depthInMeters,
      shape,
      unit: inputUnit,
    });
    
    toast.success("গণনা সম্পন্ন হয়েছে!");
  };

  const saveAndContinue = () => {
    if (!results) {
      toast.error("প্রথমে গণনা করুন");
      return;
    }
    toast.success("পুকুরের তথ্য সংরক্ষিত হয়েছে! পরবর্তী মডিউলে যাচ্ছেন...");
    setTimeout(() => {
      navigate("/stocking-density");
    }, 1000);
  };

  const resetForm = () => {
    setLength("");
    setWidth("");
    setRadius("");
    setTopLength("");
    setBottomLength("");
    setDepth("");
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CalculatorSwitcher />
      
      {/* Header Ad */}
      <div className="container mx-auto px-4 py-4">
        <AdUnit position="header" className="mb-4" />
      </div>
      
      <main className="container py-8 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              পুকুরের জায়গা ও পানির আয়তন ক্যালকুলেটর
            </h1>
            <p className="text-muted-foreground">
              আপনার পুকুরের সঠিক পরিমাপ এবং পানির আয়তন নির্ণয় করুন
            </p>
          </div>

          {/* Calculator Card */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary" />
                পুকুরের তথ্য প্রদান করুন
              </CardTitle>
              <CardDescription>
                পুকুরের আকৃতি নির্বাচন করুন এবং প্রয়োজনীয় মাপ দিন (মিটারে)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Unit Selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inputUnit">পরিমাপের একক</Label>
                  <Select value={inputUnit} onValueChange={(value) => setInputUnit(value as InputUnit)}>
                    <SelectTrigger id="inputUnit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meter">মিটার (Meter)</SelectItem>
                      <SelectItem value="feet">ফুট (Feet)</SelectItem>
                      <SelectItem value="centimeter">সেন্টিমিটার (Centimeter)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outputUnit">ফলাফলের একক</Label>
                  <Select value={outputUnit} onValueChange={(value) => setOutputUnit(value as OutputUnit)}>
                    <SelectTrigger id="outputUnit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shotak">শতক (Shotak)</SelectItem>
                      <SelectItem value="katha">কাঠা (Katha)</SelectItem>
                      <SelectItem value="bigha">বিঘা (Bigha)</SelectItem>
                      <SelectItem value="acre">একর (Acre)</SelectItem>
                      <SelectItem value="hectare">হেক্টর (Hectare)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Shape Selection */}
              <div className="space-y-2">
                <Label htmlFor="shape">পুকুরের আকৃতি</Label>
                <Select value={shape} onValueChange={(value) => {
                  setShape(value as PondShape);
                  resetForm();
                }}>
                  <SelectTrigger id="shape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">
                      <div className="flex items-center gap-3">
                        <img src={pondRectangle} alt="আয়তাকার" className="w-8 h-8 rounded object-cover" />
                        <span>আয়তাকার (Rectangle)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="square">
                      <div className="flex items-center gap-3">
                        <img src={pondSquare} alt="বর্গাকার" className="w-8 h-8 rounded object-cover" />
                        <span>বর্গাকার (Square)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="circle">
                      <div className="flex items-center gap-3">
                        <img src={pondCircle} alt="বৃত্তাকার" className="w-8 h-8 rounded object-cover" />
                        <span>বৃত্তাকার (Circle)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="trapezoid">
                      <div className="flex items-center gap-3">
                        <img src={pondTrapezoid} alt="ট্র্যাপিজয়েড" className="w-8 h-8 rounded object-cover" />
                        <span>ট্র্যাপিজয়েড (Trapezoid)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Shape-specific inputs */}
              <div className="grid gap-4">
                {shape === "rectangle" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="length">দৈর্ঘ্য ({inputUnit === "meter" ? "মিটার" : inputUnit === "feet" ? "ফুট" : "সেন্টিমিটার"})</Label>
                      <Input
                        id="length"
                        type="number"
                        placeholder="উদাহরণ: 50"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="width">প্রস্থ ({inputUnit === "meter" ? "মিটার" : inputUnit === "feet" ? "ফুট" : "সেন্টিমিটার"})</Label>
                      <Input
                        id="width"
                        type="number"
                        placeholder="উদাহরণ: 30"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </>
                )}

                {shape === "square" && (
                  <div className="space-y-2">
                    <Label htmlFor="side">বাহুর দৈর্ঘ্য ({inputUnit === "meter" ? "মিটার" : inputUnit === "feet" ? "ফুট" : "সেন্টিমিটার"})</Label>
                    <Input
                      id="side"
                      type="number"
                      placeholder="উদাহরণ: 40"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                )}

                {shape === "circle" && (
                  <div className="space-y-2">
                    <Label htmlFor="radius">ব্যাসার্ধ ({inputUnit === "meter" ? "মিটার" : inputUnit === "feet" ? "ফুট" : "সেন্টিমিটার"})</Label>
                    <Input
                      id="radius"
                      type="number"
                      placeholder="উদাহরণ: 25"
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                )}

                {shape === "trapezoid" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="topLength">উপরের বাহুর দৈর্ঘ্য ({inputUnit === "meter" ? "মিটার" : inputUnit === "feet" ? "ফুট" : "সেন্টিমিটার"})</Label>
                      <Input
                        id="topLength"
                        type="number"
                        placeholder="উদাহরণ: 40"
                        value={topLength}
                        onChange={(e) => setTopLength(e.target.value)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bottomLength">নিচের বাহুর দৈর্ঘ্য ({inputUnit === "meter" ? "মিটার" : inputUnit === "feet" ? "ফুট" : "সেন্টিমিটার"})</Label>
                      <Input
                        id="bottomLength"
                        type="number"
                        placeholder="উদাহরণ: 50"
                        value={bottomLength}
                        onChange={(e) => setBottomLength(e.target.value)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trapHeight">উচ্চতা ({inputUnit === "meter" ? "মিটার" : inputUnit === "feet" ? "ফুট" : "সেন্টিমিটার"})</Label>
                      <Input
                        id="trapHeight"
                        type="number"
                        placeholder="উদাহরণ: 30"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </>
                )}

                {/* Common depth input */}
                <div className="space-y-2">
                  <Label htmlFor="depth">পানির গভীরতা ({inputUnit === "meter" ? "মিটার" : inputUnit === "feet" ? "ফুট" : "সেন্টিমিটার"})</Label>
                  <Input
                    id="depth"
                    type="number"
                    placeholder="উদাহরণ: 2.5"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button3D 
                  type="button"
                  onClick={calculatePond} 
                  variant="primary"
                  size="lg"
                  className="flex-1"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  গণনা করুন
                </Button3D>
                <Button3D 
                  type="button"
                  onClick={resetForm} 
                  variant="danger"
                  size="lg"
                >
                  রিসেট
                </Button3D>
              </div>
            </CardContent>
          </Card>

          {/* Results Card */}
          {results && (
            <Card className="shadow-medium border-primary/20 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Droplets className="h-5 w-5" />
                  গণনার ফলাফল
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-card rounded-lg p-4 space-y-1">
                    <p className="text-sm text-muted-foreground">পুকুরের ক্ষেত্রফল</p>
                    <p className="text-3xl font-bold text-foreground">
                      {convertArea(results.area).value.toFixed(2)}
                      <span className="text-lg ml-1 text-muted-foreground">{convertArea(results.area).unit}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ({results.area.toFixed(2)} বর্গ মিটার)
                    </p>
                  </div>
                  <div className="bg-gradient-card rounded-lg p-4 space-y-1">
                    <p className="text-sm text-muted-foreground">পানির আয়তন</p>
                    <p className="text-3xl font-bold text-primary">
                      {results.volume.toFixed(2)}
                      <span className="text-lg ml-1 text-muted-foreground">ঘন মিটার</span>
                    </p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">অতিরিক্ত তথ্য:</p>
                  <ul className="text-sm space-y-1 text-foreground">
                    <li>• ১ ঘন মিটার = ১,০০০ লিটার পানি</li>
                    <li>• মোট পানির পরিমাণ: <span className="font-semibold">{(results.volume * 1000).toFixed(0)} লিটার</span></li>
                    <li>• এই আয়তন পরবর্তী মডিউলগুলিতে ব্যবহার করা হবে</li>
                  </ul>
                </div>
                <div className="flex justify-end">
                  <Button3D
                    type="button"
                    onClick={saveAndContinue}
                    size="lg"
                    variant="success"
                  >
                    সংরক্ষণ করুন এবং পরবর্তী মডিউলে যান
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button3D>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Recommended Products */}
        <RecommendedProductsSlider category="calculator_related" />

        {/* Footer Ad */}
        <div className="mt-8">
          <AdUnit position="footer" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
