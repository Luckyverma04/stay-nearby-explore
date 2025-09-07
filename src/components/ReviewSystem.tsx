import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ThumbsUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReviewModal } from './ReviewModal';

interface Review {
  id: string;
  rating: number;
  title: string;
  review_text: string;
  room_type: string;
  stay_date: string;
  would_recommend: boolean;
  helpful_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
}

interface ReviewSystemProps {
  hotelId: string;
  bookingId?: string;
  allowReview?: boolean;
}

export const ReviewSystem = ({ hotelId, bookingId, allowReview = false }: ReviewSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('hotel_reviews')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('hotel_id', hotelId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews((data as any) || []);
      
      // Calculate average rating
      if (data && data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to mark reviews as helpful",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('hotel_reviews')
        .update({ 
          helpful_count: reviews.find(r => r.id === reviewId)?.helpful_count! + 1 
        })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful_count: review.helpful_count + 1 }
          : review
      ));

      toast({
        title: "Thank you!",
        description: "Your feedback has been recorded",
      });
    } catch (error) {
      console.error('Error marking helpful:', error);
      toast({
        title: "Error",
        description: "Failed to record feedback",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`${size} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    fetchReviews();
  }, [hotelId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Guest Reviews</span>
            {allowReview && user && (
              <Button onClick={() => setShowReviewModal(true)}>
                Write a Review
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{averageRating}</div>
            {renderStars(Math.round(averageRating), "w-5 h-5")}
            <span className="text-muted-foreground">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.profiles?.full_name || 'Anonymous'}</span>
                    {review.would_recommend && (
                      <Badge variant="secondary" className="text-xs">
                        Recommends
                      </Badge>
                    )}
                  </div>
                  {renderStars(review.rating)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>

              {review.title && (
                <h4 className="font-semibold mb-2">{review.title}</h4>
              )}

              {review.review_text && (
                <p className="text-muted-foreground mb-4">{review.review_text}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {review.room_type && <span>Room: {review.room_type}</span>}
                  {review.stay_date && (
                    <span>Stayed: {new Date(review.stay_date).toLocaleDateString()}</span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center gap-1"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({review.helpful_count})
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
          </CardContent>
        </Card>
      )}

      {/* Review Modal */}
      <ReviewModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        hotelId={hotelId}
        bookingId={bookingId}
        onReviewSubmitted={fetchReviews}
      />
    </div>
  );
};