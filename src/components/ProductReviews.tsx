import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useReviews, ProductReview, ReviewStats } from "@/hooks/useReviews";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle, 
  Loader2, 
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { bn, enUS } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const {
    reviews,
    stats,
    isLoading,
    userReview,
    fetchReviews,
    deleteReview,
    markHelpful,
  } = useReviews(productId);
  
  const [sortBy, setSortBy] = useState("newest");
  const [isEditing, setIsEditing] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);

  const translations = {
    reviews: language === "bn" ? "রিভিউ সমূহ" : "Reviews",
    noReviews: language === "bn" ? "এখনো কোন রিভিউ নেই" : "No reviews yet",
    beFirst: language === "bn" ? "প্রথম রিভিউ দিন!" : "Be the first to review!",
    loginToReview: language === "bn" ? "রিভিউ দিতে লগইন করুন" : "Login to review",
    sortBy: language === "bn" ? "সাজান" : "Sort by",
    newest: language === "bn" ? "নতুন" : "Newest",
    oldest: language === "bn" ? "পুরাতন" : "Oldest",
    highestRated: language === "bn" ? "সেরা রেটিং" : "Highest rated",
    lowestRated: language === "bn" ? "কম রেটিং" : "Lowest rated",
    mostHelpful: language === "bn" ? "সবচেয়ে সহায়ক" : "Most helpful",
    helpful: language === "bn" ? "সহায়ক" : "Helpful",
    verifiedPurchase: language === "bn" ? "যাচাইকৃত ক্রয়" : "Verified Purchase",
    yourReview: language === "bn" ? "আপনার রিভিউ" : "Your Review",
    edit: language === "bn" ? "সম্পাদনা" : "Edit",
    delete: language === "bn" ? "মুছুন" : "Delete",
    loadMore: language === "bn" ? "আরো দেখুন" : "Load More",
    confirmDelete: language === "bn" ? "আপনি কি নিশ্চিত যে এই রিভিউ মুছতে চান?" : "Are you sure you want to delete this review?",
    deleteTitle: language === "bn" ? "রিভিউ মুছুন" : "Delete Review",
    cancel: language === "bn" ? "বাতিল" : "Cancel",
    confirm: language === "bn" ? "নিশ্চিত" : "Confirm",
    basedOn: language === "bn" ? "এর উপর ভিত্তি করে" : "based on",
    ratings: language === "bn" ? "রেটিং" : "ratings",
  };

  useEffect(() => {
    fetchReviews({ sort: sortBy });
  }, [fetchReviews, sortBy]);

  const handleReviewSubmitted = () => {
    fetchReviews({ sort: sortBy });
    setIsEditing(false);
  };

  const handleDeleteConfirm = async () => {
    if (deleteReviewId) {
      await deleteReview(deleteReviewId);
      setDeleteReviewId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {stats && stats.total_reviews > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="text-center md:border-r md:pr-6">
                <div className="text-5xl font-bold text-primary">
                  {stats.average_rating.toFixed(1)}
                </div>
                <StarRating rating={stats.average_rating} size="lg" />
                <p className="text-sm text-muted-foreground mt-2">
                  {translations.basedOn} {stats.total_reviews} {translations.ratings}
                </p>
              </div>
              
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.rating_distribution[star] || 0;
                  const percentage = stats.total_reviews > 0 
                    ? (count / stats.total_reviews) * 100 
                    : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-8 text-sm font-medium">{star}★</span>
                      <Progress value={percentage} className="flex-1" />
                      <span className="w-10 text-sm text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Review Section */}
      {user && userReview && !isEditing ? (
        <Card className="border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                {translations.yourReview}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-1"
                >
                  <Edit className="h-4 w-4" />
                  {translations.edit}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteReviewId(userReview.id)}
                  className="gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  {translations.delete}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StarRating rating={userReview.rating} />
            {userReview.title && (
              <h4 className="font-semibold mt-2">{userReview.title}</h4>
            )}
            {userReview.comment && (
              <p className="text-muted-foreground mt-1">{userReview.comment}</p>
            )}
          </CardContent>
        </Card>
      ) : user && (!userReview || isEditing) ? (
        <ReviewForm
          productId={productId}
          existingReview={isEditing && userReview ? {
            id: userReview.id,
            rating: userReview.rating,
            title: userReview.title,
            comment: userReview.comment,
          } : null}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={isEditing ? () => setIsEditing(false) : undefined}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{translations.loginToReview}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Reviews List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {translations.reviews} ({reviews.length})
          </h3>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={translations.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{translations.newest}</SelectItem>
              <SelectItem value="highest">{translations.highestRated}</SelectItem>
              <SelectItem value="lowest">{translations.lowestRated}</SelectItem>
              <SelectItem value="helpful">{translations.mostHelpful}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">{translations.noReviews}</p>
              <p className="text-muted-foreground">{translations.beFirst}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {review.user_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{review.user_name}</span>
                        {review.is_verified_purchase && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {translations.verifiedPurchase}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), {
                            addSuffix: true,
                            locale: language === "bn" ? bn : enUS,
                          })}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="font-semibold mb-1">{review.title}</h4>
                      )}
                      {review.comment && (
                        <p className="text-muted-foreground">{review.comment}</p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 gap-1"
                        onClick={() => markHelpful(review.id)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {translations.helpful} ({review.helpful_count})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.confirmDelete}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {translations.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
