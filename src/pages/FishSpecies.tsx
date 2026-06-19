import { useState } from "react";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import { usePageContent } from "@/hooks/usePageContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, Minus, Fish, Droplets, Bug, TrendingUp, 
  ShoppingBag, Apple, ImageIcon, FlaskConical, Clock,
  ChevronDown, ChevronUp
} from "lucide-react";
import AdUnit from "@/components/AdUnit";
import ShareButtons from "@/components/ShareButtons";
import RecommendedProductsSlider from "@/components/RecommendedProductsSlider";

interface FishDetails {
  cultureDuration: string;
  waterQuality: string;
  diseaseRisk: string;
  growthRate: string;
  marketDemand: string;
  nutritionalValue: string;
  images: string[];
}

interface FishSpeciesItem {
  name: string;
  scientificName: string;
  basicInfo: string;
  classification: string;
  foodHabit: string;
  farmingMethod: string;
  details: FishDetails;
}

interface FishTab {
  id: string;
  name: string;
  species: FishSpeciesItem[];
}

interface FishPageContent {
  headline: string;
  subHeadline: string;
  tabs: FishTab[];
}

const FishCard = ({ fish }: { fish: FishSpeciesItem }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Fish className="h-5 w-5 text-primary shrink-0" />
              {fish.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground italic mt-1">{fish.scientificName}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 h-9 w-9 rounded-full border-primary/30 hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <p className="text-sm text-foreground/80 leading-relaxed">{fish.basicInfo}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">শ্রেণিবিন্যাস</p>
            <p className="text-xs text-foreground">{fish.classification}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">খাদ্যাভ্যাস</p>
            <p className="text-xs text-foreground">{fish.foodHabit}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">চাষ পদ্ধতি</p>
            <p className="text-xs text-foreground">{fish.farmingMethod}</p>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in slide-in-from-top-2 duration-300">
            <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              বিস্তারিত তথ্য
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailItem icon={Clock} label="চাষের সময়কাল" value={fish.details.cultureDuration} />
              <DetailItem icon={Droplets} label="পানির গুণাগুণ" value={fish.details.waterQuality} />
              <DetailItem icon={Bug} label="রোগের ঝুঁকি" value={fish.details.diseaseRisk} />
              <DetailItem icon={TrendingUp} label="বৃদ্ধির হার" value={fish.details.growthRate} />
              <DetailItem icon={ShoppingBag} label="বাজার চাহিদা" value={fish.details.marketDemand} />
              <DetailItem icon={Apple} label="পুষ্টিমান" value={fish.details.nutritionalValue} />
            </div>

            {fish.details.images && fish.details.images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  ছবি গ্যালারি
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {fish.details.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${fish.name} - ছবি ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DetailItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="bg-accent/30 rounded-lg p-3 space-y-1">
    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </p>
    <p className="text-sm text-foreground leading-relaxed">{value}</p>
  </div>
);

export default function FishSpecies() {
  const { getSectionContent, loading } = usePageContent();
  const content = getSectionContent<FishPageContent>("fish_species_page");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-12 w-96 mx-auto" />
          <Skeleton className="h-6 w-64 mx-auto" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tabs = content?.tabs || [];
  const defaultTab = tabs[0]?.id || "";

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={content?.headline || "বাংলাদেশে প্রচলিত মাছ"}
        description={content?.subHeadline || "বাংলাদেশের বাণিজ্যিকভাবে গুরুত্বপূর্ণ মাছের তথ্য"}
      />
      <Header />

      {/* Header Ad */}
      <div className="container mx-auto px-4 pt-4">
        <AdUnit position="header" className="mb-4" />
      </div>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Heading */}
        <div className="text-center mb-8 md:mb-12 space-y-3">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {content?.headline || "বাংলাদেশে প্রচলিত মাছ"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {content?.subHeadline || "বাংলাদেশের বাণিজ্যিকভাবে গুরুত্বপূর্ণ ও চাষযোগ্য মাছের বিস্তারিত তথ্য"}
          </p>
        </div>

        {/* Tabs */}
        {tabs.length > 0 && (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 p-1.5 mb-6 w-full justify-center bg-muted/50 rounded-xl">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="text-sm md:text-base px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                  {tab.species.map((fish, idx) => (
                    <FishCard key={idx} fish={fish} />
                  ))}
                </div>

                {tab.species.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Fish className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>এই ক্যাটাগরিতে এখনো কোনো মাছ যুক্ত করা হয়নি।</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
        {/* In-article Ad */}
        <div className="mt-8">
          <AdUnit position="footer" />
        </div>
      </main>

      <RecommendedProductsSlider category="calculator_related" titleBn="প্রস্তাবিত পণ্য" title="Recommended Products" />
      <Footer />
      <ShareButtons
        title={content?.headline || "বাংলাদেশে প্রচলিত মাছ"}
        url="/fish-species"
      />
    </div>
  );
}
