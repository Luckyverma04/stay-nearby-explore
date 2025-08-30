import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Search, MapPin, Star, IndianRupee, Filter, X, Sliders, Wifi, Car, Utensils, Waves } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SearchFiltersProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  cities: string[];
}

export interface SearchFilters {
  searchTerm: string;
  city: string;
  minPrice: number;
  maxPrice: number;
  starRating: string;
  amenities: string[];
  sortBy: string;
  hasParking: boolean;
  hasWifi: boolean;
  hasPool: boolean;
}

const popularAmenities = [
  { name: 'WiFi', icon: Wifi },
  { name: 'Parking', icon: Car },
  { name: 'Restaurant', icon: Utensils },
  { name: 'Pool', icon: Waves },
  { name: 'Spa', icon: Waves },
  { name: 'Gym', icon: Waves },
  { name: 'Room Service', icon: Utensils },
  { name: 'Business Center', icon: Utensils },
  { name: 'Pet Friendly', icon: Utensils },
  { name: 'Beach Access', icon: Waves }
];

export default function EnhancedSearchFilters({ onSearch, loading, cities }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    city: '',
    minPrice: 0,
    maxPrice: 50000,
    starRating: '',
    amenities: [],
    sortBy: 'name',
    hasParking: false,
    hasWifi: false,
    hasPool: false,
  });

  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      sortBy: 'name',
      hasParking: false,
      hasWifi: false,
      hasPool: false,
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

  const hasActiveFilters = filters.searchTerm || filters.city || filters.starRating || 
    filters.amenities.length > 0 || priceRange[0] > 0 || priceRange[1] < 50000 ||
    filters.hasParking || filters.hasWifi || filters.hasPool;

  return (
    <Card className="w-full shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <span className="bg-gradient-to-r from-primary to-hotel-luxury bg-clip-text text-transparent">
              Find Your Perfect Stay
            </span>
          </div>
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Sliders className="h-4 w-4" />
                {showAdvanced ? 'Hide' : 'Advanced'} Filters
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Primary Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="searchTerm" className="text-sm font-medium">Search Hotels</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchTerm"
                placeholder="Hotel name, location, or landmark..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-9 bg-background/50"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">City</Label>
            <Select value={filters.city} onValueChange={(value) => setFilters({ ...filters, city: value })}>
              <SelectTrigger className="bg-background/50">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Sort By</Label>
            <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
              <SelectTrigger className="bg-background/50">
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

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSearch} disabled={loading} className="bg-gradient-to-r from-primary to-hotel-luxury">
            {loading ? 'Searching...' : 'Search Hotels'}
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleReset}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showAdvanced}>
          <CollapsibleContent className="space-y-6 pt-4 border-t">
            {/* Price Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
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
                <span className="font-medium">₹{priceRange[0].toLocaleString()}</span>
                <span className="font-medium">₹{priceRange[1].toLocaleString()}</span>
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Star className="h-4 w-4" />
                Minimum Star Rating
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={filters.starRating === rating.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilters({ ...filters, starRating: filters.starRating === rating.toString() ? '' : rating.toString() })}
                    className="flex items-center gap-1"
                  >
                    <Star className="h-3 w-3" />
                    {rating}+
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Filters</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasWifi"
                    checked={filters.hasWifi}
                    onCheckedChange={(checked) => setFilters({ ...filters, hasWifi: checked })}
                  />
                  <Label htmlFor="hasWifi" className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    Free WiFi
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasParking"
                    checked={filters.hasParking}
                    onCheckedChange={(checked) => setFilters({ ...filters, hasParking: checked })}
                  />
                  <Label htmlFor="hasParking" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Free Parking
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasPool"
                    checked={filters.hasPool}
                    onCheckedChange={(checked) => setFilters({ ...filters, hasPool: checked })}
                  />
                  <Label htmlFor="hasPool" className="flex items-center gap-2">
                    <Waves className="h-4 w-4" />
                    Swimming Pool
                  </Label>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Hotel Amenities</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {popularAmenities.map(({ name, icon: Icon }) => (
                  <Badge
                    key={name}
                    variant={filters.amenities.includes(name) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors justify-center p-2 gap-1"
                    onClick={() => toggleAmenity(name)}
                  >
                    <Icon className="h-3 w-3" />
                    {name}
                    {filters.amenities.includes(name) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="p-4 bg-gradient-to-r from-primary/5 to-hotel-luxury/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Active Filters</Label>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="h-6 px-2">
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
                  {(priceRange[0] > 0 || priceRange[1] < 50000) && (
                    <Badge variant="secondary">
                      ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                    </Badge>
                  )}
                  {filters.hasWifi && <Badge variant="secondary">WiFi</Badge>}
                  {filters.hasParking && <Badge variant="secondary">Parking</Badge>}
                  {filters.hasPool && <Badge variant="secondary">Pool</Badge>}
                  {filters.amenities.map(amenity => (
                    <Badge key={amenity} variant="secondary">{amenity}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}