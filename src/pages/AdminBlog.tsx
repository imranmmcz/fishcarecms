import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Check, X, Pin, Lock, Unlock, Trash2, Search, FileText, MessageSquare, Eye } from "lucide-react";
import { format } from "date-fns";

const AdminBlog = () => {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (search) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [statusFilter, search]);

  const updatePost = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from("blog_posts").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: language === "bn" ? "আপডেট হয়েছে" : "Updated" });
      fetchPosts();
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm(language === "bn" ? "এই পোস্ট মুছে ফেলতে চান?" : "Delete this post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    toast({ title: language === "bn" ? "পোস্ট মুছে ফেলা হয়েছে" : "Post deleted" });
    fetchPosts();
  };

  const pendingCount = posts.filter(p => p.status === "pending").length;
  const approvedCount = posts.filter(p => p.status === "approved").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{language === "bn" ? "ব্লগ ম্যানেজমেন্ট" : "Blog Management"}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-2xl font-bold">{posts.length}</div>
            <div className="text-sm text-muted-foreground">{language === "bn" ? "মোট পোস্ট" : "Total Posts"}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 mx-auto text-accent mb-2" />
            <div className="text-2xl font-bold">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">{language === "bn" ? "অনুমোদন অপেক্ষায়" : "Pending"}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Check className="h-8 w-8 mx-auto text-secondary mb-2" />
            <div className="text-2xl font-bold">{approvedCount}</div>
            <div className="text-sm text-muted-foreground">{language === "bn" ? "অনুমোদিত" : "Approved"}</div>
          </CardContent></Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder={language === "bn" ? "শিরোনাম খুঁজুন..." : "Search title..."} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "bn" ? "সকল" : "All"}</SelectItem>
              <SelectItem value="pending">{language === "bn" ? "অপেক্ষমাণ" : "Pending"}</SelectItem>
              <SelectItem value="approved">{language === "bn" ? "অনুমোদিত" : "Approved"}</SelectItem>
              <SelectItem value="rejected">{language === "bn" ? "প্রত্যাখ্যাত" : "Rejected"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "bn" ? "শিরোনাম" : "Title"}</TableHead>
                    <TableHead>{language === "bn" ? "লেখক" : "Author"}</TableHead>
                    <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                    <TableHead className="text-center"><MessageSquare className="h-4 w-4 mx-auto" /></TableHead>
                    <TableHead className="text-center"><Eye className="h-4 w-4 mx-auto" /></TableHead>
                    <TableHead>{language === "bn" ? "তারিখ" : "Date"}</TableHead>
                    <TableHead className="text-right">{language === "bn" ? "অ্যাকশন" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map(post => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-[200px]">
                        <div className="flex items-center gap-1">
                          {post.is_pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                          <span className="truncate font-medium">{post.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{post.author_name}</TableCell>
                      <TableCell>
                        <Badge variant={post.status === "approved" ? "default" : post.status === "pending" ? "secondary" : "destructive"} className="text-[10px]">
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{post.comment_count}</TableCell>
                      <TableCell className="text-center">{post.view_count}</TableCell>
                      <TableCell className="text-sm">{format(new Date(post.created_at), "dd/MM/yy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          {post.status !== "approved" && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-secondary" onClick={() => updatePost(post.id, { status: "approved" })} title="Approve">
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {post.status !== "rejected" && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updatePost(post.id, { status: "rejected" })} title="Reject">
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updatePost(post.id, { is_pinned: !post.is_pinned })} title="Pin">
                            <Pin className={`h-4 w-4 ${post.is_pinned ? "text-primary" : ""}`} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updatePost(post.id, { is_comments_locked: !post.is_comments_locked })} title="Lock comments">
                            {post.is_comments_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deletePost(post.id)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {posts.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {loading ? (language === "bn" ? "লোড হচ্ছে..." : "Loading...") : (language === "bn" ? "কোনো পোস্ট নেই" : "No posts")}
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminBlog;
