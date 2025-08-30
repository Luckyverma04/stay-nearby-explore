import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Star, Wifi, Car, Utensils, Waves, Heart, Share2, Eye } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface Hotel {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  star_rating?: number;
  price_per_night?: number;
  amenities?: string[];
  image_urls?: string[];
}

interface HotelCardProps {
  hotel: Hotel;
}

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  restaurant: Utensils,
  pool: Waves,
  spa: Waves,
  gym: Utensils,
};

export const HotelCard = ({ hotel }: HotelCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleBooking = () => {
    toast({
      title: "Booking initiated",
      description: `Booking process for ${hotel.name} will be available soon!`,
    });
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: `${hotel.name} ${isLiked ? 'removed from' : 'added to'} your favorites.`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: hotel.name,
        text: `Check out ${hotel.name} in ${hotel.city}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Hotel link copied to clipboard!",
      });
    }
  };
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/50 backdrop-blur border-border/50">
      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
        {hotel.image_urls && hotel.image_urls[0] && !imageError ? (
          <img
            src={hotel.image_urls[0]}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="text-center">
              <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <span className="text-muted-foreground text-sm">Beautiful hotel awaits</span>
            </div>
          </div>
        )}
        
        {/* Overlay buttons */}
        <div className="absolute top-2 right-2 flex gap-2">
          {hotel.star_rating && (
            <div className="bg-background/95 backdrop-blur px-2 py-1 rounded-full flex items-center space-x-1 shadow-lg">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{hotel.star_rating}</span>
            </div>
          )}
        </div>

        <div className="absolute top-2 left-2 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-full bg-background/95 backdrop-blur hover:bg-background"
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-full bg-background/95 backdrop-blur hover:bg-background"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {hotel.price_per_night && (
          <div className="absolute bottom-2 right-2 bg-primary/95 backdrop-blur text-primary-foreground px-3 py-1.5 rounded-full shadow-lg">
            <div className="text-sm font-bold">
              ₹{hotel.price_per_night.toLocaleString()}
            </div>
            <div className="text-xs opacity-90">per night</div>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
          {hotel.name}
        </CardTitle>
        <div className="flex items-start space-x-2">
          <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <div className="font-medium">{hotel.address}</div>
            <div className="flex items-center gap-1">
              <span>{hotel.city}, {hotel.state}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hotel.phone && (
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{hotel.phone}</span>
          </div>
        )}

        {hotel.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {hotel.description}
          </p>
        )}

        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Amenities</div>
            <div className="flex flex-wrap gap-2">
              {hotel.amenities.slice(0, 4).map((amenity) => {
                const IconComponent = amenityIcons[amenity.toLowerCase()];
                return (
                  <Badge key={amenity} variant="secondary" className="text-xs flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
                    {IconComponent && <IconComponent className="h-3 w-3" />}
                    {amenity}
                  </Badge>
                );
              })}
              {hotel.amenities.length > 4 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{hotel.amenities.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 bg-gradient-to-r from-background to-muted/20">
        <div className="w-full space-y-3">
          <Button 
            onClick={handleBooking} 
            className="w-full bg-gradient-to-r from-primary to-hotel-luxury hover:from-primary/90 hover:to-hotel-luxury/90 transition-all duration-300 shadow-lg hover:shadow-xl"
            size="lg"
          >
            Book Now - Best Price Guaranteed
          </Button>
          <div className="text-center">
            <span className="text-xs text-muted-foreground">
              Free cancellation • No booking fees
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};