/**
 * Reviews Hook - MySQL API Implementation
 */

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
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
      const response = await apiClient.getProductReviews(productId, {
        sort: params?.sort,
        limit: params?.limit,
      });

      if (response.error) throw new Error(response.error);

      const data = response.data;
      if (!data) {
        setReviews([]);
        setStats({ total_reviews: 0, average_rating: 0, rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
        return;
      }

      // Map API reviews to local format
      const mappedReviews: ProductReview[] = (data.reviews || []).map((r) => ({
        id: String(r.id),
        product_id: String(r.product_id),
        user_id: r.user_id ? String(r.user_id) : null,
        user_name: r.user_name || "Anonymous",
        user_email: null,
        rating: r.rating,
        title: r.title,
        comment: r.review_text,
        is_verified_purchase: r.is_verified_purchase,
        is_approved: true,
        helpful_count: r.helpful_count,
        created_at: r.created_at,
        updated_at: r.created_at,
      }));

      setReviews(mappedReviews);

      // Map stats
      if (data.stats) {
        setStats({
          total_reviews: data.stats.total_reviews,
          average_rating: data.stats.average_rating,
          rating_distribution: data.stats.rating_breakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      } else {
        setStats({ total_reviews: 0, average_rating: 0, rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
      }

      // Find user's review
      if (user && data.user_review) {
        setUserReview({
          id: String(data.user_review.id),
          product_id: String(data.user_review.product_id),
          user_id: String(data.user_review.user_id),
          user_name: data.user_review.user_name || "Anonymous",
          user_email: null,
          rating: data.user_review.rating,
          title: data.user_review.title,
          comment: data.user_review.review_text,
          is_verified_purchase: data.user_review.is_verified_purchase,
          is_approved: true,
          helpful_count: data.user_review.helpful_count,
          created_at: data.user_review.created_at,
          updated_at: data.user_review.created_at,
        });
      } else {
        setUserReview(null);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setIsLoading(false);
    }
  }, [productId, user]);

  const createReview = async (data: {
    rating: number;
    title?: string;
    comment?: string;
  }): Promise<boolean> => {
    if (!productId || !user) {
      toast.error("রিভিউ দিতে লগইন করুন");
      return false;
    }

    try {
      const response = await apiClient.createReview({
        product_id: Number(productId),
        rating: data.rating,
        title: data.title,
        review_text: data.comment,
      });

      if (response.error) {
        toast.error(response.error || "রিভিউ যোগ করতে সমস্যা হয়েছে");
        return false;
      }

      toast.success("রিভিউ সফলভাবে যোগ হয়েছে");
      await fetchReviews();
      return true;
    } catch (err) {
      console.error("Error creating review:", err);
      toast.error("রিভিউ যোগ করতে সমস্যা হয়েছে");
      return false;
    }
  };

  const updateReview = async (
    reviewId: string,
    data: { rating?: number; title?: string; comment?: string }
  ): Promise<boolean> => {
    try {
      const response = await apiClient.updateReview(reviewId, {
        rating: data.rating,
        title: data.title,
        review_text: data.comment,
      });

      if (response.error) {
        toast.error("রিভিউ আপডেট করতে সমস্যা হয়েছে");
        return false;
      }

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
      const response = await apiClient.deleteReview(reviewId);

      if (response.error) {
        toast.error("রিভিউ মুছতে সমস্যা হয়েছে");
        return false;
      }

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
      const response = await apiClient.markReviewHelpful(reviewId, true);

      if (response.error) {
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

  return {
    reviews,
    stats,
    isLoading,
    userReview,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    markHelpful,
  };
}
