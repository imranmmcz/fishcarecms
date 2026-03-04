import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import { useBlogPosts, BLOG_CATEGORIES } from "@/hooks/useBlog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Eye, Pin, Search, Plus, Clock, TrendingUp, Filter } from "lucide-react";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import BlogCreateDialog from "@/components/blog/BlogCreateDialog";

const Blog = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("newest");
  const [showCreate, setShowCreate] = useState(false);

  const { posts, loading, refetch } = useBlogPosts({
    category: category || undefined,
    search: search || undefined,
    sort: sort === "most-commented" ? "most-commented" : sort === "most-viewed" ? "most-viewed" : undefined,
  });

  const pinnedPosts = posts.filter(p => p.is_pinned);
  const regularPosts = posts.filter(p => !p.is_pinned);

  const getCategoryLabel = (val: string) => {
    const cat = BLOG_CATEGORIES.find(c => c.value === val);
    return cat ? (language === "bn" ? cat.label_bn : cat.label_en) : val;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-destructive text-destructive-foreground text-[10px]">{language === "bn" ? "অ্যাডমিন" : "Admin"}</Badge>;
      case "farmer": return <Badge className="bg-primary text-primary-foreground text-[10px]">{language === "bn" ? "কৃষক" : "Farmer"}</Badge>;
      case "customer": return <Badge variant="secondary" className="text-[10px]">{language === "bn" ? "ক্রেতা" : "Customer"}</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{language === "bn" ? "অতিথি" : "Guest"}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead
        title={language === "bn" ? "ব্লগ ও আলোচনা" : "Blog & Discussions"}
        description={language === "bn" ? "মৎস্য চাষ বিষয়ক প্রশ্ন ও আলোচনা" : "Fish farming questions and discussions"}
        url="/blog"
      />
      <Header />

      <main className="flex-1 container py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === "bn" ? "📝 কমিউনিটি ব্লগ ও আলোচনা" : "📝 Community Blog & Discussions"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "bn" ? "প্রশ্ন করুন, অভিজ্ঞতা শেয়ার করুন, সমাধান পান" : "Ask questions, share experiences, get solutions"}
            </p>
          </div>
          {user && (
            <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              {language === "bn" ? "নতুন প্রশ্ন করুন" : "Ask Question"}
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "bn" ? "প্রশ্ন খুঁজুন..." : "Search questions..."}
              className="pl-10"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setSearch(searchInput)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={language === "bn" ? "ক্যাটাগরি" : "Category"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "bn" ? "সকল" : "All"}</SelectItem>
              {BLOG_CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>
                  {language === "bn" ? c.label_bn : c.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-48">
              <TrendingUp className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{language === "bn" ? "সর্বশেষ" : "Newest"}</SelectItem>
              <SelectItem value="most-commented">{language === "bn" ? "সর্বাধিক আলোচিত" : "Most Discussed"}</SelectItem>
              <SelectItem value="most-viewed">{language === "bn" ? "সর্বাধিক দেখা" : "Most Viewed"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Pinned */}
            {pinnedPosts.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Pin className="h-4 w-4" /> {language === "bn" ? "পিন করা প্রশ্ন" : "Pinned"}
                </h2>
                {pinnedPosts.map(post => (
                  <PostCard key={post.id} post={post} language={language} getCategoryLabel={getCategoryLabel} getRoleBadge={getRoleBadge} />
                ))}
              </div>
            )}

            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent></Card>
              ))
            ) : regularPosts.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                {language === "bn" ? "কোনো প্রশ্ন পাওয়া যায়নি" : "No questions found"}
              </CardContent></Card>
            ) : (
              regularPosts.map(post => (
                <PostCard key={post.id} post={post} language={language} getCategoryLabel={getCategoryLabel} getRoleBadge={getRoleBadge} />
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Categories */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">{language === "bn" ? "ক্যাটাগরি" : "Categories"}</h3>
                <div className="space-y-1">
                  {BLOG_CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(category === c.value ? "" : c.value)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        category === c.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      {language === "bn" ? c.label_bn : c.label_en}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular questions */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">{language === "bn" ? "জনপ্রিয় প্রশ্ন" : "Popular Questions"}</h3>
                <div className="space-y-2">
                  {posts.slice(0, 5).map(p => (
                    <Link key={p.id} to={`/blog/${p.slug}`} className="block text-sm text-foreground hover:text-primary transition-colors line-clamp-2">
                      {p.title}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {!user && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 text-center">
                  <p className="text-sm mb-3">
                    {language === "bn" ? "প্রশ্ন করতে ও মন্তব্য করতে লগইন করুন" : "Login to ask questions & comment"}
                  </p>
                  <Link to="/auth">
                    <Button size="sm">{language === "bn" ? "লগইন / সাইনআপ" : "Login / Signup"}</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
      
      {showCreate && (
        <BlogCreateDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onCreated={() => { setShowCreate(false); refetch(); }}
        />
      )}
    </div>
  );
};

function PostCard({ post, language, getCategoryLabel, getRoleBadge }: {
  post: any; language: string;
  getCategoryLabel: (v: string) => string;
  getRoleBadge: (r: string) => React.ReactNode;
}) {
  const firstImage = post.images?.[0]?.image_url;

  return (
    <Link to={`/blog/${post.slug}`}>
      <Card className="hover:shadow-md transition-shadow overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {firstImage && (
              <div className="sm:w-40 h-32 sm:h-auto shrink-0">
                <img src={firstImage} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            <div className="p-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="text-[10px]">{getCategoryLabel(post.category)}</Badge>
                {post.is_pinned && <Pin className="h-3 w-3 text-primary" />}
              </div>
              <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{post.title}</h3>
              {post.content && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.content.replace(/<[^>]*>/g, "").substring(0, 150)}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  {post.author_name} {getRoleBadge(post.author_role)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(post.created_at), "dd MMM yyyy", { locale: language === "bn" ? bn : undefined })}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> {post.comment_count}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {post.view_count}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default Blog;
