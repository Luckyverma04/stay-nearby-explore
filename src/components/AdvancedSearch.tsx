import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, MapPin, Calendar, Users, Star, Filter, X } from 'lucide-react';
import { HotelCard } from './HotelCard';

interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  star_rating: number;
  price_per_night: number;
  image_urls: string[];
  amenities: string[];
  latitude: number;
  longitude: number;
}

interface SearchFilters {
  query: string;
  city: string;
  state: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  priceRange: [number, number];
  starRating: number[];
  amenities: string[];
  sortBy: string;
}

const AMENITY_OPTIONS = [
  'WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Parking',
  'Pet Friendly', 'Business Center', 'Room Service', 'Laundry',
  'Airport Shuttle', 'Beach Access', 'Conference Rooms'
];

const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'name_asc', label: 'Name: A to Z' },
];

export const AdvancedSearch = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    city: '',
    state: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1,
    priceRange: [0, 1000],
    starRating: [],
    amenities: [],
    sortBy: 'price_asc',
  });

  const searchHotels = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('hotels')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.query) {
        query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.state) {
        query = query.ilike('state', `%${filters.state}%`);
      }

      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
        query = query
          .gte('price_per_night', filters.priceRange[0])
          .lte('price_per_night', filters.priceRange[1]);
      }

      if (filters.starRating.length > 0) {
        query = query.in('star_rating', filters.starRating);
      }

      if (filters.amenities.length > 0) {
        query = query.overlaps('amenities', filters.amenities);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price_per_night', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price_per_night', { ascending: false });
          break;
        case 'rating_desc':
          query = query.order('star_rating', { ascending: false });
          break;
        case 'name_asc':
          query = query.order('name', { ascending: true });
          break;
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setHotels(data || []);
      setTotalResults(count || data?.length || 0);
    } catch (error) {
      console.error('Search error:', error);
      setHotels([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      city: '',
      state: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      rooms: 1,
      priceRange: [0, 1000],
      starRating: [],
      amenities: [],
      sortBy: 'price_asc',
    });
  };

  const handleAmenityToggle = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleStarRatingToggle = (rating: number) => {
    setFilters(prev => ({
      ...prev,
      starRating: prev.starRating.includes(rating)
        ? prev.starRating.filter(r => r !== rating)
        : [...prev.starRating, rating]
    }));
  };

  useEffect(() => {
    searchHotels();
  }, [filters]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Your Perfect Hotel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search hotels, cities, or landmarks..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="City"
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                className="w-32"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={filters.checkIn}
                onChange={(e) => setFilters(prev => ({ ...prev, checkIn: e.target.value }))}
                className="w-36"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={filters.checkOut}
                onChange={(e) => setFilters(prev => ({ ...prev, checkOut: e.target.value }))}
                className="w-36"
              />
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                min="1"
                max="20"
                value={filters.guests}
                onChange={(e) => setFilters(prev => ({ ...prev, guests: parseInt(e.target.value) || 1 }))}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">guests</span>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Advanced Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range (per night)</Label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                    max={1000}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${filters.priceRange[0]}</span>
                    <span>${filters.priceRange[1]}+</span>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="space-y-2">
                  <Label>Star Rating</Label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleStarRatingToggle(rating)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md border text-sm ${
                          filters.starRating.includes(rating)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background hover:bg-muted'
                        }`}
                      >
                        {rating}
                        <Star className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <button
                      key={amenity}
                      onClick={() => handleAmenityToggle(amenity)}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        filters.amenities.includes(amenity)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(filters.amenities.length > 0 || filters.starRating.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {filters.amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                  {amenity}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleAmenityToggle(amenity)}
                  />
                </Badge>
              ))}
              {filters.starRating.map((rating) => (
                <Badge key={rating} variant="secondary" className="flex items-center gap-1">
                  {rating} Star
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleStarRatingToggle(rating)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {loading ? 'Searching...' : `${totalResults} Hotels Found`}
        </h2>
      </div>

      {/* Hotel Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hotels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No hotels found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};