import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Users, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PaymentButton } from './PaymentButton';

interface Hotel {
  id: string;
  name: string;
  price_per_night?: number;
  address: string;
  city: string;
}

interface BookingModalProps {
  hotel: Hotel | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal = ({ hotel, isOpen, onClose }: BookingModalProps) => {
  const { user } = useAuth();
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const calculateTotal = () => {
    if (!checkInDate || !checkOutDate || !hotel || !hotel.price_per_night) return 0;
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    return nights * hotel.price_per_night * rooms;
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to make a booking.",
        variant: "destructive",
      });
      return;
    }

    if (!checkInDate || !checkOutDate || !guestName || !guestEmail) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          hotelId: hotel?.id,
          checkInDate: checkInDate.toISOString().split('T')[0],
          checkOutDate: checkOutDate.toISOString().split('T')[0],
          guests,
          rooms,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Booking created successfully!",
          description: `Your booking reference is ${data.booking.booking_reference}. Proceed to payment.`,
        });
        
        // Set booking ID and show payment
        setBookingId(data.booking.id);
        setShowPayment(true);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    toast({
      title: "Booking Complete!",
      description: "Your payment has been processed successfully.",
    });
    onClose();
    resetForm();
    setShowPayment(false);
    setBookingId(null);
  };

  const resetForm = () => {
    setCheckInDate(undefined);
    setCheckOutDate(undefined);
    setGuests(1);
    setRooms(1);
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
    setSpecialRequests('');
    setBookingId(null);
    setShowPayment(false);
  };

  if (!hotel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Book {hotel.name}</DialogTitle>
          <p className="text-muted-foreground">{hotel.address}, {hotel.city}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkin">Check-in Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !checkInDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkInDate ? format(checkInDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkInDate}
                    onSelect={setCheckInDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkout">Check-out Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !checkOutDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOutDate ? format(checkOutDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkOutDate}
                    onSelect={setCheckOutDate}
                    disabled={(date) => date <= (checkInDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Guest and Room Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guests">Guests</Label>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  max="10"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rooms">Rooms</Label>
              <Input
                id="rooms"
                type="number"
                min="1"
                max="5"
                value={rooms}
                onChange={(e) => setRooms(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Guest Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Guest Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guestName">Full Name *</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestPhone">Phone Number</Label>
              <Input
                id="guestPhone"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any special requests or preferences..."
                rows={3}
              />
            </div>
          </div>

          {/* Booking Summary */}
          {checkInDate && checkOutDate && (
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Booking Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Nights:</span>
                  <span>{Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price per night:</span>
                  <span>₹{hotel.price_per_night?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rooms:</span>
                  <span>{rooms}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-primary">₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showPayment ? (
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleBooking} 
                disabled={isLoading || !checkInDate || !checkOutDate || !guestName || !guestEmail}
                className="flex-1"
              >
                {isLoading ? 'Processing...' : `Create Booking - ₹${calculateTotal().toLocaleString()}`}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  Booking Created Successfully!
                </h3>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Complete your payment to confirm your reservation.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Pay Later
                </Button>
                {bookingId && (
                  <PaymentButton
                    bookingId={bookingId}
                    amount={calculateTotal()}
                    className="flex-1"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};