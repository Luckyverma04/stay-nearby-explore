import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminBookingManagement from '@/components/AdminBookingManagement';
import { HotelManagement } from '@/components/HotelManagement';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Hotel,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface AdminStats {
  totalHotels: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  activeUsers: number;
  recentActivity: any[];
}

export default function Admin() {
  const { profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalHotels: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    activeUsers: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchAdminStats();
    }
  }, [profile]);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      
      // Fetch hotels count
      const { count: hotelsCount } = await supabase
        .from('hotels')
        .select('*', { count: 'exact', head: true });

      // Fetch bookings stats
      const { data: bookings, count: bookingsCount } = await supabase
        .from('bookings')
        .select('total_amount, booking_status, payment_status', { count: 'exact' });

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const totalRevenue = bookings?.filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      const pendingBookings = bookings?.filter(b => b.booking_status === 'pending').length || 0;

      setStats({
        totalHotels: hotelsCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue,
        pendingBookings,
        activeUsers: usersCount || 0,
        recentActivity: []
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: "Error",
        description: "Failed to load admin statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin panel.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your hotel booking platform</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-primary/10 text-primary">
              Administrator
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-6 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Hotels</p>
                    <p className="text-2xl font-bold">{stats.totalHotels}</p>
                  </div>
                  <Hotel className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-hotel-luxury" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Bookings</p>
                    <p className="text-2xl font-bold">{stats.pendingBookings}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold">{stats.activeUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Admin Content */}
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>
          <TabsContent value="hotels" className="mt-6">
            <HotelManagement />
          </TabsContent>
          <TabsContent value="bookings" className="mt-6">
            <AdminBookingManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}