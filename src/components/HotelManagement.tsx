import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MapPin, Star, DollarSign } from 'lucide-react';

interface Hotel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  price_per_night: number;
  star_rating: number;
  is_active: boolean;
  amenities: string[];
  image_urls: string[];
}

export function HotelManagement() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    price_per_night: '',
    star_rating: '3',
    amenities: '',
    image_urls: ''
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hotels',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hotelData = {
      name: formData.name,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      price_per_night: parseFloat(formData.price_per_night),
      star_rating: parseInt(formData.star_rating),
      amenities: formData.amenities.split(',').map(a => a.trim()).filter(Boolean),
      image_urls: formData.image_urls.split(',').map(u => u.trim()).filter(Boolean),
      is_active: true
    };

    try {
      if (editingHotel) {
        const { error } = await supabase
          .from('hotels')
          .update(hotelData)
          .eq('id', editingHotel.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Hotel updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('hotels')
          .insert([hotelData]);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Hotel added successfully',
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchHotels();
    } catch (error: any) {
      console.error('Error saving hotel:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save hotel',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      description: hotel.description || '',
      address: hotel.address,
      city: hotel.city,
      state: hotel.state,
      price_per_night: hotel.price_per_night?.toString() || '',
      star_rating: hotel.star_rating?.toString() || '3',
      amenities: hotel.amenities?.join(', ') || '',
      image_urls: hotel.image_urls?.join(', ') || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hotel?')) return;

    try {
      const { error } = await supabase
        .from('hotels')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Hotel deactivated successfully',
      });
      fetchHotels();
    } catch (error) {
      console.error('Error deleting hotel:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete hotel',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingHotel(null);
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      price_per_night: '',
      star_rating: '3',
      amenities: '',
      image_urls: ''
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Hotel Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Hotel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingHotel ? 'Edit Hotel' : 'Add New Hotel'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Hotel Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price per Night *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price_per_night}
                      onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating">Star Rating *</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.star_rating}
                      onChange={(e) => setFormData({ ...formData, star_rating: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                  <Input
                    id="amenities"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    placeholder="WiFi, Pool, Gym, Spa"
                  />
                </div>

                <div>
                  <Label htmlFor="images">Image URLs (comma-separated)</Label>
                  <Textarea
                    id="images"
                    value={formData.image_urls}
                    onChange={(e) => setFormData({ ...formData, image_urls: e.target.value })}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingHotel ? 'Update Hotel' : 'Add Hotel'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hotels.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No hotels found. Add your first hotel to get started!</p>
              </div>
            ) : (
              hotels.map((hotel) => (
                <Card key={hotel.id} className={!hotel.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{hotel.name}</h3>
                          {!hotel.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                          <div className="flex items-center">
                            {[...Array(hotel.star_rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{hotel.city}, {hotel.state}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>₹{hotel.price_per_night}/night</span>
                          </div>
                        </div>

                        {hotel.amenities && hotel.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {hotel.amenities.slice(0, 5).map((amenity, idx) => (
                              <Badge key={idx} variant="outline">{amenity}</Badge>
                            ))}
                            {hotel.amenities.length > 5 && (
                              <Badge variant="outline">+{hotel.amenities.length - 5} more</Badge>
                            )}
                          </div>
                        )}
                      </div>

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
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
