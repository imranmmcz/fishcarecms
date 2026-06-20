import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";
import RecommendedProductsSlider from "@/components/RecommendedProductsSlider";

interface CustomPage {
  id: string;
  title: string;
  title_bn: string | null;
  slug: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: string;
  updated_at: string;
}

export default function CustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const normalizeForStemming = (s: string) =>
    s
      .replace(/(ing|ed|s|es|ies|er|est|tion|ment|ness|ly|ful|less|able|ible|ize|ise|ify|en)$/, "")
      .replace(/(গুলো|গুলি|মালা|বরণ|তা|ত্ব|নী|িকা|িক|কারী|দার|বিদ|গামী|প্রদ|জনক|ময়|বহুল|মান|গত|ভাব|তা|বিদ্যা|শালী|পূর্ণ|হীন)$/g, "");

  const isProductRelated = (p: CustomPage | null) => {
    if (!p) return false;
    const raw = `${p.slug} ${p.title} ${p.title_bn ?? ""} ${p.meta_title ?? ""} ${p.meta_description ?? ""} ${p.content ?? ""}`.toLowerCase();
    const haystack = `${raw} ${normalizeForStemming(raw)}`;

    const keywords = [
      // English commerce & product roots
      "product", "products", "shop", "shops", "store", "stores", "buy", "purchase", "cart", "checkout",
      "order", "orders", "sale", "sales", "deal", "deals", "offer", "offers", "discount", "discounted",
      "price", "prices", "pricing", "rate", "rates", "cost", "costs", "cheap", "best-price",
      "catalog", "catalogue", "listing", "collection", "range", "inventory", "stock", "item", "items",
      "goods", "merchandise", "commodity", "commodities", "brand", "brands", "category", "categories",
      "ecommerce", "e-commerce", "online-shop", "online-store", "marketplace", "retail", "wholesale",
      "new-arrival", "featured", "bestseller", "trending", "popular", "top-rated", "recommended",
      "fish", "fishes", "aquarium", "aquatic", "pond", "ponds", "farm", "farms", "farming",
      "aquaculture", "hatchery", "hatcheries", "feed", "feeds", "food", "foods", "supplement",
      "supplements", "vitamin", "vitamins", "medicine", "medicines", "medication", "treatment",
      "equipment", "gear", "tool", "tools", "net", "nets", "tank", "tanks", "pump", "pumps",
      "filter", "filters", "oxygen", "aerator", "aerators", "generator", "boat", "boats",
      "seed", "seeds", "spawn", "spawns", "fingerling", "fingerlings", "fry", "brood", "broodstock",
      "culture", "cultivation", "production", "producer", "supplier", "supply", "supplies",
      "care", "maintenance", "management", "solution", "solutions", "kit", "kits", "pack", "packs",
      "bundle", "bundles", "combo", "combos", "package", "packages", "box", "boxes", "set", "sets",

      // Bengali commerce & product roots
      "পণ্য", "পণ্যসমূহ", "পণ্যসামগ্রী", "দোকান", "বাজার", "কিনুন", "ক্রয়", "বিক্রয়",
      "অর্ডার", "অফার", "ছাড়", "ডিসকাউন্ট", "মূল্য", "দাম", "মূল্যনির্ধারণ", "মূল্যতালিকা",
      "দর", "রেট", "সস্তা", "সেরাদাম", "ক্যাটালগ", "তালিকা", "সংগ্রহ", "সংগ্রহণ",
      "স্টক", "জিনিস", "জিনিসপত্র", "মাল", "ব্র্যান্ড", "বিভাগ", "বিভাগীয়",
      "নতুন", "বৈশিষ্ট্যযুক্ত", "জনপ্রিয়", "শীর্ষ", "সুপারিশকৃত",
      "মাছ", "মাছের", "একুরিয়াম", "জলজ", "পুকুর", "খামার", "চাষ", "চাষাবাদ",
      "হ্যাচারি", "খাবার", "খাদ্য", "সাপ্লিমেন্ট", "ভিটামিন", "ঔষধ", "ওষুধ", "চিকিৎসা",
      "সরঞ্জাম", "যন্ত্রপাতি", "যন্ত্র", "জাল", "ট্যাংক", "পাম্প", "ফিল্টার", "অক্সিজেন",
      "বিচ", "পোনা", "রেনু", "উৎপাদন", "উৎপাদক", "সরবরাহকারী", "সরবরাহ",
      "পরিচর্যা", "রক্ষণাবেক্ষণ", "ব্যবস্থাপনা", "সমাধান", "কিট", "প্যাক", "প্যাকেজ",
      "বান্ডেল", "কম্বো", "সেট", "বাক্স",
    ];

    return keywords.some((k) => haystack.includes(k.toLowerCase()));
  };

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("slug", slug || "")
        .eq("status", "published")
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPage(data as CustomPage);
      }
      setLoading(false);
    };
    if (slug) fetchPage();
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {page && (
        <SeoHead
          title={page.meta_title || page.title}
          description={page.meta_description || undefined}
          url={`/pages/${page.slug}`}
          type="article"
        />
      )}
      <Header />
      <main className="flex-1">
        {loading ? (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
            <div className="h-4 bg-muted animate-pulse rounded w-full" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-full" />
          </div>
        ) : notFound ? (
          <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
            <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">পেজটি পাওয়া যায়নি</h1>
            <p className="text-muted-foreground">এই পেজটি হয়তো মুছে ফেলা হয়েছে বা প্রকাশ করা হয়নি।</p>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/"><ArrowLeft className="h-4 w-4" /> হোমে ফিরুন</Link>
            </Button>
          </div>
        ) : page ? (
          <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="mb-2">
              <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground -ml-2 mb-4">
                <Link to="/"><ArrowLeft className="h-3.5 w-3.5" /> হোমে ফিরুন</Link>
              </Button>
            </div>
            <article className="prose prose-sm sm:prose max-w-none dark:prose-invert">
              <h1 className="text-3xl font-bold text-foreground mb-1">{page.title}</h1>
              {page.title_bn && (
                <p className="text-lg text-muted-foreground mb-6">{page.title_bn}</p>
              )}
              <div
                className="text-foreground leading-relaxed
                  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4 [&_h1]:text-foreground
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h2]:text-foreground
                  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2 [&_h3]:text-foreground
                  [&_p]:mb-3 [&_p]:text-foreground
                  [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-3
                  [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-3
                  [&_li]:mb-1
                  [&_a]:text-primary [&_a]:underline [&_a]:hover:opacity-80
                  [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4
                  [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre]:my-4
                  [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm
                  [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4
                  [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
                  [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_th]:font-semibold
                  [&_td]:border [&_td]:border-border [&_td]:p-2
                  [&_hr]:border-border [&_hr]:my-6"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content || "") }}
              />
            </article>
          </div>
        ) : null}
        {page && !loading && !notFound && isProductRelated(page) && (
          <RecommendedProductsSlider title="Recommended Products" />
        )}
      </main>
      <Footer />
    </div>
  );
}
