import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { blogRepo } from "@/repositories/blog";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PenSquare, Eye, MessageSquare, Clock, ExternalLink, FileText, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

const DashboardBlog = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const { data: myPosts = [], isLoading } = useQuery({
    queryKey: ["my-blog-posts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await blogRepo.listPosts({ userId: user.id, status: "all" });
    },
    enabled: !!user?.id,
  });

  const approvedCount = myPosts.filter((p: any) => p.status === "approved").length;
  const pendingCount = myPosts.filter((p: any) => p.status === "pending").length;
  const totalViews = myPosts.reduce((sum: number, p: any) => sum + (p.view_count || 0), 0);
  const totalComments = myPosts.reduce((sum: number, p: any) => sum + (p.comment_count || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{isBn ? "📝 আমার ব্লগ" : "📝 My Blog"}</h1>
          <Link to="/blog">
            <Button className="gap-2">
              <ExternalLink className="h-4 w-4" />
              {isBn ? "ব্লগে যান" : "Go to Blog"}
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-6 w-6 mx-auto text-primary mb-1" />
              <div className="text-2xl font-bold">{myPosts.length}</div>
              <div className="text-xs text-muted-foreground">{isBn ? "মোট পোস্ট" : "Total Posts"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto text-secondary mb-1" />
              <div className="text-2xl font-bold">{approvedCount}</div>
              <div className="text-xs text-muted-foreground">{isBn ? "অনুমোদিত" : "Approved"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="h-6 w-6 mx-auto text-accent mb-1" />
              <div className="text-2xl font-bold">{totalViews}</div>
              <div className="text-xs text-muted-foreground">{isBn ? "মোট ভিউ" : "Total Views"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-6 w-6 mx-auto text-primary mb-1" />
              <div className="text-2xl font-bold">{totalComments}</div>
              <div className="text-xs text-muted-foreground">{isBn ? "মোট মন্তব্য" : "Total Comments"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Posts List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{isBn ? "আমার পোস্টসমূহ" : "My Posts"}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : myPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PenSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{isBn ? "আপনি এখনো কোনো পোস্ট করেননি" : "You haven't posted anything yet"}</p>
                <Link to="/blog">
                  <Button variant="outline" className="mt-3">{isBn ? "প্রথম পোস্ট করুন" : "Create your first post"}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myPosts.map((post: any) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium text-foreground truncate">{post.title}</h3>
                          <Badge
                            variant={post.status === "approved" ? "default" : post.status === "pending" ? "secondary" : "destructive"}
                            className="text-[10px]"
                          >
                            {post.status === "approved" ? (isBn ? "অনুমোদিত" : "Approved") :
                             post.status === "pending" ? (isBn ? "অপেক্ষমাণ" : "Pending") :
                             (isBn ? "প্রত্যাখ্যাত" : "Rejected")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(post.created_at), "dd MMM yyyy", { locale: isBn ? bn : undefined })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {post.view_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {post.comment_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardBlog;
