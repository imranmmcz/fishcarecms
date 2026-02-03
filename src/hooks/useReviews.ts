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

      // Apply sorting
      switch (params?.sort) {
        case "highest":
          query = query.order("rating", { ascending: false });
          break;
        case "lowest":
          query = query.order("rating", { ascending: true });
          break;
        case "helpful":
          query = query.order("helpful_count", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const totalReviews = data.length;
        const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        data.forEach(r => {
          distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });

        setStats({
          total_reviews: totalReviews,
          average_rating: Math.round(avgRating * 10) / 10,
          rating_distribution: distribution,
        });
      } else {
        setStats({
          total_reviews: 0,
          average_rating: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      }

      // Find user's review
      if (user) {
        const userRev = data?.find(r => r.user_id === user.id);
        setUserReview(userRev || null);
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
      // Check if user already reviewed
      const { data: existing } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        toast.error("আপনি ইতিমধ্যে এই পণ্যের রিভিউ দিয়েছেন");
        return false;
      }

      // Check if user purchased this product
      const { data: orders } = await supabase
        .from("order_items")
        .select(`
          order_id,
          orders!inner(user_id, status)
        `)
        .eq("product_id", productId);

      const isVerifiedPurchase = orders?.some(
        (o: any) => o.orders?.user_id === user.id && o.orders?.status === "delivered"
      ) || false;

      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      const { error } = await supabase
        .from("product_reviews")
        .insert({
          product_id: productId,
          user_id: user.id,
          user_name: profile?.full_name || user.email?.split("@")[0] || "Anonymous",
          user_email: user.email,
          rating: data.rating,
          title: data.title || null,
          comment: data.comment || null,
          is_verified_purchase: isVerifiedPurchase,
          is_approved: true, // Auto-approve for now
          helpful_count: 0,
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

  const updateReview = async (
    reviewId: string,
    data: { rating?: number; title?: string; comment?: string }
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("product_reviews")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId)
        .eq("user_id", user?.id);

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
      const { error } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user?.id);

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
      // Check if already voted
      const { data: existing } = await supabase
        .from("review_helpful_votes")
        .select("id")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        // Remove vote
        const { error } = await supabase
          .from("review_helpful_votes")
          .delete()
          .eq("id", existing.id);

        if (error) throw error;
        toast.success("ভোট সরিয়ে নেওয়া হয়েছে");
      } else {
        // Add vote
        const { error } = await supabase
          .from("review_helpful_votes")
          .insert({
            review_id: reviewId,
            user_id: user.id,
          });

        if (error) throw error;
        toast.success("ধন্যবাদ আপনার ভোটের জন্য");
      }

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
