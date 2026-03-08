import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Camera, Upload, Search, AlertTriangle, Shield, Pill, Stethoscope,
  Loader2, X, ChevronDown, ChevronUp, ShoppingCart, Bug, Zap, Droplets, Fish
} from "lucide-react";

interface DetectedDisease {
  name: string;
  name_en: string;
  confidence: number;
  severity: string;
  description: string;
  symptoms_matched: string[];
  causes: string[];
  treatment: { method: string; dosage: string; duration: string }[];
  prevention: string[];
  recommended_product_ids: string[];
  urgency: string;
}

interface DiagnosisResult {
  detected_diseases: DetectedDisease[];
  general_advice: string;
  water_quality_tips: string;
  feeding_advice: string;
  error?: string;
  raw_response?: string;
}

const symptomOptions = [
  { value: "শরীরে সাদা দাগ", label: "শরীরে সাদা দাগ" },
  { value: "পাখনা পচা", label: "পাখনা পচা" },
  { value: "লেজ পচা", label: "লেজ পচা" },
  { value: "চোখ ফুলে যাওয়া", label: "চোখ ফুলে যাওয়া" },
  { value: "পেট ফুলে যাওয়া", label: "পেট ফুলে যাওয়া" },
  { value: "শরীরে রক্তক্ষরণ", label: "শরীরে রক্তক্ষরণ" },
  { value: "আঁশ খসে পড়া", label: "আঁশ খসে পড়া" },
  { value: "খাবার না খাওয়া", label: "খাবার না খাওয়া" },
  { value: "পানির উপর ভেসে থাকা", label: "পানির উপর ভেসে থাকা" },
  { value: "অস্বাভাবিক সাঁতার", label: "অস্বাভাবিক সাঁতার" },
  { value: "শ্বাসকষ্ট / হাঁপানো", label: "শ্বাসকষ্ট / হাঁপানো" },
  { value: "শরীরে ঘা / ক্ষত", label: "শরীরে ঘা / ক্ষত" },
  { value: "শরীরে তুলার মতো ছত্রাক", label: "শরীরে তুলার মতো ছত্রাক" },
  { value: "মাছ মরে যাচ্ছে", label: "মাছ মরে যাচ্ছে" },
  { value: "শরীরে পরজীবী দেখা যাচ্ছে", label: "শরীরে পরজীবী দেখা যাচ্ছে" },
  { value: "রঙ বিবর্ণ হয়ে যাওয়া", label: "রঙ বিবর্ণ হয়ে যাওয়া" },
];

const fishTypes = [
  "রুই", "কাতলা", "মৃগেল", "সিলভার কার্প", "গ্রাস কার্প", "মিরর কার্প",
  "তেলাপিয়া", "পাঙ্গাস", "শিং", "মাগুর", "কৈ", "শোল", "পাবদা", "গুলশা", "চিংড়ি",
];

const DashboardDiseaseDetect = () => {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [fishType, setFishType] = useState("");
  const [pondInfo, setPondInfo] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [expandedDisease, setExpandedDisease] = useState<number | null>(0);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(isBn ? "ছবির সাইজ ৫MB এর বেশি হতে পারবে না" : "Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDetect = async () => {
    if (selectedSymptoms.length === 0 && !imageBase64) {
      toast.error(isBn ? "অন্তত একটি লক্ষণ নির্বাচন করুন অথবা ছবি আপলোড করুন" : "Select at least one symptom or upload an image");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-disease-detect", {
        body: {
          imageBase64: imageBase64 || undefined,
          symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : undefined,
          fishType: fishType || undefined,
          pondInfo: pondInfo || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        setResult(data);
        if (data.detected_diseases?.length > 0) {
          toast.success(isBn ? `${data.detected_diseases.length}টি সম্ভাব্য রোগ শনাক্ত হয়েছে` : `${data.detected_diseases.length} potential disease(s) detected`);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(isBn ? "বিশ্লেষণে সমস্যা হয়েছে" : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-800 border-red-300";
      case "medium": return "bg-amber-100 text-amber-800 border-amber-300";
      case "low": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "immediate": return <Zap className="h-4 w-4 text-red-500" />;
      case "soon": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Shield className="h-4 w-4 text-green-500" />;
    }
  };

  const getConfidenceColor = (c: number) => {
    if (c >= 80) return "text-red-600";
    if (c >= 50) return "text-amber-600";
    return "text-green-600";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
            <Stethoscope className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isBn ? "🔬 এআই রোগ শনাক্তকরণ" : "🔬 AI Disease Detection"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isBn ? "ছবি ও লক্ষণ বিশ্লেষণ করে মাছের রোগ শনাক্ত করুন" : "Detect fish diseases from images and symptoms"}
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                {isBn ? "ছবি আপলোড" : "Upload Image"}
              </CardTitle>
              <CardDescription>
                {isBn ? "আক্রান্ত মাছের ছবি আপলোড করুন (ঐচ্ছিক)" : "Upload photo of affected fish (optional)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Uploaded fish" className="w-full h-56 object-cover rounded-xl border" />
                  <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={() => { setImagePreview(null); setImageBase64(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    {isBn ? "ক্লিক করুন বা ক্যামেরা থেকে তুলুন" : "Click to upload or capture"}
                  </p>
                  <p className="text-xs text-muted-foreground">{isBn ? "সর্বোচ্চ ৫MB" : "Max 5MB"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fish Type & Pond Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Fish className="h-5 w-5 text-primary" />
                {isBn ? "মাছ ও পুকুরের তথ্য" : "Fish & Pond Info"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{isBn ? "মাছের প্রজাতি" : "Fish Species"}</Label>
                <Select value={fishType} onValueChange={setFishType}>
                  <SelectTrigger><SelectValue placeholder={isBn ? "প্রজাতি নির্বাচন করুন" : "Select species"} /></SelectTrigger>
                  <SelectContent>
                    {fishTypes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isBn ? "পুকুরের অবস্থা (ঐচ্ছিক)" : "Pond Condition (optional)"}</Label>
                <Textarea
                  value={pondInfo}
                  onChange={e => setPondInfo(e.target.value)}
                  placeholder={isBn ? "যেমন: পানির রঙ সবুজ, ৩ দিন ধরে মাছ মরছে..." : "E.g., green water, fish dying for 3 days..."}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Symptoms Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              {isBn ? "লক্ষণ নির্বাচন করুন" : "Select Symptoms"}
            </CardTitle>
            <CardDescription>{isBn ? "আপনার মাছে যে লক্ষণগুলো দেখা যাচ্ছে সেগুলো সিলেক্ট করুন" : "Select symptoms observed in your fish"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {symptomOptions.map(s => (
                <Badge
                  key={s.value}
                  variant={selectedSymptoms.includes(s.value) ? "default" : "outline"}
                  className={`cursor-pointer text-sm py-1.5 px-3 transition-all ${
                    selectedSymptoms.includes(s.value)
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => toggleSymptom(s.value)}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
            {selectedSymptoms.length > 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                {isBn ? `${selectedSymptoms.length}টি লক্ষণ নির্বাচিত` : `${selectedSymptoms.length} symptom(s) selected`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Detect Button */}
        <Button
          onClick={handleDetect}
          disabled={loading || (selectedSymptoms.length === 0 && !imageBase64)}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg"
          size="lg"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {isBn ? "বিশ্লেষণ চলছে..." : "Analyzing..."}</>
          ) : (
            <><Search className="mr-2 h-5 w-5" /> {isBn ? "🔍 রোগ শনাক্ত করুন" : "🔍 Detect Disease"}</>
          )}
        </Button>

        {/* Results */}
        {result && !result.error && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {isBn ? "🩺 বিশ্লেষণ ফলাফল" : "🩺 Analysis Results"}
            </h2>

            {/* Detected Diseases */}
            {result.detected_diseases?.map((disease, idx) => (
              <Card key={idx} className={`border-l-4 ${
                disease.severity === "high" ? "border-l-red-500" :
                disease.severity === "medium" ? "border-l-amber-500" : "border-l-green-500"
              }`}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedDisease(expandedDisease === idx ? null : idx)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getUrgencyIcon(disease.urgency)}
                      <div>
                        <CardTitle className="text-lg">{disease.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{disease.name_en}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${getConfidenceColor(disease.confidence)}`}>
                          {disease.confidence}%
                        </span>
                        <p className="text-xs text-muted-foreground">{isBn ? "সম্ভাবনা" : "confidence"}</p>
                      </div>
                      <Badge className={getSeverityColor(disease.severity)}>
                        {disease.severity === "high" ? (isBn ? "তীব্র" : "High") :
                         disease.severity === "medium" ? (isBn ? "মাঝারি" : "Medium") :
                         (isBn ? "হালকা" : "Low")}
                      </Badge>
                      {expandedDisease === idx ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </CardHeader>
                {expandedDisease === idx && (
                  <CardContent className="space-y-4">
                    {/* Description */}
                    <p className="text-sm">{disease.description}</p>

                    {/* Matched Symptoms */}
                    {disease.symptoms_matched?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          {isBn ? "মিলে যাওয়া লক্ষণ" : "Matched Symptoms"}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {disease.symptoms_matched.map((s, i) => (
                            <Badge key={i} variant="outline" className="bg-amber-50 border-amber-200 text-amber-800 text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Causes */}
                    {disease.causes?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{isBn ? "কারণসমূহ" : "Causes"}</h4>
                        <ul className="list-disc list-inside text-sm space-y-0.5 text-muted-foreground">
                          {disease.causes.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Treatment */}
                    {disease.treatment?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <Pill className="h-4 w-4 text-primary" />
                          {isBn ? "চিকিৎসা" : "Treatment"}
                        </h4>
                        <div className="space-y-2">
                          {disease.treatment.map((t, i) => (
                            <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm">
                              <p className="font-medium">{t.method}</p>
                              <div className="flex gap-4 mt-1 text-muted-foreground text-xs">
                                <span>{isBn ? "মাত্রা" : "Dosage"}: {t.dosage}</span>
                                <span>{isBn ? "সময়কাল" : "Duration"}: {t.duration}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Prevention */}
                    {disease.prevention?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                          <Shield className="h-4 w-4 text-green-500" />
                          {isBn ? "প্রতিরোধ" : "Prevention"}
                        </h4>
                        <ul className="list-disc list-inside text-sm space-y-0.5 text-muted-foreground">
                          {disease.prevention.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Product Recommendations */}
                    {disease.recommended_product_ids?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                          {isBn ? "সুপারিশকৃত পণ্য" : "Recommended Products"}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {disease.recommended_product_ids.map((pid) => (
                            <Link key={pid} to={`/product/${pid}`}>
                              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                                {isBn ? "পণ্য দেখুন →" : "View Product →"}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}

            {/* General Advice Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.general_advice && (
                <Card className="bg-blue-50/50 border-blue-200">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <Stethoscope className="h-4 w-4 text-blue-500" />
                      {isBn ? "সামগ্রিক পরামর্শ" : "General Advice"}
                    </h4>
                    <p className="text-sm text-muted-foreground">{result.general_advice}</p>
                  </CardContent>
                </Card>
              )}
              {result.water_quality_tips && (
                <Card className="bg-cyan-50/50 border-cyan-200">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <Droplets className="h-4 w-4 text-cyan-500" />
                      {isBn ? "পানির গুণমান" : "Water Quality"}
                    </h4>
                    <p className="text-sm text-muted-foreground">{result.water_quality_tips}</p>
                  </CardContent>
                </Card>
              )}
              {result.feeding_advice && (
                <Card className="bg-green-50/50 border-green-200">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                      <Fish className="h-4 w-4 text-green-500" />
                      {isBn ? "খাদ্য পরামর্শ" : "Feeding Advice"}
                    </h4>
                    <p className="text-sm text-muted-foreground">{result.feeding_advice}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Disclaimer */}
            <Card className="bg-amber-50/50 border-amber-200">
              <CardContent className="pt-4">
                <p className="text-xs text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {isBn
                    ? "⚠️ এই বিশ্লেষণটি এআই দ্বারা তৈরি এবং শুধুমাত্র প্রাথমিক নির্দেশনার জন্য। গুরুতর সমস্যায় অবশ্যই স্থানীয় মৎস্য কর্মকর্তার সাথে যোগাযোগ করুন।"
                    : "⚠️ This analysis is AI-generated and for initial guidance only. For serious issues, please consult a local fisheries officer."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardDiseaseDetect;
