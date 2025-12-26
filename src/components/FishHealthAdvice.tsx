import { useState } from "react";
import { Stethoscope, ChevronDown, ExternalLink, AlertCircle, CheckCircle2, Clock, Shield } from "lucide-react";
import { Button3D } from "@/components/ui/button-3d";
import { fishSymptoms, fishTreatments } from "@/data/fishHealthData";

export const FishHealthAdvice = () => {
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentSymptom = fishSymptoms.find((s) => s.id === selectedSymptom);
  const treatment = fishTreatments.find((t) => t.symptomId === selectedSymptom);

  const handleBuyClick = () => {
    if (treatment) {
      window.open(treatment.externalLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20">
      <div className="container">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
            <Stethoscope className="h-5 w-5" />
            <span className="font-bold">ফিশ ডক্টর</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            মাছের স্বাস্থ্য পরামর্শ
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            আপনার মাছের সমস্যা নির্বাচন করুন এবং সঠিক চিকিৎসা পদ্ধতি জানুন
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Symptom Selector */}
          <div className="relative mb-8">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-4 p-5 bg-card rounded-2xl border-2 border-border shadow-soft hover:border-primary/50 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-2xl">
                  {currentSymptom ? currentSymptom.icon : "🔍"}
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">সমস্যা/রোগ নির্বাচন করুন</p>
                  <p className="text-lg font-bold text-foreground">
                    {currentSymptom ? currentSymptom.name : "এখানে ক্লিক করুন"}
                  </p>
                </div>
              </div>
              <ChevronDown 
                className={`h-6 w-6 text-muted-foreground transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`} 
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl border border-border shadow-elegant z-50 overflow-hidden animate-scale-in">
                <div className="max-h-[400px] overflow-y-auto">
                  {fishSymptoms.map((symptom) => (
                    <button
                      key={symptom.id}
                      onClick={() => {
                        setSelectedSymptom(symptom.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0 ${
                        selectedSymptom === symptom.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <span className="text-2xl">{symptom.icon}</span>
                      <div className="text-left flex-1">
                        <p className="font-bold text-foreground">{symptom.name}</p>
                        <p className="text-sm text-muted-foreground">{symptom.description}</p>
                      </div>
                      {selectedSymptom === symptom.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Treatment Card */}
          {treatment && (
            <div className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden animate-fade-in">
              <div className="md:flex">
                {/* Medicine Image */}
                <div className="md:w-1/3 relative">
                  <img
                    src={treatment.medicineImage}
                    alt={treatment.medicineName}
                    className="w-full h-64 md:h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white/80 text-sm">প্রস্তাবিত ঔষধ</p>
                    <h3 className="text-white text-xl font-bold">{treatment.medicineName}</h3>
                  </div>
                </div>

                {/* Treatment Details */}
                <div className="md:w-2/3 p-6 md:p-8 space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-2">চিকিৎসা বিবরণ</h4>
                    <p className="text-muted-foreground leading-relaxed">{treatment.description}</p>
                  </div>

                  {/* Dosage Info */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ডোজ</p>
                        <p className="font-bold text-foreground">{treatment.dosage}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">চিকিৎসার সময়কাল</p>
                        <p className="font-bold text-foreground">{treatment.duration}</p>
                      </div>
                    </div>
                  </div>

                  {/* Precautions */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <h5 className="font-bold text-amber-800 dark:text-amber-300">সতর্কতা</h5>
                    </div>
                    <ul className="space-y-2">
                      {treatment.precautions.map((precaution, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                          <span className="text-amber-500">•</span>
                          {precaution}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Buy Button */}
                  <Button3D 
                    variant="success" 
                    size="lg" 
                    className="w-full gap-2"
                    onClick={handleBuyClick}
                  >
                    <ExternalLink className="h-5 w-5" />
                    এই ঔষধ কিনুন - Fishcare.com.bd
                  </Button3D>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedSymptom && (
            <div className="text-center py-12 bg-card rounded-3xl border border-dashed border-border">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center text-4xl mb-4">
                🐟
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">সমস্যা নির্বাচন করুন</h3>
              <p className="text-muted-foreground">
                উপরের ড্রপডাউন থেকে আপনার মাছের সমস্যা বা রোগ নির্বাচন করুন
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
