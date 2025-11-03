import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, TrendingUp, TrendingDown, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CostItem {
  name: string;
  amount: number;
}

const CostCalculator = () => {
  // পুকুর প্রস্তুতি খরচ
  const [pondPreparation, setPondPreparation] = useState({
    lime: "",
    urea: "",
    tsp: "",
    cowdung: "",
    labor: "",
    pondDigging: "",
  });

  // পোনা ক্রয়
  const [fingerlings, setFingerlings] = useState({
    quantity: "",
    pricePerPiece: "",
  });

  // খাদ্য খরচ
  const [feedCost, setFeedCost] = useState({
    totalFeed: "",
    pricePerKg: "",
  });

  // ঔষধ ও চিকিৎসা
  const [medicineCost, setMedicineCost] = useState({
    disinfectant: "",
    antibiotics: "",
    probiotics: "",
    vitamins: "",
  });

  // শ্রম খরচ
  const [laborCost, setLaborCost] = useState({
    dailyWage: "",
    numberOfDays: "",
    permanentLabor: "",
  });

  // বিদ্যুৎ ও জ্বালানি
  const [utilityCost, setUtilityCost] = useState({
    electricity: "",
    diesel: "",
  });

  // অন্যান্য খরচ
  const [otherCost, setOtherCost] = useState({
    netEquipment: "",
    waterPump: "",
    aerator: "",
    miscellaneous: "",
  });

  // আয়
  const [income, setIncome] = useState({
    fishWeight: "",
    pricePerKg: "",
  });

  const [result, setResult] = useState<any>(null);

  const calculateCost = () => {
    // পুকুর প্রস্তুতি খরচ
    const prepCosts: CostItem[] = [
      { name: "চুন", amount: parseFloat(pondPreparation.lime) || 0 },
      { name: "ইউরিয়া", amount: parseFloat(pondPreparation.urea) || 0 },
      { name: "টিএসপি", amount: parseFloat(pondPreparation.tsp) || 0 },
      { name: "গোবর", amount: parseFloat(pondPreparation.cowdung) || 0 },
      { name: "শ্রমিক", amount: parseFloat(pondPreparation.labor) || 0 },
      { name: "পুকুর খনন/মেরামত", amount: parseFloat(pondPreparation.pondDigging) || 0 },
    ];
    const totalPrepCost = prepCosts.reduce((sum, item) => sum + item.amount, 0);

    // পোনা খরচ
    const fingerlingsQuantity = parseFloat(fingerlings.quantity) || 0;
    const fingerlingsPrice = parseFloat(fingerlings.pricePerPiece) || 0;
    const totalFingerlingseCost = fingerlingsQuantity * fingerlingsPrice;

    // খাদ্য খরচ
    const totalFeed = parseFloat(feedCost.totalFeed) || 0;
    const feedPrice = parseFloat(feedCost.pricePerKg) || 0;
    const totalFeedCost = totalFeed * feedPrice;

    // ঔষধ খরচ
    const medicineCosts: CostItem[] = [
      { name: "জীবাণুনাশক", amount: parseFloat(medicineCost.disinfectant) || 0 },
      { name: "এন্টিবায়োটিক", amount: parseFloat(medicineCost.antibiotics) || 0 },
      { name: "প্রোবায়োটিক", amount: parseFloat(medicineCost.probiotics) || 0 },
      { name: "ভিটামিন", amount: parseFloat(medicineCost.vitamins) || 0 },
    ];
    const totalMedicineCost = medicineCosts.reduce((sum, item) => sum + item.amount, 0);

    // শ্রম খরচ
    const dailyWage = parseFloat(laborCost.dailyWage) || 0;
    const numberOfDays = parseFloat(laborCost.numberOfDays) || 0;
    const permanentLabor = parseFloat(laborCost.permanentLabor) || 0;
    const totalLaborCost = (dailyWage * numberOfDays) + permanentLabor;

    // বিদ্যুৎ খরচ
    const totalUtilityCost = (parseFloat(utilityCost.electricity) || 0) + (parseFloat(utilityCost.diesel) || 0);

    // অন্যান্য খরচ
    const otherCosts: CostItem[] = [
      { name: "জাল ও সরঞ্জাম", amount: parseFloat(otherCost.netEquipment) || 0 },
      { name: "পানির পাম্প", amount: parseFloat(otherCost.waterPump) || 0 },
      { name: "এয়ারেটর", amount: parseFloat(otherCost.aerator) || 0 },
      { name: "অন্যান্য", amount: parseFloat(otherCost.miscellaneous) || 0 },
    ];
    const totalOtherCost = otherCosts.reduce((sum, item) => sum + item.amount, 0);

    // মোট খরচ
    const totalCost = totalPrepCost + totalFingerlingseCost + totalFeedCost + 
                     totalMedicineCost + totalLaborCost + totalUtilityCost + totalOtherCost;

    // আয়
    const fishWeight = parseFloat(income.fishWeight) || 0;
    const fishPrice = parseFloat(income.pricePerKg) || 0;
    const totalIncome = fishWeight * fishPrice;

    // লাভ/ক্ষতি
    const profitLoss = totalIncome - totalCost;
    const profitMargin = totalIncome > 0 ? ((profitLoss / totalIncome) * 100) : 0;

    // খরচের শতাংশ বিশ্লেষণ
    const costBreakdown = [
      { name: "পুকুর প্রস্তুতি", amount: totalPrepCost, percentage: (totalPrepCost / totalCost) * 100 },
      { name: "পোনা ক্রয়", amount: totalFingerlingseCost, percentage: (totalFingerlingseCost / totalCost) * 100 },
      { name: "খাদ্য", amount: totalFeedCost, percentage: (totalFeedCost / totalCost) * 100 },
      { name: "ঔষধ", amount: totalMedicineCost, percentage: (totalMedicineCost / totalCost) * 100 },
      { name: "শ্রম", amount: totalLaborCost, percentage: (totalLaborCost / totalCost) * 100 },
      { name: "বিদ্যুৎ ও জ্বালানি", amount: totalUtilityCost, percentage: (totalUtilityCost / totalCost) * 100 },
      { name: "অন্যান্য", amount: totalOtherCost, percentage: (totalOtherCost / totalCost) * 100 },
    ];

    setResult({
      costBreakdown,
      totalCost,
      totalIncome,
      profitLoss,
      profitMargin,
      isProfitable: profitLoss > 0,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">খরচ হিসাব ও লাভ-ক্ষতি</h1>
            <p className="text-muted-foreground">মাছ চাষের সম্পূর্ণ আর্থিক হিসাব এবং লাভজনকতা বিশ্লেষণ</p>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              সঠিক খরচ হিসাব রাখলে লাভজনকতা বৃদ্ধি এবং অপচয় কমানো সম্ভব। সকল খরচ সঠিকভাবে লিপিবদ্ধ করুন।
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-6">
            {/* পুকুর প্রস্তুতি খরচ */}
            <Card>
              <CardHeader>
                <CardTitle>১. পুকুর প্রস্তুতি খরচ</CardTitle>
                <CardDescription>চুন, সার এবং পুকুর মেরামত</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lime">চুন (টাকা)</Label>
                  <Input
                    id="lime"
                    type="number"
                    placeholder="0"
                    value={pondPreparation.lime}
                    onChange={(e) => setPondPreparation({...pondPreparation, lime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urea">ইউরিয়া (টাকা)</Label>
                  <Input
                    id="urea"
                    type="number"
                    placeholder="0"
                    value={pondPreparation.urea}
                    onChange={(e) => setPondPreparation({...pondPreparation, urea: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tsp">টিএসপি (টাকা)</Label>
                  <Input
                    id="tsp"
                    type="number"
                    placeholder="0"
                    value={pondPreparation.tsp}
                    onChange={(e) => setPondPreparation({...pondPreparation, tsp: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cowdung">গোবর (টাকা)</Label>
                  <Input
                    id="cowdung"
                    type="number"
                    placeholder="0"
                    value={pondPreparation.cowdung}
                    onChange={(e) => setPondPreparation({...pondPreparation, cowdung: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prepLabor">প্রস্তুতি শ্রমিক (টাকা)</Label>
                  <Input
                    id="prepLabor"
                    type="number"
                    placeholder="0"
                    value={pondPreparation.labor}
                    onChange={(e) => setPondPreparation({...pondPreparation, labor: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="digging">পুকুর খনন/মেরামত (টাকা)</Label>
                  <Input
                    id="digging"
                    type="number"
                    placeholder="0"
                    value={pondPreparation.pondDigging}
                    onChange={(e) => setPondPreparation({...pondPreparation, pondDigging: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* পোনা ক্রয় খরচ */}
            <Card>
              <CardHeader>
                <CardTitle>২. পোনা ক্রয় খরচ</CardTitle>
                <CardDescription>পোনার সংখ্যা এবং দাম</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fingerlingsQty">পোনার সংখ্যা</Label>
                  <Input
                    id="fingerlingsQty"
                    type="number"
                    placeholder="যেমন: 5000"
                    value={fingerlings.quantity}
                    onChange={(e) => setFingerlings({...fingerlings, quantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fingerlingsPrice">প্রতি পোনার দাম (টাকা)</Label>
                  <Input
                    id="fingerlingsPrice"
                    type="number"
                    placeholder="যেমন: 2.5"
                    value={fingerlings.pricePerPiece}
                    onChange={(e) => setFingerlings({...fingerlings, pricePerPiece: e.target.value})}
                  />
                </div>
                {fingerlings.quantity && fingerlings.pricePerPiece && (
                  <Alert>
                    <AlertDescription>
                      মোট পোনা খরচ: <strong>৳{(parseFloat(fingerlings.quantity) * parseFloat(fingerlings.pricePerPiece)).toFixed(2)}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* খাদ্য খরচ */}
            <Card>
              <CardHeader>
                <CardTitle>৩. খাদ্য খরচ</CardTitle>
                <CardDescription>সম্পূর্ণ চক্রের খাদ্য খরচ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="totalFeed">মোট খাদ্য (কেজি)</Label>
                  <Input
                    id="totalFeed"
                    type="number"
                    placeholder="যেমন: 2000"
                    value={feedCost.totalFeed}
                    onChange={(e) => setFeedCost({...feedCost, totalFeed: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedPrice">প্রতি কেজি খাদ্যের দাম (টাকা)</Label>
                  <Input
                    id="feedPrice"
                    type="number"
                    placeholder="যেমন: 55"
                    value={feedCost.pricePerKg}
                    onChange={(e) => setFeedCost({...feedCost, pricePerKg: e.target.value})}
                  />
                </div>
                {feedCost.totalFeed && feedCost.pricePerKg && (
                  <Alert>
                    <AlertDescription>
                      মোট খাদ্য খরচ: <strong>৳{(parseFloat(feedCost.totalFeed) * parseFloat(feedCost.pricePerKg)).toFixed(2)}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* ঔষধ খরচ */}
            <Card>
              <CardHeader>
                <CardTitle>৪. ঔষধ ও চিকিৎসা খরচ</CardTitle>
                <CardDescription>রোগ প্রতিরোধ ও চিকিৎসা</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="disinfectant">জীবাণুনাশক (টাকা)</Label>
                  <Input
                    id="disinfectant"
                    type="number"
                    placeholder="0"
                    value={medicineCost.disinfectant}
                    onChange={(e) => setMedicineCost({...medicineCost, disinfectant: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="antibiotics">এন্টিবায়োটিক (টাকা)</Label>
                  <Input
                    id="antibiotics"
                    type="number"
                    placeholder="0"
                    value={medicineCost.antibiotics}
                    onChange={(e) => setMedicineCost({...medicineCost, antibiotics: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="probiotics">প্রোবায়োটিক (টাকা)</Label>
                  <Input
                    id="probiotics"
                    type="number"
                    placeholder="0"
                    value={medicineCost.probiotics}
                    onChange={(e) => setMedicineCost({...medicineCost, probiotics: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vitamins">ভিটামিন (টাকা)</Label>
                  <Input
                    id="vitamins"
                    type="number"
                    placeholder="0"
                    value={medicineCost.vitamins}
                    onChange={(e) => setMedicineCost({...medicineCost, vitamins: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* শ্রম খরচ */}
            <Card>
              <CardHeader>
                <CardTitle>৫. শ্রম খরচ</CardTitle>
                <CardDescription>দৈনিক ও স্থায়ী শ্রমিক</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyWage">দৈনিক মজুরি (টাকা)</Label>
                  <Input
                    id="dailyWage"
                    type="number"
                    placeholder="যেমন: 500"
                    value={laborCost.dailyWage}
                    onChange={(e) => setLaborCost({...laborCost, dailyWage: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfDays">মোট দিন</Label>
                  <Input
                    id="numberOfDays"
                    type="number"
                    placeholder="যেমন: 180"
                    value={laborCost.numberOfDays}
                    onChange={(e) => setLaborCost({...laborCost, numberOfDays: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="permanentLabor">স্থায়ী শ্রমিক বেতন (টাকা)</Label>
                  <Input
                    id="permanentLabor"
                    type="number"
                    placeholder="0"
                    value={laborCost.permanentLabor}
                    onChange={(e) => setLaborCost({...laborCost, permanentLabor: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* বিদ্যুৎ ও জ্বালানি */}
            <Card>
              <CardHeader>
                <CardTitle>৬. বিদ্যুৎ ও জ্বালানি খরচ</CardTitle>
                <CardDescription>এয়ারেটর, পাম্প ইত্যাদি</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="electricity">বিদ্যুৎ বিল (টাকা)</Label>
                  <Input
                    id="electricity"
                    type="number"
                    placeholder="0"
                    value={utilityCost.electricity}
                    onChange={(e) => setUtilityCost({...utilityCost, electricity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diesel">ডিজেল/জ্বালানি (টাকা)</Label>
                  <Input
                    id="diesel"
                    type="number"
                    placeholder="0"
                    value={utilityCost.diesel}
                    onChange={(e) => setUtilityCost({...utilityCost, diesel: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* অন্যান্য খরচ */}
            <Card>
              <CardHeader>
                <CardTitle>৭. অন্যান্য খরচ</CardTitle>
                <CardDescription>সরঞ্জাম ও যন্ত্রপাতি</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="netEquipment">জাল ও সরঞ্জাম (টাকা)</Label>
                  <Input
                    id="netEquipment"
                    type="number"
                    placeholder="0"
                    value={otherCost.netEquipment}
                    onChange={(e) => setOtherCost({...otherCost, netEquipment: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waterPump">পানির পাম্প (টাকা)</Label>
                  <Input
                    id="waterPump"
                    type="number"
                    placeholder="0"
                    value={otherCost.waterPump}
                    onChange={(e) => setOtherCost({...otherCost, waterPump: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aerator">এয়ারেটর (টাকা)</Label>
                  <Input
                    id="aerator"
                    type="number"
                    placeholder="0"
                    value={otherCost.aerator}
                    onChange={(e) => setOtherCost({...otherCost, aerator: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="miscellaneous">অন্যান্য (টাকা)</Label>
                  <Input
                    id="miscellaneous"
                    type="number"
                    placeholder="0"
                    value={otherCost.miscellaneous}
                    onChange={(e) => setOtherCost({...otherCost, miscellaneous: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* আয় */}
            <Card>
              <CardHeader>
                <CardTitle>৮. আয় হিসাব</CardTitle>
                <CardDescription>মাছ বিক্রয় থেকে আয়</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fishWeight">মোট মাছের ওজন (কেজি)</Label>
                  <Input
                    id="fishWeight"
                    type="number"
                    placeholder="যেমন: 1500"
                    value={income.fishWeight}
                    onChange={(e) => setIncome({...income, fishWeight: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fishPrice">প্রতি কেজি মাছের দাম (টাকা)</Label>
                  <Input
                    id="fishPrice"
                    type="number"
                    placeholder="যেমন: 200"
                    value={income.pricePerKg}
                    onChange={(e) => setIncome({...income, pricePerKg: e.target.value})}
                  />
                </div>
                {income.fishWeight && income.pricePerKg && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">
                      মোট আয়: <strong>৳{(parseFloat(income.fishWeight) * parseFloat(income.pricePerKg)).toFixed(2)}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          <Button onClick={calculateCost} className="w-full" size="lg">
            <DollarSign className="mr-2 h-5 w-5" />
            সম্পূর্ণ হিসাব করুন
          </Button>

          {result && (
            <div className="space-y-6">
              {/* সারসংক্ষেপ */}
              <Card className={`border-2 ${result.isProfitable ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {result.isProfitable ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                    <CardTitle className={result.isProfitable ? 'text-green-800' : 'text-red-800'}>
                      {result.isProfitable ? 'লাভজনক' : 'ক্ষতি'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-background rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">মোট খরচ</div>
                      <div className="text-2xl font-bold text-red-600">৳{result.totalCost.toFixed(2)}</div>
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">মোট আয়</div>
                      <div className="text-2xl font-bold text-green-600">৳{result.totalIncome.toFixed(2)}</div>
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">নিট লাভ/ক্ষতি</div>
                      <div className={`text-2xl font-bold ${result.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                        ৳{result.profitLoss.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        মার্জিন: {result.profitMargin.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* খরচের বিস্তারিত */}
              <Card>
                <CardHeader>
                  <CardTitle>খরচের বিস্তারিত বিশ্লেষণ</CardTitle>
                  <CardDescription>প্রতিটি ক্ষেত্রে খরচের হিসাব এবং শতাংশ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.costBreakdown.map((item: any, index: number) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        <div className="text-right">
                          <div className="text-sm font-bold text-foreground">৳{item.amount.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      {index < result.costBreakdown.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* পরামর্শ */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>পরামর্শ:</strong> {result.isProfitable 
                    ? 'খামার লাভজনক চলছে। বর্তমান ব্যবস্থাপনা অব্যাহত রাখুন। খাদ্য খরচ কমাতে FCR উন্নত করুন।'
                    : 'খামারে ক্ষতি হচ্ছে। খাদ্য খরচ, শ্রম খরচ কমানো এবং বিক্রয় মূল্য বৃদ্ধির দিকে মনোযোগ দিন।'
                  }
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostCalculator;
