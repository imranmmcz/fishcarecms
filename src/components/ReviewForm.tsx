import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReviews } from "@/hooks/useReviews";
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
  productId: string;
  existingReview?: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
  } | null;
  onReviewSubmitted: () => void;
  onCancel?: () => void;
}

export const ReviewForm = ({ productId, existingReview, onReviewSubmitted, onCancel }: ReviewFormProps) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { createReview, updateReview } = useReviews(productId);
  
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [reviewText, setReviewText] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const translations = {
    writeReview: language === "bn" ? "রিভিউ লিখুন" : "Write a Review",
    editReview: language === "bn" ? "রিভিউ সম্পাদনা করুন" : "Edit Review",
    rating: language === "bn" ? "রেটিং" : "Rating",
    title: language === "bn" ? "শিরোনাম (ঐচ্ছিক)" : "Title (optional)",
    titlePlaceholder: language === "bn" ? "সংক্ষেপে আপনার অভিজ্ঞতা" : "Summarize your experience",
    review: language === "bn" ? "রিভিউ (ঐচ্ছিক)" : "Review (optional)",
    reviewPlaceholder: language === "bn" ? "আপনার অভিজ্ঞতা বিস্তারিত লিখুন..." : "Share your experience in detail...",
    submit: language === "bn" ? "জমা দিন" : "Submit",
    update: language === "bn" ? "আপডেট করুন" : "Update",
    cancel: language === "bn" ? "বাতিল" : "Cancel",
    loginRequired: language === "bn" ? "রিভিউ দিতে লগইন করুন" : "Please login to write a review",
    ratingRequired: language === "bn" ? "রেটিং দিন" : "Please provide a rating",
    success: language === "bn" ? "রিভিউ সফলভাবে জমা হয়েছে!" : "Review submitted successfully!",
    updateSuccess: language === "bn" ? "রিভিউ সফলভাবে আপডেট হয়েছে!" : "Review updated successfully!",
    error: language === "bn" ? "রিভিউ জমা করতে সমস্যা হয়েছে" : "Failed to submit review",
    login: language === "bn" ? "লগইন করুন" : "Login",
  };

  const isEditing = !!existingReview;

  const handleSubmit = async () => {
    if (!user) {
      toast.error(translations.loginRequired);
      return;
    }

    if (rating === 0) {
      toast.error(translations.ratingRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      let success: boolean;

      if (isEditing && existingReview) {
        success = await updateReview(existingReview.id, {
          rating,
          title: title || undefined,
          comment: reviewText || undefined,
        });
        if (success) {
          toast.success(translations.updateSuccess);
        }
      } else {
        success = await createReview({
          rating,
          title: title || undefined,
          comment: reviewText || undefined,
        });
        if (success) {
          setRating(0);
          setTitle("");
          setReviewText("");
        }
      }

      if (success) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(translations.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground mb-4">{translations.loginRequired}</p>
          <Link to="/auth">
            <Button3D variant="primary">{translations.login}</Button3D>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? <Edit className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          {isEditing ? translations.editReview : translations.writeReview}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{translations.rating}</Label>
          <div className="mt-2">
            <StarRating
              rating={rating}
              interactive
              onRatingChange={setRating}
              size="lg"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="review-title">{translations.title}</Label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={translations.titlePlaceholder}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="review-text">{translations.review}</Label>
          <Textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={translations.reviewPlaceholder}
            rows={4}
            className="mt-1"
          />
        </div>

        <div className="flex gap-2">
          <Button3D
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isEditing ? translations.update : translations.submit}
          </Button3D>
          {onCancel && (
            <Button3D variant="danger" onClick={onCancel} className="gap-2">
              <X className="h-4 w-4" />
              {translations.cancel}
            </Button3D>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
