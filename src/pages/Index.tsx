import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HotelCard } from '@/components/HotelCard';
import EnhancedSearchFilters, { SearchFilters } from '@/components/EnhancedSearchFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Award, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [stats, setStats] = useState({ totalHotels: 0, totalCities: 0, avgRating: 0 });

  useEffect(() => {
    fetchHotels();
    fetchCities();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('city, star_rating')
        .eq('is_active', true);

      if (data) {
        const totalHotels = data.length;
        const uniqueCities = new Set(data.map(h => h.city)).size;
        const avgRating = data.filter(h => h.star_rating).reduce((sum, h) => sum + h.star_rating, 0) / data.filter(h => h.star_rating).length;
        
        setStats({
          totalHotels,
          totalCities: uniqueCities,
          avgRating: Math.round(avgRating * 10) / 10 || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchHotels = async (filters?: SearchFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('hotels')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters) {
        if (filters.searchTerm) {
          query = query.or(`name.ilike.%${filters.searchTerm}%,city.ilike.%${filters.searchTerm}%,address.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
        }
        if (filters.city) {
          query = query.eq('city', filters.city);
        }
        if (filters.starRating) {
          query = query.gte('star_rating', parseInt(filters.starRating));
        }
        if (filters.minPrice > 0) {
          query = query.gte('price_per_night', filters.minPrice);
        }
        if (filters.maxPrice < 50000) {
          query = query.lte('price_per_night', filters.maxPrice);
        }
        if (filters.amenities.length > 0) {
          query = query.overlaps('amenities', filters.amenities);
        }
        if (filters.hasWifi) {
          query = query.overlaps('amenities', ['WiFi']);
        }
        if (filters.hasParking) {
          query = query.overlaps('amenities', ['Parking']);
        }
        if (filters.hasPool) {
          query = query.overlaps('amenities', ['Pool']);
        }

        // Apply sorting
        switch (filters.sortBy) {
          case 'price_low':
            query = query.order('price_per_night', { ascending: true, nullsFirst: false });
            break;
          case 'price_high':
            query = query.order('price_per_night', { ascending: false, nullsFirst: false });
            break;
          case 'rating':
            query = query.order('star_rating', { ascending: false, nullsFirst: false });
            break;
          case 'city':
            query = query.order('city', { ascending: true });
            break;
          default:
            query = query.order('name', { ascending: true });
        }
      } else {
        query = query.order('created_at', { ascending: false });
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

  const handleSearch = (filters: SearchFilters) => {
    fetchHotels(filters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-hotel-luxury/5 to-secondary/10 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23000%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M30 30c0 16.569-13.431 30-30 30s-30-13.431-30-30 13.431-30 30-30 30 13.431 30 30z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-hotel-luxury to-secondary bg-clip-text text-transparent">
            Discover Amazing Hotels
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Find the perfect accommodation for your stay with our curated selection of premium hotels across India. 
            Best prices guaranteed with exceptional service.
          </p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
            <Card className="bg-background/80 backdrop-blur border-border/50">
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div className="text-2xl font-bold text-primary">{stats.totalHotels}+</div>
                <div className="text-sm text-muted-foreground">Premium Hotels</div>
              </CardContent>
            </Card>
            <Card className="bg-background/80 backdrop-blur border-border/50">
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="h-8 w-8 text-hotel-luxury" />
                </div>
                <div className="text-2xl font-bold text-hotel-luxury">{stats.totalCities}+</div>
                <div className="text-sm text-muted-foreground">Cities Covered</div>
              </CardContent>
            </Card>
            <Card className="bg-background/80 backdrop-blur border-border/50">
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-8 w-8 text-secondary" />
                </div>
                <div className="text-2xl font-bold text-secondary">{stats.avgRating}★</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Search Filters */}
      <section className="py-8 -mt-8 relative z-20">
        <div className="container mx-auto px-4">
          <EnhancedSearchFilters onSearch={handleSearch} loading={loading} cities={cities} />
        </div>
      </section>

      {/* Hotels Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Available Hotels</h2>
              <p className="text-muted-foreground">
                {hotels.length} hotel{hotels.length !== 1 ? 's' : ''} found matching your criteria
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Users className="h-3 w-3 mr-1" />
                Premium Quality
              </Badge>
              <Badge variant="secondary" className="bg-hotel-luxury/10 text-hotel-luxury">
                Best Prices
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse overflow-hidden">
                  <div className="bg-muted h-48 mb-4"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : hotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="bg-gradient-to-br from-muted to-muted/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4">No hotels found</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  We couldn't find any hotels matching your criteria. Try adjusting your search filters 
                  or explore our featured hotels below.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => handleSearch({
                    searchTerm: '', city: '', minPrice: 0, maxPrice: 50000, starRating: '', 
                    amenities: [], sortBy: 'name', hasParking: false, hasWifi: false, hasPool: false
                  })}
                  className="bg-gradient-to-r from-primary/10 to-hotel-luxury/10 hover:from-primary/20 hover:to-hotel-luxury/20"
                >
                  Show All Hotels
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-r from-muted/20 to-muted/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">Why Choose Our Hotels?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-8 text-center">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
                <p className="text-muted-foreground">
                  Carefully selected hotels with exceptional standards and verified reviews.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-hotel-luxury/5 to-hotel-luxury/10">
              <CardContent className="pt-8 text-center">
                <TrendingUp className="h-12 w-12 text-hotel-luxury mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Best Price Guarantee</h3>
                <p className="text-muted-foreground">
                  We ensure you get the best deals with our price matching guarantee.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-gradient-to-br from-secondary/5 to-secondary/10">
              <CardContent className="pt-8 text-center">
                <Users className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
                <p className="text-muted-foreground">
                  Round-the-clock customer support to assist you throughout your journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
