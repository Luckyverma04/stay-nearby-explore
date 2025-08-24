import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Star, Wifi, Car, Utensils } from 'lucide-react';

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
};

export const HotelCard = ({ hotel }: HotelCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted relative">
        {hotel.image_urls && hotel.image_urls[0] ? (
          <img
            src={hotel.image_urls[0]}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
        {hotel.star_rating && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded-md flex items-center space-x-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{hotel.star_rating}</span>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{hotel.name}</CardTitle>
          {hotel.price_per_night && (
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                ₹{hotel.price_per_night.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">per night</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-start space-x-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <div>{hotel.address}</div>
            <div>{hotel.city}, {hotel.state}</div>
          </div>
        </div>

        {hotel.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{hotel.phone}</span>
          </div>
        )}

        {hotel.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{hotel.description}</p>
        )}

        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hotel.amenities.slice(0, 4).map((amenity) => {
              const IconComponent = amenityIcons[amenity.toLowerCase()];
              return (
                <Badge key={amenity} variant="secondary" className="text-xs">
                  {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                  {amenity}
                </Badge>
              );
            })}
            {hotel.amenities.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{hotel.amenities.length - 4} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};