/**
 * Reviews Hook - Supabase Implementation
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string | null;
  user_name: string;
  user_email: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
}

export function useReviews(productId?: string) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userReview, setUserReview] = useState<ProductReview | null>(null);

  const fetchReviews = useCallback(async (params?: { sort?: string; limit?: number }) => {
    if (!productId) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true);

      if (params?.sort === "newest") query = query.order("created_at", { ascending: false });
      else if (params?.sort === "highest") query = query.order("rating", { ascending: false });
      else if (params?.sort === "lowest") query = query.order("rating", { ascending: true });
      else if (params?.sort === "helpful") query = query.order("helpful_count", { ascending: false });
      else query = query.order("created_at", { ascending: false });

      if (params?.limit) query = query.limit(params.limit);

      const { data, error } = await query;
      if (error) throw error;

      const mapped: ProductReview[] = (data || []).map((r) => ({
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        user_name: r.user_name || "Anonymous",
        user_email: r.user_email,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        is_verified_purchase: r.is_verified_purchase || false,
        is_approved: r.is_approved || true,
        helpful_count: r.helpful_count || 0,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      setReviews(mapped);

      // Calculate stats
      const total = mapped.length;
      const avg = total > 0 ? mapped.reduce((s, r) => s + r.rating, 0) / total : 0;
      const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      mapped.forEach((r) => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
      setStats({ total_reviews: total, average_rating: Math.round(avg * 10) / 10, rating_distribution: dist });

      // Find user's review
      if (user) {
        const ur = mapped.find((r) => r.user_id === user.id);
        setUserReview(ur || null);
      } else {
        setUserReview(null);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setIsLoading(false);
    }
  }, [productId, user]);

  const createReview = async (data: { rating: number; title?: string; comment?: string }): Promise<boolean> => {
    if (!productId || !user) {
      toast.error("রিভিউ দিতে লগইন করুন");
      return false;
    }
    try {
      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user.id,
        user_name: user.full_name || user.email || "Anonymous",
        user_email: user.email,
        rating: data.rating,
        title: data.title || null,
        comment: data.comment || null,
      });
      if (error) throw error;
      toast.success("রিভিউ সফলভাবে যোগ হয়েছে");
      await fetchReviews();
      return true;
    } catch (err) {
      console.error("Error creating review:", err);
      toast.error("রিভিউ যোগ করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const updateReview = async (reviewId: string, data: { rating?: number; title?: string; comment?: string }): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.rating !== undefined) updateData.rating = data.rating;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.comment !== undefined) updateData.comment = data.comment;

      const { error } = await supabase.from("product_reviews").update(updateData).eq("id", reviewId);
      if (error) throw error;
      toast.success("রিভিউ আপডেট হয়েছে");
      await fetchReviews();
      return true;
    } catch (err) {
      console.error("Error updating review:", err);
      toast.error("রিভিউ আপডেট করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const deleteReview = async (reviewId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("product_reviews").delete().eq("id", reviewId);
      if (error) throw error;
      toast.success("রিভিউ মুছে ফেলা হয়েছে");
      await fetchReviews();
      return true;
    } catch (err) {
      console.error("Error deleting review:", err);
      toast.error("রিভিউ মুছতে সমস্যা হয়েছে");
      return false;
    }
  };

  const markHelpful = async (reviewId: string): Promise<boolean> => {
    if (!user) {
      toast.error("ভোট দিতে লগইন করুন");
      return false;
    }
    try {
      const { error } = await supabase.from("review_helpful_votes").insert({
        review_id: reviewId,
        user_id: user.id,
      });
      if (error) {
        if (error.code === "23505") {
          toast.info("আপনি ইতিমধ্যে ভোট দিয়েছেন");
        }
        return false;
      }
      toast.success("ধন্যবাদ আপনার ভোটের জন্য");
      await fetchReviews();
      return true;
    } catch (err) {
      console.error("Error marking helpful:", err);
      return false;
    }
  };

  return { reviews, stats, isLoading, userReview, fetchReviews, createReview, updateReview, deleteReview, markHelpful };
}
