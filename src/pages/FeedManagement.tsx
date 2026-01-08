import { useState } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wheat } from "lucide-react";

export default function FeedManagement() {
  const [totalBiomass, setTotalBiomass] = useState("");
  const [waterTemp, setWaterTemp] = useState("");
  const [feedType, setFeedType] = useState("");
  const [proteinContent, setProteinContent] = useState("");
  const [result, setResult] = useState<{
    dailyFeed: number;
    feedPerMeal: number;
    monthlyFeed: number;
    fcr: number;
  } | null>(null);

  const feedTypes = [
    { value: "starter", label: "স্টার্টার ফিড (40-45% প্রোটিন)", rate: 8 },
    { value: "grower", label: "গ্রোয়ার ফিড (32-35% প্রোটিন)", rate: 5 },
    { value: "finisher", label: "ফিনিশার ফিড (28-30% প্রোটিন)", rate: 3 },
  ];

  const calculateFeed = () => {
    if (!totalBiomass || !feedType) return;

    const biomass = parseFloat(totalBiomass);
    const selectedFeed = feedTypes.find(f => f.value === feedType);
    const feedRate = selectedFeed ? selectedFeed.rate : 5;

    const dailyFeed = Math.round((biomass * feedRate / 100) * 100) / 100;
    const feedPerMeal = Math.round((dailyFeed / 3) * 100) / 100; // 3 meals per day
    const monthlyFeed = Math.round((dailyFeed * 30) * 100) / 100;
    
    // Typical FCR based on feed type
    const fcrMap: { [key: string]: number } = {
      starter: 1.2,
      grower: 1.5,
      finisher: 1.8,
    };
    const fcr = fcrMap[feedType] || 1.5;

    setResult({
      dailyFeed,
      feedPerMeal,
      monthlyFeed,
      fcr
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
                <Wheat className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">খাদ্য ব্যবস্থাপনা ক্যালকুলেটর</h1>
                <p className="text-muted-foreground mt-1">দৈনিক খাদ্যের সঠিক পরিমাণ নির্ধারণ করুন</p>
              </div>
            </div>
          </div>

          <Card className="shadow-elegant animate-slide-in">
            <CardHeader>
              <CardTitle>খাদ্য গণনা</CardTitle>
              <CardDescription>বায়োমাস এবং মাছের বয়স অনুযায়ী খাদ্যের পরিমাণ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalBiomass">মোট বায়োমাস (কেজি)</Label>
                  <Input
                    id="totalBiomass"
                    type="number"
                    placeholder="যেমন: 500"
                    value={totalBiomass}
                    onChange={(e) => setTotalBiomass(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waterTemp">পানির তাপমাত্রা (°C)</Label>
                  <Input
                    id="waterTemp"
                    type="number"
                    placeholder="যেমন: 28"
                    value={waterTemp}
                    onChange={(e) => setWaterTemp(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="feedType">খাদ্যের ধরন</Label>
                  <Select value={feedType} onValueChange={setFeedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="খাদ্যের ধরন নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedTypes.map((feed) => (
                        <SelectItem key={feed.value} value={feed.value}>
                          {feed.label} - {feed.rate}% বায়োমাস
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proteinContent">প্রোটিন শতাংশ (%)</Label>
                  <Input
                    id="proteinContent"
                    type="number"
                    placeholder="যেমন: 32"
                    value={proteinContent}
                    onChange={(e) => setProteinContent(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={calculateFeed} className="w-full" size="lg">
                খাদ্য হিসাব করুন
              </Button>

              {result && (
                <div className="mt-6 p-6 bg-gradient-card border border-primary/20 rounded-lg space-y-4 animate-fade-in">
                  <h3 className="text-xl font-semibold text-primary mb-4">ফলাফল</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">দৈনিক খাদ্য</p>
                      <p className="text-2xl font-bold text-primary">{result.dailyFeed} কেজি</p>
                    </div>

                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">প্রতি বেলা খাদ্য (৩ বেলা)</p>
                      <p className="text-2xl font-bold text-primary">{result.feedPerMeal} কেজি</p>
                    </div>

                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">মাসিক খাদ্য</p>
                      <p className="text-2xl font-bold text-primary">{result.monthlyFeed} কেজি</p>
                    </div>

                    <div className="bg-background/50 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">আনুমানিক FCR</p>
                      <p className="text-2xl font-bold text-primary">{result.fcr}</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">খাদ্য প্রয়োগের নিয়ম:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>দিনে ৩ বার খাদ্য দিন (সকাল ৮টা, দুপুর ১২টা, বিকাল ৫টা)</li>
                      <li>খাদ্য ধীরে ধীরে ছিটিয়ে দিন, একসাথে নয়</li>
                      <li>মেঘলা দিনে খাদ্যের পরিমাণ কমান</li>
                      <li>নিয়মিত বায়োমাস মাপুন এবং খাদ্য সামঞ্জস্য করুন</li>
                      <li>সকালে DO কম থাকলে খাদ্য বন্ধ রাখুন</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6 shadow-elegant">
            <CardHeader>
              <CardTitle>FCR (Feed Conversion Ratio) কি?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                FCR হল ১ কেজি মাছের ওজন বাড়াতে কত কেজি খাদ্য লাগে তার অনুপাত। কম FCR মানে ভালো খাদ্য দক্ষতা।
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="font-semibold text-green-700 dark:text-green-400">উৎকৃষ্ট FCR</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">1.2 - 1.5</p>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-400">গ্রহণযোগ্য FCR</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">1.5 - 2.0</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="font-semibold text-red-700 dark:text-red-400">উন্নতি প্রয়োজন</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">&gt; 2.0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
