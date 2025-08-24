import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HotelCard } from '@/components/HotelCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetchHotels();
    fetchCities();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('hotels')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
      }

      if (cityFilter) {
        query = query.eq('city', cityFilter);
      }

      if (priceFilter) {
        const [min, max] = priceFilter.split('-').map(Number);
        if (max) {
          query = query.gte('price_per_night', min).lte('price_per_night', max);
        } else {
          query = query.gte('price_per_night', min);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching hotels:', error);
        toast({
          title: "Error loading hotels",
          description: "Unable to fetch hotels. Please try again.",
          variant: "destructive",
        });
      } else {
        setHotels(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('city')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching cities:', error);
      } else {
        const uniqueCities = [...new Set(data?.map(hotel => hotel.city) || [])];
        setCities(uniqueCities.filter(Boolean));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSearch = () => {
    fetchHotels();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setPriceFilter('');
    setTimeout(() => fetchHotels(), 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Find Your Perfect Stay
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover nearby hotels with the best amenities and prices. Book your comfortable stay today.
          </p>

          {/* Search Section */}
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search hotels, cities, or locations..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-2000">₹0 - ₹2,000</SelectItem>
                  <SelectItem value="2000-5000">₹2,000 - ₹5,000</SelectItem>
                  <SelectItem value="5000-10000">₹5,000 - ₹10,000</SelectItem>
                  <SelectItem value="10000">₹10,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1 md:flex-none">
                Search Hotels
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Hotels Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Available Hotels</h2>
            <span className="text-muted-foreground">
              {hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted h-48 rounded-t-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : hotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hotels found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or check back later.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
