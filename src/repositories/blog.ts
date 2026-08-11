/**
 * Blog repository facade (Supabase ⇄ MySQL) for posts, images and comments.
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

export interface BlogImageRow {
  id: string;
  post_id: string;
  image_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  display_order: number;
}

export interface BlogPostRow {
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
  images?: BlogImageRow[];
}

export interface BlogCommentRow {
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
}

export interface BlogPostQuery {
  category?: string;
  search?: string;
  sort?: string;
  status?: string;
  limit?: number;
}

function normalizePost(row: any): BlogPostRow {
  let tags = row.tags;
  if (typeof tags === "string") {
    try { tags = JSON.parse(tags); } catch { tags = []; }
  }
  return {
    ...row,
    id: String(row.id),
    tags: Array.isArray(tags) ? tags : [],
    is_pinned: !!row.is_pinned,
    is_comments_locked: !!row.is_comments_locked,
    view_count: Number(row.view_count) || 0,
    comment_count: Number(row.comment_count) || 0,
    images: row.images || [],
  } as BlogPostRow;
}

const isMy = () => getDataSource("blog_posts") === "mysql";
const isMyComments = () => getDataSource("blog_comments") === "mysql";

async function attachImagesSupa(posts: any[]): Promise<BlogPostRow[]> {
  if (!posts.length) return [];
  const ids = posts.map((p) => p.id);
  const { data: images } = await supabase
    .from("blog_images")
    .select("*")
    .in("post_id", ids)
    .order("display_order");
  const map: Record<string, BlogImageRow[]> = {};
  (images || []).forEach((img: any) => {
    (map[img.post_id] = map[img.post_id] || []).push(img);
  });
  return posts.map((p) => normalizePost({ ...p, images: map[p.id] || [] }));
}

export const blogRepo = {
  source: () => getDataSource("blog_posts"),

  async listPosts(q: BlogPostQuery = {}): Promise<BlogPostRow[]> {
    if (isMy()) {
      const params = new URLSearchParams();
      if (q.category) params.set("category", q.category);
      if (q.search) params.set("search", q.search);
      if (q.sort) params.set("sort", q.sort);
      params.set("status", q.status ?? "approved");
      params.set("limit", String(q.limit ?? 200));
      const res = await apiClient.get<{ posts: any[] }>(`/api/blog/posts?${params.toString()}`);
      return (res.posts || []).map(normalizePost);
    }

    let query = supabase.from("blog_posts").select("*");
    if (!q.status || q.status !== "all") query = query.eq("status", q.status ?? "approved");
    if (q.category) query = query.eq("category", q.category);
    if (q.search) query = query.or(`title.ilike.%${q.search}%,content.ilike.%${q.search}%`);
    query = query.order("is_pinned", { ascending: false });
    if (q.sort === "most-commented") query = query.order("comment_count", { ascending: false });
    else if (q.sort === "most-viewed") query = query.order("view_count", { ascending: false });
    else query = query.order("created_at", { ascending: false });
    if (q.limit) query = query.limit(q.limit);
    const { data, error } = await query;
    if (error) throw error;
    return attachImagesSupa(data || []);
  },

  /** Fetch a post by slug and increment its view counter. */
  async getPostBySlug(slug: string): Promise<BlogPostRow | null> {
    if (isMy()) {
      const res = await apiClient.get<{ post: any }>(`/api/blog/posts/slug/${encodeURIComponent(slug)}`);
      return res.post ? normalizePost(res.post) : null;
    }
    const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
    if (!data) return null;
    await supabase
      .from("blog_posts")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", data.id);
    const [withImages] = await attachImagesSupa([data]);
    return withImages;
  },

  async createPost(input: Record<string, unknown>): Promise<BlogPostRow | null> {
    if (isMy()) {
      const res = await apiClient.post<{ post: any }>("/api/blog/posts", input);
      return res.post ? normalizePost(res.post) : null;
    }
    const { data, error } = await supabase.from("blog_posts").insert(input as any).select().single();
    if (error) throw error;
    return normalizePost(data);
  },

  async updatePost(id: string, patch: Record<string, unknown>): Promise<void> {
    if (isMy()) {
      await apiClient.put(`/api/blog/posts/${encodeURIComponent(id)}`, patch);
      return;
    }
    const { error } = await supabase.from("blog_posts").update(patch as any).eq("id", id);
    if (error) throw error;
  },

  async deletePost(id: string): Promise<void> {
    if (isMy()) {
      await apiClient.delete(`/api/blog/posts/${encodeURIComponent(id)}`);
      return;
    }
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) throw error;
  },

  async addImage(input: {
    post_id: string;
    image_url: string;
    alt_text?: string | null;
    display_order?: number;
  }): Promise<void> {
    if (isMy()) {
      await apiClient.post("/api/blog/images", input);
      return;
    }
    const { error } = await supabase.from("blog_images").insert(input as any);
    if (error) throw error;
  },

  async listComments(postId: string): Promise<BlogCommentRow[]> {
    if (isMyComments()) {
      const res = await apiClient.get<{ comments: any[] }>(
        `/api/blog/comments?post_id=${encodeURIComponent(postId)}`
      );
      return res.comments || [];
    }
    const { data, error } = await supabase
      .from("blog_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("status", "approved")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []) as BlogCommentRow[];
  },

  async createComment(input: Record<string, unknown>): Promise<BlogCommentRow | null> {
    if (isMyComments()) {
      const res = await apiClient.post<{ comment: any }>("/api/blog/comments", input);
      return res.comment || null;
    }
    const { data, error } = await supabase.from("blog_comments").insert(input as any).select().single();
    if (error) throw error;
    return data as BlogCommentRow;
  },

  async deleteComment(id: string): Promise<void> {
    if (isMyComments()) {
      await apiClient.delete(`/api/blog/comments/${encodeURIComponent(id)}`);
      return;
    }
    const { error } = await supabase.from("blog_comments").delete().eq("id", id);
    if (error) throw error;
  },
};
