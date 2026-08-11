/**
 * Reviews Hook — routed through the reviews repository facade
 * (Supabase or MySQL depending on Admin → Database Config).
 */

import { useState, useCallback } from "react";
import { reviewsRepo } from "@/repositories/reviews";
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
      const rows = await reviewsRepo.list({
        productId,
        sort: params?.sort,
        limit: params?.limit,
      });

      const mapped: ProductReview[] = rows.map((r) => ({ ...r, user_email: null }));

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
      await reviewsRepo.create({
        product_id: productId,
        user_id: user.id,
        user_name: user.full_name || user.email || "Anonymous",
        user_email: user.email,
        rating: data.rating,
        title: data.title || null,
        comment: data.comment || null,
      });
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

      await reviewsRepo.update(reviewId, updateData as { rating?: number; title?: string; comment?: string });
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
      await reviewsRepo.remove(reviewId);
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
      const result = await reviewsRepo.markHelpful(reviewId, user.id);
      if (result === "duplicate") {
        toast.info("আপনি ইতিমধ্যে ভোট দিয়েছেন");
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
