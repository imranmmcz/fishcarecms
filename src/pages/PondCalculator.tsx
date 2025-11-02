import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Droplets, Ruler } from "lucide-react";
import { toast } from "sonner";

type PondShape = "rectangle" | "square" | "circle" | "trapezoid";

export default function PondCalculator() {
  const [shape, setShape] = useState<PondShape>("rectangle");
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

  const calculatePond = () => {
    let area = 0;
    const depthNum = parseFloat(depth);

    if (!depthNum || depthNum <= 0) {
      toast.error("অনুগ্রহ করে সঠিক গভীরতা প্রদান করুন");
      return;
    }

    switch (shape) {
      case "rectangle":
        const lengthNum = parseFloat(length);
        const widthNum = parseFloat(width);
        if (!lengthNum || !widthNum || lengthNum <= 0 || widthNum <= 0) {
          toast.error("অনুগ্রহ করে সঠিক দৈর্ঘ্য এবং প্রস্থ প্রদান করুন");
          return;
        }
        area = lengthNum * widthNum;
        break;

      case "square":
        const sideLength = parseFloat(length);
        if (!sideLength || sideLength <= 0) {
          toast.error("অনুগ্রহ করে সঠিক বাহুর দৈর্ঘ্য প্রদান করুন");
          return;
        }
        area = sideLength * sideLength;
        break;

      case "circle":
        const radiusNum = parseFloat(radius);
        if (!radiusNum || radiusNum <= 0) {
          toast.error("অনুগ্রহ করে সঠিক ব্যাসার্ধ প্রদান করুন");
          return;
        }
        area = Math.PI * radiusNum * radiusNum;
        break;

      case "trapezoid":
        const topNum = parseFloat(topLength);
        const bottomNum = parseFloat(bottomLength);
        const heightNum = parseFloat(width);
        if (!topNum || !bottomNum || !heightNum || topNum <= 0 || bottomNum <= 0 || heightNum <= 0) {
          toast.error("অনুগ্রহ করে সঠিক মাপ প্রদান করুন");
          return;
        }
        area = ((topNum + bottomNum) / 2) * heightNum;
        break;
    }

    const volume = area * depthNum;
    setResults({ area, volume });
    toast.success("গণনা সম্পন্ন হয়েছে!");
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
                    <SelectItem value="rectangle">আয়তাকার (Rectangle)</SelectItem>
                    <SelectItem value="square">বর্গাকার (Square)</SelectItem>
                    <SelectItem value="circle">বৃত্তাকার (Circle)</SelectItem>
                    <SelectItem value="trapezoid">ট্র্যাপিজয়েড (Trapezoid)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Shape-specific inputs */}
              <div className="grid gap-4">
                {shape === "rectangle" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="length">দৈর্ঘ্য (মিটার)</Label>
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
                      <Label htmlFor="width">প্রস্থ (মিটার)</Label>
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
                    <Label htmlFor="side">বাহুর দৈর্ঘ্য (মিটার)</Label>
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
                    <Label htmlFor="radius">ব্যাসার্ধ (মিটার)</Label>
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
                      <Label htmlFor="topLength">উপরের বাহুর দৈর্ঘ্য (মিটার)</Label>
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
                      <Label htmlFor="bottomLength">নিচের বাহুর দৈর্ঘ্য (মিটার)</Label>
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
                      <Label htmlFor="trapHeight">উচ্চতা (মিটার)</Label>
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
                  <Label htmlFor="depth">পানির গভীরতা (মিটার)</Label>
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
                <Button 
                  onClick={calculatePond} 
                  className="flex-1 bg-gradient-primary hover:opacity-90"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  গণনা করুন
                </Button>
                <Button 
                  onClick={resetForm} 
                  variant="outline"
                >
                  রিসেট
                </Button>
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
                      {results.area.toFixed(2)}
                      <span className="text-lg ml-1 text-muted-foreground">বর্গ মিটার</span>
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
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
