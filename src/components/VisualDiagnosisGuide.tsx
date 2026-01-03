import { useState } from "react";
import { 
  Search, 
  AlertTriangle, 
  Stethoscope, 
  Shield, 
  Clock, 
  Bug, 
  ThermometerSun,
  ChevronDown,
  ChevronUp,
  X,
  Fish
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  fishDiseases, 
  diseaseCategories, 
  severityLabels,
  type FishDisease 
} from "@/data/fishDiseaseData";

export const VisualDiagnosisGuide = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDisease, setSelectedDisease] = useState<FishDisease | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredDiseases = fishDiseases.filter((disease) => {
    const matchesCategory = selectedCategory === "all" || disease.category === selectedCategory;
    const matchesSearch = 
      disease.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disease.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disease.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      disease.affectedFish.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bacterial': return <Bug className="h-4 w-4" />;
      case 'fungal': return <span className="text-sm">🍄</span>;
      case 'parasitic': return <span className="text-sm">🪱</span>;
      case 'viral': return <span className="text-sm">🔬</span>;
      default: return <Fish className="h-4 w-4" />;
    }
  };

  return (
    <section className="py-8">
      <div className="container">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <Stethoscope className="h-5 w-5" />
            <span className="font-bold">ভিজ্যুয়াল ডায়াগনোসিস</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            মাছের রোগ শনাক্তকরণ গাইড
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            লক্ষণ দেখে রোগ চিনুন, সঠিক চিকিৎসা নিন
          </p>
        </div>

        {/* Search & Filters */}
        <div className="max-w-4xl mx-auto mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="রোগ, লক্ষণ বা মাছের নাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {diseaseCategories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className="cursor-pointer py-2 px-3"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Disease Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDiseases.map((disease) => (
              <Card 
                key={disease.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                  expandedId === disease.id ? 'border-primary' : 'border-transparent'
                }`}
                onClick={() => setExpandedId(expandedId === disease.id ? null : disease.id)}
              >
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden rounded-t-lg">
                    <img
                      src={disease.imageUrl}
                      alt={disease.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Severity Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className={severityLabels[disease.severity].color}>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {severityLabels[disease.severity].label}
                      </Badge>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-white/90 dark:bg-gray-800/90">
                        {getCategoryIcon(disease.category)}
                        <span className="ml-1 capitalize">
                          {disease.category === 'bacterial' && 'ব্যাক্টেরিয়া'}
                          {disease.category === 'fungal' && 'ছত্রাক'}
                          {disease.category === 'parasitic' && 'পরজীবী'}
                          {disease.category === 'viral' && 'ভাইরাস'}
                        </span>
                      </Badge>
                    </div>

                    {/* Title */}
                    <div className="absolute bottom-2 left-3 right-3">
                      <h3 className="text-white font-bold text-lg leading-tight">
                        {disease.name}
                      </h3>
                      <p className="text-white/70 text-sm">{disease.nameEn}</p>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="p-4">
                    {/* Affected Fish */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {disease.affectedFish.slice(0, 3).map((fish, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {fish}
                        </Badge>
                      ))}
                      {disease.affectedFish.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{disease.affectedFish.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Season */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <ThermometerSun className="h-4 w-4" />
                      <span>{disease.season.join(', ')}</span>
                    </div>

                    {/* Top Symptoms */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">প্রধান লক্ষণ:</p>
                      <ul className="text-sm space-y-1">
                        {disease.symptoms.slice(0, 2).map((symptom, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span className="text-foreground">{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Expand Button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-3 gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDisease(disease);
                      }}
                    >
                      বিস্তারিত দেখুন
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDiseases.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Fish className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">কোনো রোগ পাওয়া যায়নি</p>
              <p className="text-sm">অন্য কীওয়ার্ড দিয়ে খুঁজুন</p>
            </div>
          )}
        </div>

        {/* Disease Detail Modal */}
        {selectedDisease && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDisease(null)}
          >
            <Card 
              className="w-full max-w-3xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ScrollArea className="max-h-[90vh]">
                <div className="relative">
                  {/* Header Image */}
                  <div className="relative h-48 md:h-64">
                    <img
                      src={selectedDisease.imageUrl}
                      alt={selectedDisease.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {/* Close Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white"
                      onClick={() => setSelectedDisease(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>

                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={severityLabels[selectedDisease.severity].color}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {severityLabels[selectedDisease.severity].label}
                        </Badge>
                        <Badge variant="secondary">
                          {selectedDisease.category === 'bacterial' && '🦠 ব্যাক্টেরিয়াজনিত'}
                          {selectedDisease.category === 'fungal' && '🍄 ছত্রাকজনিত'}
                          {selectedDisease.category === 'parasitic' && '🪱 পরজীবীজনিত'}
                          {selectedDisease.category === 'viral' && '🔬 ভাইরাসজনিত'}
                        </Badge>
                      </div>
                      <h2 className="text-white text-2xl md:text-3xl font-bold">
                        {selectedDisease.name}
                      </h2>
                      <p className="text-white/70">{selectedDisease.nameEn}</p>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {/* Affected Fish & Season */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Fish className="h-5 w-5 text-primary" />
                          <h4 className="font-bold">আক্রান্ত মাছ</h4>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedDisease.affectedFish.map((fish, i) => (
                            <Badge key={i} variant="outline">{fish}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <ThermometerSun className="h-5 w-5 text-orange-500" />
                          <h4 className="font-bold">প্রাদুর্ভাবের সময়</h4>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedDisease.season.map((s, i) => (
                            <Badge key={i} variant="secondary">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <h4 className="font-bold text-red-800 dark:text-red-300">লক্ষণসমূহ</h4>
                      </div>
                      <ul className="space-y-2">
                        {selectedDisease.symptoms.map((symptom, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                            <span className="text-red-500 mt-0.5">•</span>
                            {symptom}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Causes */}
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Bug className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <h4 className="font-bold text-amber-800 dark:text-amber-300">কারণ</h4>
                      </div>
                      <ul className="space-y-2">
                        {selectedDisease.causes.map((cause, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                            <span className="text-amber-500 mt-0.5">•</span>
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prevention */}
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h4 className="font-bold text-green-800 dark:text-green-300">প্রতিরোধ</h4>
                      </div>
                      <ul className="space-y-2">
                        {selectedDisease.prevention.map((prev, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                            <span className="text-green-500 mt-0.5">✓</span>
                            {prev}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Treatment */}
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-bold text-blue-800 dark:text-blue-300">চিকিৎসা</h4>
                      </div>
                      <div className="space-y-3">
                        {selectedDisease.treatment.map((treat, i) => (
                          <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <p className="font-medium text-blue-800 dark:text-blue-200">{treat.method}</p>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <span className="font-medium">ডোজ:</span> {treat.dosage}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {treat.duration}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Image Description */}
                    <p className="text-center text-sm text-muted-foreground italic">
                      📷 {selectedDisease.imageDescription}
                    </p>
                  </CardContent>
                </div>
              </ScrollArea>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};
