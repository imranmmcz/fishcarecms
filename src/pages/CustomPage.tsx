import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        // Set page title and meta
        if (data.meta_title) document.title = data.meta_title;
        else document.title = data.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && data.meta_description) metaDesc.setAttribute("content", data.meta_description);
      }
      setLoading(false);
    };
    if (slug) fetchPage();
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
                dangerouslySetInnerHTML={{ __html: page.content || "" }}
              />
            </article>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
