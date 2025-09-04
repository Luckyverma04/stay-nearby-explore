import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Building,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GroupBooking {
  id: string;
  group_name: string;
  group_size: number;
  booking_type: string;
  check_in_date: string;
  check_out_date: string;
  rooms_required: number;
  special_requirements: string;
  estimated_budget: number;
  status: 'pending' | 'quoted' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  hotels: {
    name: string;
    city: string;
  };
}

interface GroupBookingForm {
  hotelId: string;
  groupName: string;
  groupSize: number;
  bookingType: string;
  checkInDate: string;
  checkOutDate: string;
  roomsRequired: number;
  specialRequirements: string;
  estimatedBudget: number;
}

export const GroupBooking = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('new');
  const [hotels, setHotels] = useState<any[]>([]);
  const [groupBookings, setGroupBookings] = useState<GroupBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState<GroupBookingForm>({
    hotelId: '',
    groupName: '',
    groupSize: 5,
    bookingType: '',
    checkInDate: '',
    checkOutDate: '',
    roomsRequired: 1,
    specialRequirements: '',
    estimatedBudget: 0
  });

  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    fetchHotels();
    fetchGroupBookings();
  }, []);

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('id, name, city, price_per_night')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const fetchGroupBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('group-bookings', {
        body: { action: 'get_bookings' }
      });

      if (error) throw error;
      setGroupBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching group bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load group bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getQuote = async () => {
    if (!form.hotelId || !form.checkInDate || !form.checkOutDate || !form.roomsRequired) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to get a quote",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('group-bookings', {
        body: {
          action: 'get_quote',
          hotelId: form.hotelId,
          groupSize: form.groupSize,
          bookingType: form.bookingType,
          checkInDate: form.checkInDate,
          checkOutDate: form.checkOutDate,
          roomsRequired: form.roomsRequired
        }
      });

      if (error) throw error;
      setQuote(data.quote);
    } catch (error) {
      console.error('Error getting quote:', error);
      toast({
        title: "Error",
        description: "Failed to generate quote",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitGroupBooking = async () => {
    if (!form.hotelId || !form.groupName || !form.checkInDate || !form.checkOutDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('group-bookings', {
        body: {
          action: 'create',
          ...form
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Group booking request submitted successfully",
      });
      
      // Reset form
      setForm({
        hotelId: '',
        groupName: '',
        groupSize: 5,
        bookingType: '',
        checkInDate: '',
        checkOutDate: '',
        roomsRequired: 1,
        specialRequirements: '',
        estimatedBudget: 0
      });
      setQuote(null);
      
      // Refresh bookings
      fetchGroupBookings();
      setActiveTab('bookings');
    } catch (error) {
      console.error('Error submitting group booking:', error);
      toast({
        title: "Error",
        description: "Failed to submit group booking",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'quoted': return 'bg-info/10 text-info border-info/20';
      case 'confirmed': return 'bg-success/10 text-success border-success/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'completed': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted/10 text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'quoted': return <DollarSign className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Card className={`bg-gradient-to-br from-background to-muted/20 border-border/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Group Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">New Booking</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotel">Hotel *</Label>
                <Select value={form.hotelId} onValueChange={(value) => setForm({...form, hotelId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {hotel.name} - {hotel.city}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  value={form.groupName}
                  onChange={(e) => setForm({...form, groupName: e.target.value})}
                  placeholder="e.g., Company Retreat 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupSize">Group Size *</Label>
                <Input
                  id="groupSize"
                  type="number"
                  min="5"
                  value={form.groupSize}
                  onChange={(e) => setForm({...form, groupSize: parseInt(e.target.value) || 5})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingType">Booking Type *</Label>
                <Select value={form.bookingType} onValueChange={(value) => setForm({...form, bookingType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="tour">Tour</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkInDate">Check-in Date *</Label>
                <Input
                  id="checkInDate"
                  type="date"
                  value={form.checkInDate}
                  onChange={(e) => setForm({...form, checkInDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOutDate">Check-out Date *</Label>
                <Input
                  id="checkOutDate"
                  type="date"
                  value={form.checkOutDate}
                  onChange={(e) => setForm({...form, checkOutDate: e.target.value})}
                  min={form.checkInDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomsRequired">Rooms Required *</Label>
                <Input
                  id="roomsRequired"
                  type="number"
                  min="1"
                  value={form.roomsRequired}
                  onChange={(e) => setForm({...form, roomsRequired: parseInt(e.target.value) || 1})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedBudget">Estimated Budget</Label>
                <Input
                  id="estimatedBudget"
                  type="number"
                  value={form.estimatedBudget || ''}
                  onChange={(e) => setForm({...form, estimatedBudget: parseInt(e.target.value) || 0})}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequirements">Special Requirements</Label>
              <Textarea
                id="specialRequirements"
                value={form.specialRequirements}
                onChange={(e) => setForm({...form, specialRequirements: e.target.value})}
                placeholder="Any special requirements or requests..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={getQuote} 
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Loading...' : 'Get Quote'}
              </Button>
              <Button 
                onClick={submitGroupBooking} 
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>

            {quote && (
              <Card className="bg-gradient-to-r from-primary/5 to-hotel-luxury/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Quote Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Hotel</div>
                      <div className="font-medium">{quote.hotelName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="font-medium">{quote.nights} nights</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Group Size</div>
                      <div className="font-medium">{quote.groupSize} people</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Rooms</div>
                      <div className="font-medium">{quote.roomsRequired} rooms</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border/50">
                    <div className="flex justify-between">
                      <span>Base Price</span>
                      <span>{formatCurrency(quote.basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-success">
                      <span>Group Discount ({quote.discount}%)</span>
                      <span>-{formatCurrency(quote.discountAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rooms Total</span>
                      <span>{formatCurrency(quote.roomsTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Services</span>
                      <span>{formatCurrency(quote.totalAdditionalServices)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border/50">
                      <span>Grand Total</span>
                      <span>{formatCurrency(quote.grandTotal)}</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Quote valid until: {new Date(quote.validUntil).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            <ScrollArea className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : groupBookings.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No group bookings yet</p>
                  <p className="text-sm">Submit your first group booking request</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupBookings.map((booking) => (
                    <Card key={booking.id} className="border-border/50 bg-muted/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{booking.group_name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {booking.hotels.name}, {booking.hotels.city}
                            </p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.group_size} people</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.rooms_required} rooms</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(booking.check_in_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(booking.check_out_date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {booking.special_requirements && (
                          <div className="mt-3 text-sm">
                            <span className="text-muted-foreground">Special Requirements: </span>
                            <span>{booking.special_requirements}</span>
                          </div>
                        )}

                        <div className="mt-3 text-xs text-muted-foreground">
                          Submitted: {new Date(booking.created_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};