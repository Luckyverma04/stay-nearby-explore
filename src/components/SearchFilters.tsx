import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Search, MapPin, Star, IndianRupee, Filter, X } from 'lucide-react';

interface SearchFiltersProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
}

export interface SearchFilters {
  searchTerm: string;
  city: string;
  minPrice: number;
  maxPrice: number;
  starRating: string;
  amenities: string[];
  sortBy: string;
}

const popularCities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Pune', 'Hyderabad',
  'Ahmedabad', 'Jaipur', 'Goa', 'Kochi', 'Chandigarh'
];

const popularAmenities = [
  'WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Parking', 
  'Room Service', 'Business Center', 'Pet Friendly', 'Beach Access'
];

export default function SearchFilters({ onSearch, loading }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    city: '',
    minPrice: 0,
    maxPrice: 50000,
    starRating: '',
    amenities: [],
    sortBy: 'name'
  });

  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch({
      ...filters,
      minPrice: priceRange[0],
      maxPrice: priceRange[1]
    });
  };

  const handleReset = () => {
    const resetFilters = {
      searchTerm: '',
      city: '',
      minPrice: 0,
      maxPrice: 50000,
      starRating: '',
      amenities: [],
      sortBy: 'name'
    };
    setFilters(resetFilters);
    setPriceRange([0, 50000]);
    onSearch(resetFilters);
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    setFilters({ ...filters, amenities: newAmenities });
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Your Perfect Stay
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="searchTerm">Hotel Name</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchTerm"
                placeholder="Search hotels..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Select value={filters.city} onValueChange={(value) => setFilters({ ...filters, city: value })}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cities</SelectItem>
                {popularCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="flex-1">
              {loading ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="space-y-6 pt-4 border-t">
            {/* Price Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Price Range per Night
              </Label>
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={50000}
                  min={0}
                  step={500}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>₹{priceRange[0].toLocaleString()}</span>
                <span>₹{priceRange[1].toLocaleString()}</span>
              </div>
            </div>

            {/* Star Rating & Sort */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Minimum Star Rating
                </Label>
                <Select value={filters.starRating} onValueChange={(value) => setFilters({ ...filters, starRating: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Rating</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="2">2+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Hotel Name</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Star Rating</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <Label>Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {popularAmenities.map(amenity => (
                  <Badge
                    key={amenity}
                    variant={filters.amenities.includes(amenity) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {amenity}
                    {filters.amenities.includes(amenity) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Active Filters Summary */}
            {(filters.amenities.length > 0 || filters.city || filters.starRating || filters.searchTerm) && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Active Filters:</Label>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.searchTerm && (
                    <Badge variant="secondary">Search: {filters.searchTerm}</Badge>
                  )}
                  {filters.city && (
                    <Badge variant="secondary">City: {filters.city}</Badge>
                  )}
                  {filters.starRating && (
                    <Badge variant="secondary">{filters.starRating}+ Stars</Badge>
                  )}
                  {filters.amenities.map(amenity => (
                    <Badge key={amenity} variant="secondary">{amenity}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}