import { useState } from "react";
import { useAuth } from "@/contexts/AuthContextMySQL";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiClient } from "@/lib/api-client";
import { StarRating } from "./StarRating";
import { Button3D } from "@/components/ui/button-3d";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, X, Edit } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface ReviewFormProps {
  productId: number;
  existingReview?: {
    id: number;
    rating: number;
    title: string | null;
    review_text: string | null;
  } | null;
  onReviewSubmitted: () => void;
  onCancel?: () => void;
}

export const ReviewForm = ({ productId, existingReview, onReviewSubmitted, onCancel }: ReviewFormProps) => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [reviewText, setReviewText] = useState(existingReview?.review_text || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!existingReview;

  const translations = {
    writeReview: language === "bn" ? "রিভিউ লিখুন" : "Write a Review",
    editReview: language === "bn" ? "রিভিউ সম্পাদনা করুন" : "Edit Review",
    rating: language === "bn" ? "রেটিং" : "Rating",
    title: language === "bn" ? "শিরোনাম (ঐচ্ছিক)" : "Title (Optional)",
    titlePlaceholder: language === "bn" ? "আপনার রিভিউয়ের শিরোনাম..." : "Your review title...",
    review: language === "bn" ? "রিভিউ" : "Review",
    reviewPlaceholder: language === "bn" ? "আপনার অভিজ্ঞতা শেয়ার করুন..." : "Share your experience...",
    submit: language === "bn" ? "রিভিউ জমা দিন" : "Submit Review",
    update: language === "bn" ? "আপডেট করুন" : "Update",
    cancel: language === "bn" ? "বাতিল" : "Cancel",
    loginRequired: language === "bn" ? "রিভিউ দিতে লগইন করুন" : "Login to write a review",
    loginButton: language === "bn" ? "লগইন করুন" : "Login",
    selectRating: language === "bn" ? "রেটিং নির্বাচন করুন" : "Please select a rating",
    success: language === "bn" ? "রিভিউ সফলভাবে জমা হয়েছে" : "Review submitted successfully",
    updateSuccess: language === "bn" ? "রিভিউ আপডেট হয়েছে" : "Review updated successfully",
    error: language === "bn" ? "রিভিউ জমা দিতে সমস্যা হয়েছে" : "Failed to submit review",
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(translations.selectRating);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && existingReview) {
        const response = await apiClient.updateReview(String(existingReview.id), {
          rating,
          title: title || undefined,
          review_text: reviewText || undefined,
        });
        if (response.error) {
          toast.error(response.error);
        } else {
          toast.success(translations.updateSuccess);
          onReviewSubmitted();
        }
      } else {
        const response = await apiClient.createReview({
          product_id: productId,
          rating,
          title: title || undefined,
          review_text: reviewText || undefined,
        });
        if (response.error) {
          toast.error(response.error);
        } else {
          toast.success(translations.success);
          setRating(0);
          setTitle("");
          setReviewText("");
          onReviewSubmitted();
        }
      }
    } catch (error) {
      toast.error(translations.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">{translations.loginRequired}</p>
          <Link to="/auth">
            <Button3D variant="primary">{translations.loginButton}</Button3D>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          {isEditing ? <Edit className="h-5 w-5" /> : null}
          {isEditing ? translations.editReview : translations.writeReview}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating */}
        <div className="space-y-2">
          <Label>{translations.rating} *</Label>
          <StarRating
            rating={rating}
            size="lg"
            interactive
            onRatingChange={setRating}
          />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="review-title">{translations.title}</Label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={translations.titlePlaceholder}
            maxLength={255}
          />
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <Label htmlFor="review-text">{translations.review}</Label>
          <Textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={translations.reviewPlaceholder}
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button3D
            variant="success"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isEditing ? translations.update : translations.submit}
          </Button3D>
          {onCancel && (
            <Button3D variant="primary" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              {translations.cancel}
            </Button3D>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
