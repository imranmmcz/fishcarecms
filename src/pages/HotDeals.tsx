import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import { FlashSaleSection } from "@/components/home/FlashSaleSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { Flame } from "lucide-react";

const HotDeals = () => {
  const { language } = useLanguage();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title={language === "bn" ? "হট ডিল ও ফ্ল্যাশ সেল" : "Hot Deals & Flash Sale"}
        description={language === "bn" ? "চলমান ফ্ল্যাশ সেল ও সীমিত সময়ের অফার সমূহ এক জায়গায়।" : "All live flash sales and limited-time offers."}
        url="/hot-deals"
      />
      <Header />
      <main className="flex-1">
        <section className="container px-3 sm:px-4 py-6 sm:py-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 rounded-xl bg-destructive/10 text-destructive">
              <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-foreground">
                {language === "bn" ? "হট ডিল ও ফ্ল্যাশ সেল" : "Hot Deals & Flash Sale"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {language === "bn" ? "সীমিত সময়ের জন্য বিশেষ ছাড়ে কিনুন।" : "Grab limited-time discounted products now."}
              </p>
            </div>
          </div>
        </section>
        <FlashSaleSection />
      </main>
      <Footer />
    </div>
  );
};

export default HotDeals;