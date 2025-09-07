import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hotelId: string;
  bookingId?: string;
  onReviewSubmitted: () => void;
}

export const ReviewModal = ({ 
  open, 
  onOpenChange, 
  hotelId, 
  bookingId, 
  onReviewSubmitted 
}: ReviewModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [roomType, setRoomType] = useState('');
  const [stayDate, setStayDate] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to submit a review",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('hotel_reviews')
        .insert({
          hotel_id: hotelId,
          booking_id: bookingId || null,
          user_id: user.id,
          rating,
          title: title.trim() || null,
          review_text: reviewText.trim() || null,
          room_type: roomType.trim() || null,
          stay_date: stayDate || null,
          would_recommend: wouldRecommend,
        });

      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Thank you for your review! It will be published after moderation.",
      });

      // Reset form
      setRating(0);
      setTitle('');
      setReviewText('');
      setRoomType('');
      setStayDate('');
      setWouldRecommend(true);
      
      onOpenChange(false);
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              star <= (hoveredRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground hover:text-yellow-400'
            }`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Rating *</Label>
            <div className="mt-1">
              {renderStars()}
            </div>
          </div>

          <div>
            <Label htmlFor="title">Review Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="review">Your Review</Label>
            <Textarea
              id="review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with other travelers"
              rows={4}
              maxLength={1000}
            />
          </div>

          <div>
            <Label htmlFor="room-type">Room Type</Label>
            <Input
              id="room-type"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              placeholder="e.g., Deluxe Double Room"
            />
          </div>

          <div>
            <Label htmlFor="stay-date">Stay Date</Label>
            <Input
              id="stay-date"
              type="date"
              value={stayDate}
              onChange={(e) => setStayDate(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recommend"
              checked={wouldRecommend}
              onCheckedChange={(checked) => setWouldRecommend(checked === true)}
            />
            <Label htmlFor="recommend">I would recommend this hotel to others</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || rating === 0} className="flex-1">
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};