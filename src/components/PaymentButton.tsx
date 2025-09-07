import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentButtonProps {
  bookingId: string;
  amount: number;
  currency?: string;
  disabled?: boolean;
  className?: string;
}

export const PaymentButton = ({ 
  bookingId, 
  amount, 
  currency = "usd", 
  disabled = false,
  className = "" 
}: PaymentButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to make a payment",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          booking_id: bookingId,
          amount: amount,
          currency: currency,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={`flex items-center gap-2 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4" />
      )}
      {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
    </Button>
  );
};