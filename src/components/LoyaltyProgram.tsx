import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Crown, 
  Star, 
  Award, 
  Gift, 
  Clock, 
  TrendingUp,
  CheckCircle,
  Coins,
  Calendar
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LoyaltyStatus {
  total_points: number;
  tier_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_bookings: number;
  total_spent: number;
  benefits: {
    pointsMultiplier: number;
    earlyCheckIn: boolean;
    lateCheckOut: boolean;
    roomUpgrade: boolean;
    concierge: boolean;
  };
  nextTierProgress: {
    nextTier: string | null;
    progress: number;
    needed: number;
  };
}

interface PointsHistory {
  id: string;
  points: number;
  points_type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  description: string;
  created_at: string;
}

export const LoyaltyProgram = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoyaltyStatus();
      fetchPointsHistory();
    }
  }, [user]);

  const fetchLoyaltyStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('loyalty-system', {
        body: { action: 'get_points' }
      });

      if (error) throw error;
      setLoyaltyStatus(data);
    } catch (error) {
      console.error('Error fetching loyalty status:', error);
      toast({
        title: "Error",
        description: "Failed to load loyalty information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsHistory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('loyalty-system', {
        body: { action: 'get_history' }
      });

      if (error) throw error;
      setPointsHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching points history:', error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-hotel-warmth bg-hotel-warmth/10 border-hotel-warmth/20';
      case 'silver': return 'text-muted-foreground bg-muted/20 border-border';
      case 'gold': return 'text-secondary bg-secondary/10 border-secondary/20';
      case 'platinum': return 'text-hotel-luxury bg-hotel-luxury/10 border-hotel-luxury/20';
      default: return 'text-muted-foreground bg-muted/20 border-border';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Award className="h-4 w-4" />;
      case 'silver': return <Star className="h-4 w-4" />;
      case 'gold': return <Crown className="h-4 w-4" />;
      case 'platinum': return <Gift className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getPointsTypeIcon = (type: string) => {
    switch (type) {
      case 'earned': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'redeemed': return <Gift className="h-4 w-4 text-primary" />;
      case 'bonus': return <Star className="h-4 w-4 text-secondary" />;
      case 'expired': return <Clock className="h-4 w-4 text-destructive" />;
      default: return <Coins className="h-4 w-4 text-muted-foreground" />;
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

  if (!loyaltyStatus) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Unable to load loyalty information</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-background to-muted/20 border-border/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Loyalty Program
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6">
            {/* Current Status */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Badge className={`px-4 py-2 text-lg font-semibold ${getTierColor(loyaltyStatus.tier_level)}`}>
                  {getTierIcon(loyaltyStatus.tier_level)}
                  {loyaltyStatus.tier_level.toUpperCase()} MEMBER
                </Badge>
              </div>
              
              <div className="text-3xl font-bold text-primary">
                {loyaltyStatus.total_points.toLocaleString()} Points
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-success">{loyaltyStatus.total_bookings}</div>
                  <div className="text-sm text-muted-foreground">Total Bookings</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-hotel-luxury">
                    {formatCurrency(loyaltyStatus.total_spent)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </div>
              </div>
            </div>

            {/* Next Tier Progress */}
            {loyaltyStatus.nextTierProgress.nextTier && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Progress to {loyaltyStatus.nextTierProgress.nextTier}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(loyaltyStatus.nextTierProgress.progress * 100)}%
                  </span>
                </div>
                <Progress 
                  value={loyaltyStatus.nextTierProgress.progress * 100} 
                  className="h-3"
                />
                <div className="text-xs text-muted-foreground text-center">
                  Spend {formatCurrency(loyaltyStatus.nextTierProgress.needed)} more to reach{' '}
                  {loyaltyStatus.nextTierProgress.nextTier} tier
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="benefits" className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="font-medium">Points Multiplier</span>
                </div>
                <Badge variant="secondary">
                  {loyaltyStatus.benefits.pointsMultiplier}x
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-hotel-comfort" />
                  <span className="font-medium">Early Check-in</span>
                </div>
                {loyaltyStatus.benefits.earlyCheckIn ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <span className="text-sm text-muted-foreground">Not available</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-hotel-comfort" />
                  <span className="font-medium">Late Check-out</span>
                </div>
                {loyaltyStatus.benefits.lateCheckOut ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <span className="text-sm text-muted-foreground">Not available</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-secondary" />
                  <span className="font-medium">Room Upgrade</span>
                </div>
                {loyaltyStatus.benefits.roomUpgrade ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <span className="text-sm text-muted-foreground">Not available</span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-hotel-luxury" />
                  <span className="font-medium">Concierge Service</span>
                </div>
                {loyaltyStatus.benefits.concierge ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <span className="text-sm text-muted-foreground">Not available</span>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <ScrollArea className="h-64">
              {pointsHistory.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No points history yet</p>
                  <p className="text-sm">Make a booking to start earning points</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pointsHistory.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10">
                      <div className="flex items-center gap-3">
                        {getPointsTypeIcon(entry.points_type)}
                        <div>
                          <div className="font-medium text-sm">{entry.description}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(entry.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        entry.points > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {entry.points > 0 ? '+' : ''}{entry.points}
                      </div>
                    </div>
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