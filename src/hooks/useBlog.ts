import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface BlogPost {
  id: string;
  user_id: string | null;
  title: string;
  slug: string;
  content: string | null;
  category: string;
  tags: string[];
  status: string;
  is_pinned: boolean;
  is_comments_locked: boolean;
  view_count: number;
  comment_count: number;
  author_name: string | null;
  author_role: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  created_at: string;
  updated_at: string;
  images?: BlogImage[];
}

export interface BlogImage {
  id: string;
  post_id: string;
  image_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  display_order: number;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string | null;
  parent_id: string | null;
  author_name: string;
  author_role: string;
  comment_text: string;
  image_url: string | null;
  helpful_count: number;
  status: string;
  created_at: string;
  replies?: BlogComment[];
}

export const BLOG_CATEGORIES = [
  { value: "fish-disease", label_bn: "মাছের রোগ", label_en: "Fish Disease" },
  { value: "feed", label_bn: "খাদ্য", label_en: "Feed" },
  { value: "water-quality", label_bn: "পানির গুণমান", label_en: "Water Quality" },
  { value: "equipment", label_bn: "সরঞ্জাম", label_en: "Equipment" },
  { value: "general", label_bn: "সাধারণ মৎস্য চাষ", label_en: "General Farming" },
  { value: "marketing", label_bn: "বাজারজাতকরণ", label_en: "Marketing" },
  { value: "breeding", label_bn: "প্রজনন", label_en: "Breeding" },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100) + "-" + Date.now().toString(36);
}

export function useBlogPosts(filters?: { category?: string; search?: string; sort?: string }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "approved")
      .order("is_pinned", { ascending: false });

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    if (filters?.sort === "most-commented") {
      query = query.order("comment_count", { ascending: false });
    } else if (filters?.sort === "most-viewed") {
      query = query.order("view_count", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching blog posts:", error);
    } else {
      // Fetch images for each post
      const postIds = (data || []).map(p => p.id);
      if (postIds.length > 0) {
        const { data: images } = await supabase
          .from("blog_images")
          .select("*")
          .in("post_id", postIds)
          .order("display_order");
        
        const imageMap: Record<string, BlogImage[]> = {};
        (images || []).forEach((img: any) => {
          if (!imageMap[img.post_id]) imageMap[img.post_id] = [];
          imageMap[img.post_id].push(img);
        });

        setPosts((data || []).map(p => ({ ...p, images: imageMap[p.id] || [] })));
      } else {
        setPosts([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [filters?.category, filters?.search, filters?.sort]);

  return { posts, loading, refetch: fetchPosts };
}

export function useBlogPost(slug: string | undefined) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();

      if (data) {
        // Increment view
        await supabase.from("blog_posts").update({ view_count: (data.view_count || 0) + 1 }).eq("id", data.id);
        
        const { data: images } = await supabase
          .from("blog_images")
          .select("*")
          .eq("post_id", data.id)
          .order("display_order");
        
        setPost({ ...data, images: images || [] });
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  return { post, loading };
}

export function useBlogComments(postId: string | undefined) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    if (!postId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    if (data) {
      // Build nested comments
      const map: Record<string, BlogComment> = {};
      const roots: BlogComment[] = [];
      data.forEach((c: any) => {
        map[c.id] = { ...c, replies: [] };
      });
      data.forEach((c: any) => {
        if (c.parent_id && map[c.parent_id]) {
          map[c.parent_id].replies!.push(map[c.id]);
        } else {
          roots.push(map[c.id]);
        }
      });
      setComments(roots);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();

    if (!postId) return;
    const channel = supabase
      .channel(`blog-comments-${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "blog_comments", filter: `post_id=eq.${postId}` }, () => {
        fetchComments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId]);

  return { comments, loading, refetch: fetchComments };
}

export function useBlogActions() {
  const { user, isAdmin } = useAuth();

  const createPost = async (data: {
    title: string;
    content: string;
    category: string;
    tags: string[];
    imageFiles?: File[];
  }) => {
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const slug = generateSlug(data.title);
    const authorRole = roleData?.role || "farmer";

    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        user_id: user.id,
        title: data.title,
        slug,
        content: data.content,
        category: data.category,
        tags: data.tags,
        status: isAdmin ? "approved" : "pending",
        author_name: profile?.full_name || user.email?.split("@")[0] || "Anonymous",
        author_role: authorRole,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    // Upload images
    if (data.imageFiles && data.imageFiles.length > 0 && post) {
      for (let i = 0; i < data.imageFiles.length; i++) {
        const file = data.imageFiles[i];
        const filePath = `${post.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("blog-images")
          .upload(filePath, file);

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(filePath);
          await supabase.from("blog_images").insert({
            post_id: post.id,
            image_url: urlData.publicUrl,
            alt_text: data.title,
            display_order: i,
          });
        }
      }
    }

    toast({ title: isAdmin ? "পোস্ট প্রকাশিত হয়েছে" : "পোস্ট অনুমোদনের জন্য পাঠানো হয়েছে" });
    return post;
  };

  const addComment = async (postId: string, text: string, parentId?: string) => {
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const { data: comment, error } = await supabase
      .from("blog_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        parent_id: parentId || null,
        author_name: profile?.full_name || user.email?.split("@")[0] || "Anonymous",
        author_role: roleData?.role || "farmer",
        comment_text: text,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    // Notify post author
    const { data: postData } = await supabase
      .from("blog_posts")
      .select("user_id, title")
      .eq("id", postId)
      .single();

    if (postData?.user_id && postData.user_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: postData.user_id,
        title: "New comment on your post",
        title_bn: "আপনার পোস্টে নতুন মন্তব্য",
        message: `Someone commented on "${postData.title}"`,
        message_bn: `"${postData.title}" পোস্টে কেউ মন্তব্য করেছে`,
        type: "blog_comment",
        reference_id: postId,
        reference_type: "blog_post",
      });
    }

    // Notify parent comment author for replies
    if (parentId) {
      const { data: parentComment } = await supabase
        .from("blog_comments")
        .select("user_id")
        .eq("id", parentId)
        .single();

      if (parentComment?.user_id && parentComment.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: parentComment.user_id,
          title: "New reply to your comment",
          title_bn: "আপনার মন্তব্যে নতুন উত্তর",
          message: `Someone replied to your comment`,
          message_bn: `কেউ আপনার মন্তব্যের উত্তর দিয়েছে`,
          type: "blog_reply",
          reference_id: postId,
          reference_type: "blog_post",
        });
      }
    }

    return comment;
  };

  const toggleVote = async (commentId: string) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("blog_comment_votes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("blog_comment_votes").delete().eq("id", existing.id);
    } else {
      await supabase.from("blog_comment_votes").insert({ comment_id: commentId, user_id: user.id });
    }
  };

  return { createPost, addComment, toggleVote };
}
