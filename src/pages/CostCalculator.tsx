import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, TrendingUp, TrendingDown, Info, CheckCircle2, AlertTriangle } from "lucide-react";
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
    fishSalesWeight: "",
    fishPricePerKg: "",
    oldNetSales: "",
    pondLease: "",
    byProducts: "",
    otherIncome: "",
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
    const fishSalesWeight = parseFloat(income.fishSalesWeight) || 0;
    const fishPricePerKg = parseFloat(income.fishPricePerKg) || 0;
    const fishSalesIncome = fishSalesWeight * fishPricePerKg;
    const oldNetSales = parseFloat(income.oldNetSales) || 0;
    const pondLease = parseFloat(income.pondLease) || 0;
    const byProducts = parseFloat(income.byProducts) || 0;
    const otherIncome = parseFloat(income.otherIncome) || 0;
    
    const totalIncome = fishSalesIncome + oldNetSales + pondLease + byProducts + otherIncome;

    // আয়ের বিস্তারিত
    const incomeBreakdown = [
      { name: "মাছ বিক্রয়", amount: fishSalesIncome, percentage: totalIncome > 0 ? (fishSalesIncome / totalIncome) * 100 : 0 },
      { name: "পুরাতন জাল/সরঞ্জাম বিক্রয়", amount: oldNetSales, percentage: totalIncome > 0 ? (oldNetSales / totalIncome) * 100 : 0 },
      { name: "পুকুর ভাড়া/লিজ", amount: pondLease, percentage: totalIncome > 0 ? (pondLease / totalIncome) * 100 : 0 },
      { name: "উপজাত বিক্রয়", amount: byProducts, percentage: totalIncome > 0 ? (byProducts / totalIncome) * 100 : 0 },
      { name: "অন্যান্য আয়", amount: otherIncome, percentage: totalIncome > 0 ? (otherIncome / totalIncome) * 100 : 0 },
    ];

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

    // ROI (Return on Investment)
    const roi = totalCost > 0 ? ((profitLoss / totalCost) * 100) : 0;
    
    // Cost per kg of fish
    const costPerKg = fishSalesWeight > 0 ? (totalCost / fishSalesWeight) : 0;
    const revenuePerKg = fishSalesWeight > 0 ? (totalIncome / fishSalesWeight) : 0;

    setResult({
      costBreakdown,
      incomeBreakdown,
      totalCost,
      totalIncome,
      profitLoss,
      profitMargin,
      isProfitable: profitLoss > 0,
      roi,
      costPerKg,
      revenuePerKg,
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
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>৮. আয়ের হিসাব</CardTitle>
                <CardDescription>সকল খাত থেকে আয়ের বিস্তারিত</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fishSalesWeight">মাছ বিক্রয় - মোট ওজন (কেজি)</Label>
                    <Input
                      id="fishSalesWeight"
                      type="number"
                      placeholder="যেমন: 1500"
                      value={income.fishSalesWeight}
                      onChange={(e) => setIncome({...income, fishSalesWeight: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fishPricePerKg">মাছের দাম (প্রতি কেজি টাকা)</Label>
                    <Input
                      id="fishPricePerKg"
                      type="number"
                      placeholder="যেমন: 200"
                      value={income.fishPricePerKg}
                      onChange={(e) => setIncome({...income, fishPricePerKg: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oldNetSales">পুরাতন জাল/সরঞ্জাম বিক্রয় (টাকা)</Label>
                    <Input
                      id="oldNetSales"
                      type="number"
                      placeholder="0"
                      value={income.oldNetSales}
                      onChange={(e) => setIncome({...income, oldNetSales: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pondLease">পুকুর ভাড়া/লিজ আয় (টাকা)</Label>
                    <Input
                      id="pondLease"
                      type="number"
                      placeholder="0"
                      value={income.pondLease}
                      onChange={(e) => setIncome({...income, pondLease: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="byProducts">উপজাত বিক্রয় (কাদা, গোবর ইত্যাদি) (টাকা)</Label>
                    <Input
                      id="byProducts"
                      type="number"
                      placeholder="0"
                      value={income.byProducts}
                      onChange={(e) => setIncome({...income, byProducts: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherIncome">অন্যান্য আয় (টাকা)</Label>
                    <Input
                      id="otherIncome"
                      type="number"
                      placeholder="0"
                      value={income.otherIncome}
                      onChange={(e) => setIncome({...income, otherIncome: e.target.value})}
                    />
                  </div>
                </div>
                {income.fishSalesWeight && income.fishPricePerKg && (
                  <Alert className="bg-green-50 border-green-200 mt-4">
                    <AlertDescription className="text-green-800">
                      মাছ বিক্রয় থেকে আয়: <strong>৳{(parseFloat(income.fishSalesWeight) * parseFloat(income.fishPricePerKg)).toFixed(2)}</strong>
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
              {/* আর্থিক ড্যাশবোর্ড - সারসংক্ষেপ */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">আর্থিক ড্যাশবোর্ড</h2>
                <p className="text-muted-foreground">খামারের সম্পূর্ণ আয়-ব্যয় এবং লাভজনকতা বিশ্লেষণ</p>
              </div>

              {/* প্রধান সংখ্যা */}
              <Card className={`border-2 ${result.isProfitable ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {result.isProfitable ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                    <CardTitle className={result.isProfitable ? 'text-green-800' : 'text-red-800'}>
                      {result.isProfitable ? '✓ লাভজনক খামার' : '✗ ক্ষতিগ্রস্ত খামার'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-5 gap-4">
                    <div className="bg-background rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">মোট খরচ</div>
                      <div className="text-2xl font-bold text-red-600">৳{result.totalCost.toLocaleString('bn-BD')}</div>
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">মোট আয়</div>
                      <div className="text-2xl font-bold text-green-600">৳{result.totalIncome.toLocaleString('bn-BD')}</div>
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">নিট লাভ/ক্ষতি</div>
                      <div className={`text-2xl font-bold ${result.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                        {result.isProfitable ? '+' : ''}৳{result.profitLoss.toLocaleString('bn-BD')}
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">লাভের মার্জিন</div>
                      <div className={`text-2xl font-bold ${result.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                        {result.profitMargin.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">ROI</div>
                      <div className={`text-2xl font-bold ${result.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.roi > 0 ? '+' : ''}{result.roi.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">বিনিয়োগ রিটার্ন</div>
                    </div>
                  </div>
                  
                  {result.costPerKg > 0 && (
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-background rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">প্রতি কেজি উৎপাদন খরচ</div>
                        <div className="text-xl font-bold text-foreground">৳{result.costPerKg.toFixed(2)}</div>
                      </div>
                      <div className="bg-background rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">প্রতি কেজি বিক্রয় মূল্য</div>
                        <div className="text-xl font-bold text-foreground">৳{result.revenuePerKg.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* খরচ এবং আয়ের তুলনামূলক বিশ্লেষণ */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* খরচের বিস্তারিত */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">খরচের বিস্তারিত বিশ্লেষণ</CardTitle>
                    <CardDescription>মোট খরচ: ৳{result.totalCost.toLocaleString('bn-BD')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.costBreakdown
                      .filter((item: any) => item.amount > 0)
                      .map((item: any, index: number) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                          <div className="text-right">
                            <div className="text-sm font-bold text-foreground">৳{item.amount.toLocaleString('bn-BD')}</div>
                            <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        {index < result.costBreakdown.filter((i: any) => i.amount > 0).length - 1 && <Separator className="mt-3" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* আয়ের বিস্তারিত */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">আয়ের বিস্তারিত বিশ্লেষণ</CardTitle>
                    <CardDescription>মোট আয়: ৳{result.totalIncome.toLocaleString('bn-BD')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.incomeBreakdown
                      .filter((item: any) => item.amount > 0)
                      .map((item: any, index: number) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                          <div className="text-right">
                            <div className="text-sm font-bold text-foreground">৳{item.amount.toLocaleString('bn-BD')}</div>
                            <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        {index < result.incomeBreakdown.filter((i: any) => i.amount > 0).length - 1 && <Separator className="mt-3" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* পরামর্শ এবং কর্মপরিকল্পনা */}
              <Card>
                <CardHeader>
                  <CardTitle>বিশেষজ্ঞ পরামর্শ এবং কর্মপরিকল্পনা</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.isProfitable ? (
                    <>
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>অভিনন্দন!</strong> আপনার খামার লাভজনক অবস্থায় আছে। ROI {result.roi.toFixed(1)}% যা ভালো বিনিয়োগ নির্দেশ করে।
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2 text-sm">
                        <h4 className="font-semibold text-foreground">লাভজনকতা আরও বৃদ্ধির উপায়:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>খাদ্য রূপান্তর হার (FCR) উন্নত করে খাদ্য খরচ ১০-১৫% কমান</li>
                          <li>পানির গুণমান সঠিক রেখে ঔষধ খরচ কমান</li>
                          <li>উচ্চমূল্যের মাছের জাত চাষ করে আয় বৃদ্ধি করুন</li>
                          <li>মজুদ ঘনত্ব সঠিক রেখে প্রতি হেক্টরে উৎপাদন বাড়ান</li>
                          <li>পুকুরের উপজাত (কাদা, জৈব সার) বিক্রয় করে অতিরিক্ত আয় করুন</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <Alert className="bg-red-50 border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <strong>সতর্কতা!</strong> আপনার খামারে ক্ষতি হচ্ছে (৳{Math.abs(result.profitLoss).toLocaleString('bn-BD')})। জরুরি পদক্ষেপ প্রয়োজন।
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2 text-sm">
                        <h4 className="font-semibold text-foreground">ক্ষতি কমানোর জরুরি পদক্ষেপ:</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {result.costBreakdown.find((item: any) => item.name === "খাদ্য" && item.percentage > 50) && (
                            <li><strong>খাদ্য খরচ অতিরিক্ত ({result.costBreakdown.find((item: any) => item.name === "খাদ্য")?.percentage.toFixed(1)}%):</strong> FCR পরীক্ষা করুন, খাদ্যের মান যাচাই করুন</li>
                          )}
                          {result.costBreakdown.find((item: any) => item.name === "পোনা ক্রয়" && item.percentage > 25) && (
                            <li><strong>পোনা খরচ বেশি ({result.costBreakdown.find((item: any) => item.name === "পোনা ক্রয়")?.percentage.toFixed(1)}%):</strong> স্থানীয় হ্যাচারি থেকে কম দামে মানসম্পন্ন পোনা সংগ্রহ করুন</li>
                          )}
                          {result.revenuePerKg < result.costPerKg && (
                            <li><strong>বিক্রয়মূল্য কম:</strong> উৎপাদন খরচ (৳{result.costPerKg.toFixed(2)}/কেজি) থেকে কম দামে (৳{result.revenuePerKg.toFixed(2)}/কেজি) বিক্রয় হচ্ছে। বাজার যাচাই করুন</li>
                          )}
                          <li>শ্রম খরচ কমাতে অটোমেশন (অটো ফিডার, টাইমার) ব্যবহার করুন</li>
                          <li>বিদ্যুৎ খরচ কমাতে সৌর প্যানেল ব্যবহার বিবেচনা করুন</li>
                          <li>পরবর্তী চক্রে মজুদ ঘনত্ব এবং খাদ্য ব্যবস্থাপনা পুনর্মূল্যায়ন করুন</li>
                        </ul>
                      </div>
                    </>
                  )}

                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <h4 className="font-semibold text-foreground">সাধারণ পরামর্শ:</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>প্রতিদিন খরচ এবং আয়ের হিসাব রাখুন</li>
                      <li>পানির গুণমান নিয়মিত পরীক্ষা করুন (pH, DO, NH₃)</li>
                      <li>মাছের স্বাস্থ্য পর্যবেক্ষণ করুন এবং রোগ প্রতিরোধে সচেষ্ট থাকুন</li>
                      <li>বাজার দর নিয়মিত জেনে রাখুন এবং সঠিক সময়ে মাছ বিক্রয় করুন</li>
                      <li>অভিজ্ঞ মৎস্য চাষী এবং বিশেষজ্ঞদের পরামর্শ নিন</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostCalculator;
