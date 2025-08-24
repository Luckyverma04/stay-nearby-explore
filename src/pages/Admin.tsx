import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Admin() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<any>(null);

  const [hotelForm, setHotelForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    website: '',
    star_rating: '',
    price_per_night: '',
    amenities: '',
    image_urls: '',
  });

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate('/');
      toast({
        title: "Access denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
    }
  }, [profile, authLoading, navigate]);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchHotels();
    }
  }, [profile]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const hotelData = {
        ...hotelForm,
        star_rating: hotelForm.star_rating ? parseInt(hotelForm.star_rating) : null,
        price_per_night: hotelForm.price_per_night ? parseFloat(hotelForm.price_per_night) : null,
        latitude: hotelForm.latitude ? parseFloat(hotelForm.latitude) : null,
        longitude: hotelForm.longitude ? parseFloat(hotelForm.longitude) : null,
        amenities: hotelForm.amenities ? hotelForm.amenities.split(',').map(a => a.trim()) : [],
        image_urls: hotelForm.image_urls ? hotelForm.image_urls.split(',').map(u => u.trim()) : [],
      };

      let error;

      if (editingHotel) {
        const { error: updateError } = await supabase
          .from('hotels')
          .update(hotelData)
          .eq('id', editingHotel.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('hotels')
          .insert([hotelData]);
        error = insertError;
      }

      if (error) {
        console.error('Error saving hotel:', error);
        toast({
          title: "Error saving hotel",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: editingHotel ? "Hotel updated" : "Hotel added",
          description: `Hotel ${editingHotel ? 'updated' : 'added'} successfully.`,
        });
        setDialogOpen(false);
        resetForm();
        fetchHotels();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (hotel: any) => {
    setEditingHotel(hotel);
    setHotelForm({
      name: hotel.name || '',
      description: hotel.description || '',
      address: hotel.address || '',
      city: hotel.city || '',
      state: hotel.state || '',
      country: hotel.country || 'India',
      postal_code: hotel.postal_code || '',
      latitude: hotel.latitude?.toString() || '',
      longitude: hotel.longitude?.toString() || '',
      phone: hotel.phone || '',
      email: hotel.email || '',
      website: hotel.website || '',
      star_rating: hotel.star_rating?.toString() || '',
      price_per_night: hotel.price_per_night?.toString() || '',
      amenities: hotel.amenities?.join(', ') || '',
      image_urls: hotel.image_urls?.join(', ') || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hotel?')) return;

    try {
      const { error } = await supabase
        .from('hotels')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting hotel:', error);
        toast({
          title: "Error deleting hotel",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Hotel deleted",
          description: "Hotel deleted successfully.",
        });
        fetchHotels();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setEditingHotel(null);
    setHotelForm({
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      postal_code: '',
      latitude: '',
      longitude: '',
      phone: '',
      email: '',
      website: '',
      star_rating: '',
      price_per_night: '',
      amenities: '',
      image_urls: '',
    });
  };

  if (authLoading || !profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage hotels and bookings</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hotel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Hotel Name *</Label>
                  <Input
                    id="name"
                    value={hotelForm.name}
                    onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="star_rating">Star Rating</Label>
                  <Input
                    id="star_rating"
                    type="number"
                    min="1"
                    max="5"
                    value={hotelForm.star_rating}
                    onChange={(e) => setHotelForm({ ...hotelForm, star_rating: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={hotelForm.description}
                  onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={hotelForm.address}
                  onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={hotelForm.city}
                    onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={hotelForm.state}
                    onChange={(e) => setHotelForm({ ...hotelForm, state: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={hotelForm.postal_code}
                    onChange={(e) => setHotelForm({ ...hotelForm, postal_code: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={hotelForm.latitude}
                    onChange={(e) => setHotelForm({ ...hotelForm, latitude: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={hotelForm.longitude}
                    onChange={(e) => setHotelForm({ ...hotelForm, longitude: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={hotelForm.phone}
                    onChange={(e) => setHotelForm({ ...hotelForm, phone: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price_per_night">Price per Night (₹)</Label>
                  <Input
                    id="price_per_night"
                    type="number"
                    step="0.01"
                    value={hotelForm.price_per_night}
                    onChange={(e) => setHotelForm({ ...hotelForm, price_per_night: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  value={hotelForm.amenities}
                  onChange={(e) => setHotelForm({ ...hotelForm, amenities: e.target.value })}
                  placeholder="WiFi, Parking, Restaurant, Pool"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_urls">Image URLs (comma-separated)</Label>
                <Textarea
                  id="image_urls"
                  value={hotelForm.image_urls}
                  onChange={(e) => setHotelForm({ ...hotelForm, image_urls: e.target.value })}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingHotel ? 'Update Hotel' : 'Add Hotel'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hotels Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Loading hotels...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotels.map((hotel) => (
                  <TableRow key={hotel.id}>
                    <TableCell className="font-medium">{hotel.name}</TableCell>
                    <TableCell>{hotel.city}, {hotel.state}</TableCell>
                    <TableCell>
                      {hotel.star_rating && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          {hotel.star_rating}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {hotel.price_per_night && `₹${hotel.price_per_night.toLocaleString()}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={hotel.is_active ? "default" : "secondary"}>
                        {hotel.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(hotel)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(hotel.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}