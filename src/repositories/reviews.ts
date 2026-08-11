/**
 * Product Reviews repository facade (Supabase ⇄ MySQL).
 */
import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/lib/apiClient";
import { getDataSource } from "@/lib/dataSource";

export interface ProductReviewRow {
  id: string;
  product_id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewListParams {
  productId: string;
  sort?: string;
  limit?: number;
}

function normalize(row: any): ProductReviewRow {
  return {
    id: String(row.id),
    product_id: String(row.product_id),
    user_id: row.user_id ? String(row.user_id) : null,
    user_name: row.user_name || row.author_name || "Anonymous",
    rating: Number(row.rating) || 0,
    title: row.title ?? null,
    comment: row.comment ?? row.review_text ?? null,
    is_verified_purchase: !!row.is_verified_purchase,
    is_approved: row.is_approved === undefined ? true : !!row.is_approved,
    helpful_count: Number(row.helpful_count) || 0,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
  };
}

const isMy = () => getDataSource("product_reviews") === "mysql";

async function listSupa({ productId, sort, limit }: ReviewListParams): Promise<ProductReviewRow[]> {
  let query = supabase
    .from("product_reviews")
    .select(
      "id, product_id, user_id, user_name, rating, title, comment, is_verified_purchase, is_approved, helpful_count, created_at, updated_at"
    )
    .eq("product_id", productId)
    .eq("is_approved", true);

  if (sort === "highest") query = query.order("rating", { ascending: false });
  else if (sort === "lowest") query = query.order("rating", { ascending: true });
  else if (sort === "helpful") query = query.order("helpful_count", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalize);
}

async function listMy({ productId, sort, limit }: ReviewListParams): Promise<ProductReviewRow[]> {
  const params = new URLSearchParams({ sort: sort || "newest", limit: String(limit ?? 100) });
  const res = await apiClient.get<{ reviews: any[] }>(
    `/api/reviews/product/${encodeURIComponent(productId)}?${params.toString()}`
  );
  return (res.reviews || []).map(normalize);
}

export const reviewsRepo = {
  source: () => getDataSource("product_reviews"),
  list: (params: ReviewListParams) => (isMy() ? listMy(params) : listSupa(params)),
  async create(input: {
    product_id: string;
    user_id: string;
    user_name: string;
    user_email?: string | null;
    rating: number;
    title?: string | null;
    comment?: string | null;
  }): Promise<void> {
    if (isMy()) {
      await apiClient.post("/api/reviews", {
        product_id: input.product_id,
        rating: input.rating,
        title: input.title ?? null,
        review_text: input.comment ?? null,
      });
      return;
    }
    const { error } = await supabase.from("product_reviews").insert(input as any);
    if (error) throw error;
  },
  async update(id: string, patch: { rating?: number; title?: string; comment?: string }): Promise<void> {
    if (isMy()) {
      await apiClient.put(`/api/reviews/${encodeURIComponent(id)}`, {
        rating: patch.rating,
        title: patch.title,
        review_text: patch.comment,
      });
      return;
    }
    const { error } = await supabase.from("product_reviews").update(patch as any).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string): Promise<void> {
    if (isMy()) {
      await apiClient.delete(`/api/reviews/${encodeURIComponent(id)}`);
      return;
    }
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) throw error;
  },
  /** Returns "ok" | "duplicate" */
  async markHelpful(reviewId: string, userId: string): Promise<"ok" | "duplicate"> {
    if (isMy()) {
      try {
        await apiClient.post(`/api/reviews/${encodeURIComponent(reviewId)}/helpful`, {});
        return "ok";
      } catch (e: any) {
        if (String(e?.message || "").toLowerCase().includes("already")) return "duplicate";
        throw e;
      }
    }
    const { error } = await supabase
      .from("review_helpful_votes")
      .insert({ review_id: reviewId, user_id: userId });
    if (error) {
      if (error.code === "23505") return "duplicate";
      throw error;
    }
    return "ok";
  },
};
