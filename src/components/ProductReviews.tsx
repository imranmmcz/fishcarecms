import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, ProductReview, ReviewStats } from "@/lib/api-client";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  ThumbsUp, 
  CheckCircle, 
  Loader2, 
  ChevronDown,
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { bn, enUS } from "date-fns/locale";
import { toast } from "sonner";
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
  productId: number;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [userReview, setUserReview] = useState<ProductReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);
  const limit = 5;

  const translations = {
    reviews: language === "bn" ? "রিভিউ সমূহ" : "Reviews",
    noReviews: language === "bn" ? "এখনো কোন রিভিউ নেই" : "No reviews yet",
    beFirst: language === "bn" ? "প্রথম রিভিউ দিন!" : "Be the first to review!",
    verifiedPurchase: language === "bn" ? "যাচাইকৃত ক্রেতা" : "Verified Purchase",
    helpful: language === "bn" ? "সহায়ক" : "Helpful",
    loadMore: language === "bn" ? "আরো দেখুন" : "Load More",
    sortBy: language === "bn" ? "সাজান" : "Sort by",
    newest: language === "bn" ? "নতুন" : "Newest",
    oldest: language === "bn" ? "পুরাতন" : "Oldest",
    highest: language === "bn" ? "সেরা রেটিং" : "Highest Rating",
    lowest: language === "bn" ? "কম রেটিং" : "Lowest Rating",
    mostHelpful: language === "bn" ? "সবচেয়ে সহায়ক" : "Most Helpful",
    basedOn: language === "bn" ? "রিভিউ এর উপর ভিত্তি করে" : "based on reviews",
    yourReview: language === "bn" ? "আপনার রিভিউ" : "Your Review",
    editReview: language === "bn" ? "সম্পাদনা" : "Edit",
    deleteReview: language === "bn" ? "মুছুন" : "Delete",
    deleteConfirmTitle: language === "bn" ? "রিভিউ মুছে ফেলুন?" : "Delete Review?",
    deleteConfirmDesc: language === "bn" ? "আপনি কি নিশ্চিত যে আপনি এই রিভিউ মুছে ফেলতে চান?" : "Are you sure you want to delete this review?",
    cancel: language === "bn" ? "বাতিল" : "Cancel",
    delete: language === "bn" ? "মুছুন" : "Delete",
    deleteSuccess: language === "bn" ? "রিভিউ মুছে ফেলা হয়েছে" : "Review deleted",
  };

  const fetchReviews = async (reset = false) => {
    if (reset) {
      setIsLoading(true);
      setOffset(0);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const currentOffset = reset ? 0 : offset;
      const response = await apiClient.getProductReviews(String(productId), {
        limit,
        offset: currentOffset,
        sort: sortBy,
      });

      if (response.data) {
        if (reset) {
          setReviews(response.data.reviews);
        } else {
          setReviews(prev => [...prev, ...response.data!.reviews]);
        }
        setStats(response.data.stats);
        setUserReview(response.data.user_review);
        setHasMore(response.data.reviews.length === limit);
        setOffset(currentOffset + limit);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(true);
  }, [productId, sortBy]);

  const handleReviewSubmitted = () => {
    setIsEditing(false);
    fetchReviews(true);
  };

  const handleHelpful = async (reviewId: number) => {
    if (!isAuthenticated) {
      toast.error(language === "bn" ? "লগইন করুন" : "Please login");
      return;
    }

    try {
      await apiClient.markReviewHelpful(String(reviewId), true);
      setReviews(prev => 
        prev.map(r => 
          r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
        )
      );
    } catch (error) {
      console.error("Error marking helpful:", error);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteReviewId) return;

    try {
      const response = await apiClient.deleteReview(String(deleteReviewId));
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(translations.deleteSuccess);
        fetchReviews(true);
      }
    } catch (error) {
      toast.error(language === "bn" ? "মুছতে সমস্যা হয়েছে" : "Failed to delete");
    } finally {
      setDeleteReviewId(null);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: language === "bn" ? bn : enUS,
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      {stats && stats.total_reviews > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Overall Rating */}
              <div className="text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="text-5xl font-bold">{stats.average_rating.toFixed(1)}</span>
                  <div>
                    <StarRating rating={Math.round(stats.average_rating)} size="lg" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.total_reviews} {translations.basedOn}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = stats.rating_breakdown[star as keyof typeof stats.rating_breakdown];
                  const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                  
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="w-8 text-sm text-muted-foreground">{star}★</span>
                      <Progress value={percentage} className="flex-1 h-2" />
                      <span className="w-8 text-sm text-muted-foreground text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User's Own Review or Form */}
      {userReview && !isEditing ? (
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                {translations.yourReview}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  {translations.editReview}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteReviewId(userReview.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {translations.deleteReview}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StarRating rating={userReview.rating} size="md" />
            {userReview.title && (
              <h4 className="font-semibold mt-2">{userReview.title}</h4>
            )}
            {userReview.review_text && (
              <p className="text-muted-foreground mt-1">{userReview.review_text}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">{formatDate(userReview.created_at)}</p>
          </CardContent>
        </Card>
      ) : (
        <ReviewForm
          productId={productId}
          existingReview={isEditing ? userReview : null}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={isEditing ? () => setIsEditing(false) : undefined}
        />
      )}

      <Separator />

      {/* Reviews List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {translations.reviews} ({stats?.total_reviews || 0})
          </h3>
          
          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={translations.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{translations.newest}</SelectItem>
              <SelectItem value="oldest">{translations.oldest}</SelectItem>
              <SelectItem value="highest">{translations.highest}</SelectItem>
              <SelectItem value="lowest">{translations.lowest}</SelectItem>
              <SelectItem value="helpful">{translations.mostHelpful}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-semibold mb-2">{translations.noReviews}</h4>
              <p className="text-muted-foreground">{translations.beFirst}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.user_avatar || undefined} />
                      <AvatarFallback>{getInitials(review.user_name)}</AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{review.user_name || "Anonymous"}</span>
                        {review.is_verified_purchase && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {translations.verifiedPurchase}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(review.created_at)}
                        </span>
                      </div>

                      {review.title && (
                        <h4 className="font-medium mt-2">{review.title}</h4>
                      )}
                      
                      {review.review_text && (
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                          {review.review_text}
                        </p>
                      )}

                      {/* Helpful Button */}
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => handleHelpful(review.id)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {translations.helpful}
                          {review.helpful_count > 0 && (
                            <span className="ml-1">({review.helpful_count})</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => fetchReviews(false)}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  )}
                  {translations.loadMore}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {translations.deleteConfirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translations.deleteConfirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteReview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductReviews;
