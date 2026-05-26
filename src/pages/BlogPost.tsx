import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import JsonLd from "@/components/JsonLd";
import { useBlogPost, useBlogComments, useBlogActions, BLOG_CATEGORIES, BlogComment } from "@/hooks/useBlog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageSquare, Eye, ThumbsUp, Clock, Reply, Lock, Send } from "lucide-react";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import ShareButtons from "@/components/ShareButtons";

const BlogPostPage = () => {
  const { slug } = useParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { post, loading } = useBlogPost(slug);
  const { comments, loading: commentsLoading } = useBlogComments(post?.id);
  const { addComment, toggleVote } = useBlogActions();

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return;
    setSubmitting(true);
    await addComment(post.id, commentText.trim());
    setCommentText("");
    setSubmitting(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim() || !post) return;
    setSubmitting(true);
    await addComment(post.id, replyText.trim(), parentId);
    setReplyText("");
    setReplyTo(null);
    setSubmitting(false);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-6 max-w-4xl">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-12 text-center">
          <p className="text-muted-foreground">{language === "bn" ? "পোস্ট পাওয়া যায়নি" : "Post not found"}</p>
          <Link to="/blog"><Button variant="outline" className="mt-4">{language === "bn" ? "ব্লগে ফিরুন" : "Back to Blog"}</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead
        title={post.meta_title || post.title}
        description={post.meta_description || post.content?.replace(/<[^>]*>/g, "").substring(0, 160)}
        url={`/blog/${post.slug}`}
        image={post.og_image || post.images?.[0]?.image_url}
      />
      <JsonLd
        id="ld-json-article"
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description:
            post.meta_description ||
            post.content?.replace(/<[^>]*>/g, "").substring(0, 160),
          image: post.og_image || post.images?.[0]?.image_url || undefined,
          author: { "@type": "Person", name: post.author_name },
          datePublished: post.created_at,
          dateModified: (post as any).updated_at || post.created_at,
          mainEntityOfPage: `https://fishcare.lovable.app/blog/${post.slug}`,
          publisher: {
            "@type": "Organization",
            name: "FishCare BD",
            logo: {
              "@type": "ImageObject",
              url: "https://fishcare.lovable.app/icons/icon-512x512.png",
            },
          },
        }}
      />
      <Header />

      <main className="flex-1 container py-6 max-w-4xl">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> {language === "bn" ? "ব্লগে ফিরুন" : "Back to Blog"}
        </Link>

        <article>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="outline">{getCategoryLabel(post.category)}</Badge>
              {post.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                {post.author_name} {getRoleBadge(post.author_role)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(post.created_at), "dd MMMM yyyy, hh:mm a", { locale: language === "bn" ? bn : undefined })}
              </span>
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {post.view_count}</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {post.comment_count}</span>
            </div>
          </div>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className={`mb-6 grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {post.images.map((img: any) => (
                <img key={img.id} src={img.image_url} alt={img.alt_text || post.title} className="rounded-lg w-full object-cover max-h-96" loading="lazy" />
              ))}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm max-w-none mb-6" dangerouslySetInnerHTML={{ __html: post.content || "" }} />
          
          {/* Share Buttons */}
          <ShareButtons
            title={post.title}
            description={post.meta_description || post.content?.replace(/<[^>]*>/g, "").substring(0, 160)}
            url={`/blog/${post.slug}`}
            image={post.og_image || post.images?.[0]?.image_url}
            variant="inline"
            className="mb-8"
          />
        </article>

        {/* Comments Section */}
        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {language === "bn" ? `মন্তব্য (${post.comment_count})` : `Comments (${post.comment_count})`}
          </h2>

          {post.is_comments_locked ? (
            <Card><CardContent className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              {language === "bn" ? "মন্তব্য বন্ধ করা হয়েছে" : "Comments are locked"}
            </CardContent></Card>
          ) : (
            <>
              {user ? (
                <div className="flex gap-2 mb-6">
                  <Textarea
                    placeholder={language === "bn" ? "আপনার মন্তব্য লিখুন..." : "Write your comment..."}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    rows={3}
                    className="flex-1"
                  />
                  <Button onClick={handleSubmitComment} disabled={submitting || !commentText.trim()} size="icon" className="self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Card className="mb-6 border-primary/30 bg-primary/5">
                  <CardContent className="p-4 text-center">
                    <Link to="/auth"><Button size="sm">{language === "bn" ? "মন্তব্য করতে লগইন করুন" : "Login to comment"}</Button></Link>
                  </CardContent>
                </Card>
              )}

              {commentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {language === "bn" ? "এখনো কোনো মন্তব্য নেই" : "No comments yet"}
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map(c => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      language={language}
                      user={user}
                      getRoleBadge={getRoleBadge}
                      replyTo={replyTo}
                      setReplyTo={setReplyTo}
                      replyText={replyText}
                      setReplyText={setReplyText}
                      onReply={handleSubmitReply}
                      onVote={toggleVote}
                      submitting={submitting}
                      depth={0}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

function CommentItem({ comment, language, user, getRoleBadge, replyTo, setReplyTo, replyText, setReplyText, onReply, onVote, submitting, depth }: {
  comment: BlogComment; language: string; user: any;
  getRoleBadge: (r: string) => React.ReactNode;
  replyTo: string | null; setReplyTo: (id: string | null) => void;
  replyText: string; setReplyText: (t: string) => void;
  onReply: (parentId: string) => void; onVote: (commentId: string) => void;
  submitting: boolean; depth: number;
}) {
  return (
    <div className={`${depth > 0 ? "ml-6 border-l-2 border-border pl-4" : ""}`}>
      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2 text-sm">
            <span className="font-medium">{comment.author_name}</span>
            {getRoleBadge(comment.author_role)}
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.created_at), "dd MMM yyyy, hh:mm a", { locale: language === "bn" ? bn : undefined })}
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{comment.comment_text}</p>
          {comment.image_url && (
            <img src={comment.image_url} alt="" className="max-h-40 rounded-md mb-2" loading="lazy" />
          )}
          <div className="flex items-center gap-3">
            {user && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => onVote(comment.id)}>
                <ThumbsUp className="h-3 w-3" /> {comment.helpful_count}
              </Button>
            )}
            {user && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
                <Reply className="h-3 w-3" /> {language === "bn" ? "উত্তর" : "Reply"}
              </Button>
            )}
          </div>

          {replyTo === comment.id && (
            <div className="flex gap-2 mt-2">
              <Textarea
                placeholder={language === "bn" ? "উত্তর লিখুন..." : "Write reply..."}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={2}
                className="flex-1 text-sm"
              />
              <Button size="icon" className="self-end h-8 w-8" onClick={() => onReply(comment.id)} disabled={submitting || !replyText.trim()}>
                <Send className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map(r => (
            <CommentItem
              key={r.id}
              comment={r}
              language={language}
              user={user}
              getRoleBadge={getRoleBadge}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onReply={onReply}
              onVote={onVote}
              submitting={submitting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default BlogPostPage;
