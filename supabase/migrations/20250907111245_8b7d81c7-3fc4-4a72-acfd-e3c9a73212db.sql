-- Create Stripe payments table for booking payments
CREATE TABLE IF NOT EXISTS public.stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for stripe_payments
CREATE POLICY "Users can view their own payments" ON public.stripe_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert payments" ON public.stripe_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payments" ON public.stripe_payments
  FOR UPDATE USING (true);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.hotel_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  room_type TEXT,
  stay_date DATE,
  would_recommend BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for reviews
ALTER TABLE public.hotel_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Anyone can view approved reviews" ON public.hotel_reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create reviews for their bookings" ON public.hotel_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    (booking_id IS NULL OR EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = hotel_reviews.booking_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update their own reviews" ON public.hotel_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.hotel_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- Add realtime for bookings
ALTER publication supabase_realtime ADD TABLE public.bookings;
ALTER publication supabase_realtime ADD TABLE public.hotel_reviews;
ALTER publication supabase_realtime ADD TABLE public.notifications;