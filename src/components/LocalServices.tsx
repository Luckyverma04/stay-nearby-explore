import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Star, 
  Phone, 
  Clock, 
  Utensils, 
  Camera, 
  Car, 
  Users, 
  Sparkles, 
  ShoppingBag,
  Sun,
  Cloud,
  Droplets,
  Wind,
  Thermometer
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LocalService {
  id: string;
  service_type: string;
  service_name: string;
  description: string;
  contact_info: any;
  pricing_info: any;
  distance_from_hotel: number;
  rating: number;
  is_partner: boolean;
}

interface WeatherData {
  city: string;
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    date: string;
    high: number;
    low: number;
    condition: string;
  }>;
}

interface Attraction {
  id: string;
  name: string;
  type: string;
  description: string;
  rating: number;
  distance: number;
  openingHours: string;
  ticketPrice: string;
  image: string;
}

interface LocalServicesProps {
  hotelId?: string;
  city?: string;
  className?: string;
}

export const LocalServices = ({ hotelId, city = "Delhi", className }: LocalServicesProps) => {
  const [services, setServices] = useState<LocalService[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');

  useEffect(() => {
    fetchLocalServices();
    fetchWeather();
    fetchAttractions();
  }, [hotelId]);

  const fetchLocalServices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('local-services', {
        body: {
          action: 'get_services',
          hotelId: hotelId
        }
      });

      if (error) throw error;
      setServices(data.services || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchWeather = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('local-services', {
        body: {
          action: 'get_weather',
          city: city
        }
      });

      if (error) throw error;
      setWeather(data.weather);
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  const fetchAttractions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('local-services', {
        body: {
          action: 'get_attractions',
          city: city
        }
      });

      if (error) throw error;
      setAttractions(data.attractions || []);
    } catch (error) {
      console.error('Error fetching attractions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return <Utensils className="h-4 w-4" />;
      case 'attraction': return <Camera className="h-4 w-4" />;
      case 'transport': return <Car className="h-4 w-4" />;
      case 'tour': return <Users className="h-4 w-4" />;
      case 'spa': return <Sparkles className="h-4 w-4" />;
      case 'shopping': return <ShoppingBag className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'restaurant': return 'bg-hotel-warmth/10 text-hotel-warmth border-hotel-warmth/20';
      case 'attraction': return 'bg-primary/10 text-primary border-primary/20';
      case 'transport': return 'bg-hotel-comfort/10 text-hotel-comfort border-hotel-comfort/20';
      case 'tour': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'spa': return 'bg-hotel-luxury/10 text-hotel-luxury border-hotel-luxury/20';
      case 'shopping': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted/10 text-muted-foreground border-border';
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return <Sun className="h-5 w-5 text-secondary" />;
      case 'partly cloudy': return <Cloud className="h-5 w-5 text-muted-foreground" />;
      case 'cloudy': return <Cloud className="h-5 w-5 text-muted-foreground" />;
      case 'light rain': return <Droplets className="h-5 w-5 text-hotel-comfort" />;
      default: return <Sun className="h-5 w-5 text-secondary" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-background to-muted/20 border-border/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Local Services & Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
            <TabsTrigger value="attractions">Attractions</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <ScrollArea className="h-80">
              {services.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No local services available</p>
                  <p className="text-sm">Check back later for updates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <Card key={service.id} className="border-border/50 bg-muted/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getServiceTypeColor(service.service_type)}>
                              {getServiceIcon(service.service_type)}
                              {service.service_type}
                            </Badge>
                            {service.is_partner && (
                              <Badge variant="secondary" className="bg-success/10 text-success">
                                Partner
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-secondary fill-current" />
                            <span className="text-sm font-medium">{service.rating}</span>
                          </div>
                        </div>

                        <h4 className="font-semibold text-foreground mb-1">{service.service_name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{service.description}</p>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{service.distance_from_hotel}km away</span>
                          </div>
                          {service.contact_info?.phone && (
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              <Phone className="h-3 w-3 mr-1" />
                              Contact
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            {weather ? (
              <>
                <Card className="bg-gradient-to-r from-primary/5 to-hotel-comfort/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{weather.city}</h3>
                        <p className="text-muted-foreground">Current Weather</p>
                      </div>
                      {getWeatherIcon(weather.current.condition)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary flex items-center gap-1">
                          <Thermometer className="h-6 w-6" />
                          {weather.current.temperature}°C
                        </div>
                        <div className="text-sm text-muted-foreground">{weather.current.condition}</div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-hotel-comfort flex items-center gap-1">
                          <Droplets className="h-5 w-5" />
                          {weather.current.humidity}%
                        </div>
                        <div className="text-sm text-muted-foreground">Humidity</div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-secondary flex items-center gap-1">
                          <Wind className="h-5 w-5" />
                          {weather.current.windSpeed}
                        </div>
                        <div className="text-sm text-muted-foreground">km/h Wind</div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold text-hotel-luxury">
                          Good
                        </div>
                        <div className="text-sm text-muted-foreground">Air Quality</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">5-Day Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {weather.forecast.map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3">
                            {getWeatherIcon(day.condition)}
                            <div>
                              <div className="font-medium">
                                {index === 0 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                              </div>
                              <div className="text-sm text-muted-foreground">{day.condition}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-foreground">{day.high}°</div>
                            <div className="text-sm text-muted-foreground">{day.low}°</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Cloud className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Weather information not available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="attractions">
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {attractions.map((attraction) => (
                  <Card key={attraction.id} className="border-border/50 bg-muted/10">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          {getServiceIcon(attraction.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground truncate">{attraction.name}</h4>
                            <div className="flex items-center gap-1 ml-2">
                              <Star className="h-4 w-4 text-secondary fill-current" />
                              <span className="text-sm font-medium">{attraction.rating}</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">{attraction.description}</p>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{attraction.distance}km</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{attraction.openingHours}</span>
                              </div>
                            </div>
                            <div className="font-medium text-primary">{attraction.ticketPrice}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};