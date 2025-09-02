-- Add advanced booking management features
CREATE TABLE public.booking_modifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  modification_type TEXT NOT NULL CHECK (modification_type IN ('date_change', 'guest_count', 'room_count', 'cancellation')),
  old_data JSONB NOT NULL,
  new_data JSONB NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- Add hotel availability tracking
CREATE TABLE public.hotel_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available_rooms INTEGER NOT NULL DEFAULT 0,
  max_rooms INTEGER NOT NULL DEFAULT 0,
  base_price NUMERIC,
  surge_multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, date)
);

-- Add booking reminders
CREATE TABLE public.booking_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('confirmation', 'pre_arrival', 'check_in', 'check_out', 'review_request')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add advanced analytics tracking
CREATE TABLE public.booking_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'search', 'booking_started', 'booking_completed', 'cancellation', 'modification')),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add user preferences
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_currency TEXT DEFAULT 'USD',
  preferred_language TEXT DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
  travel_preferences JSONB DEFAULT '{}'::jsonb,
  dietary_restrictions TEXT[],
  accessibility_needs TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add hotel amenities tracking
CREATE TABLE public.hotel_amenities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  amenity_name TEXT NOT NULL,
  amenity_type TEXT NOT NULL CHECK (amenity_type IN ('room', 'hotel', 'service', 'accessibility')),
  description TEXT,
  is_free BOOLEAN DEFAULT true,
  additional_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add booking status history
CREATE TABLE public.booking_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.booking_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_modifications
CREATE POLICY "Users can view their own booking modifications" 
ON public.booking_modifications FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.bookings 
  WHERE bookings.id = booking_modifications.booking_id 
  AND bookings.user_id = auth.uid()
));

CREATE POLICY "Users can create modifications for their bookings" 
ON public.booking_modifications FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bookings 
  WHERE bookings.id = booking_modifications.booking_id 
  AND bookings.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all booking modifications" 
ON public.booking_modifications FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- RLS Policies for hotel_availability
CREATE POLICY "Anyone can view hotel availability" 
ON public.hotel_availability FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage hotel availability" 
ON public.hotel_availability FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- RLS Policies for booking_reminders
CREATE POLICY "Users can view their booking reminders" 
ON public.booking_reminders FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.bookings 
  WHERE bookings.id = booking_reminders.booking_id 
  AND bookings.user_id = auth.uid()
));

CREATE POLICY "System can manage booking reminders" 
ON public.booking_reminders FOR ALL 
USING (true);

-- RLS Policies for booking_analytics
CREATE POLICY "Admins can view all analytics" 
ON public.booking_analytics FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

CREATE POLICY "System can insert analytics" 
ON public.booking_analytics FOR INSERT 
WITH CHECK (true);

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for hotel_amenities
CREATE POLICY "Anyone can view hotel amenities" 
ON public.hotel_amenities FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage hotel amenities" 
ON public.hotel_amenities FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- RLS Policies for booking_status_history
CREATE POLICY "Users can view their booking history" 
ON public.booking_status_history FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.bookings 
  WHERE bookings.id = booking_status_history.booking_id 
  AND bookings.user_id = auth.uid()
));

CREATE POLICY "System can insert status history" 
ON public.booking_status_history FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all booking history" 
ON public.booking_status_history FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- Add triggers for updated_at columns
CREATE TRIGGER update_hotel_availability_updated_at
  BEFORE UPDATE ON public.hotel_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_hotel_availability_hotel_date ON public.hotel_availability(hotel_id, date);
CREATE INDEX idx_booking_modifications_booking_id ON public.booking_modifications(booking_id);
CREATE INDEX idx_booking_reminders_scheduled ON public.booking_reminders(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_booking_analytics_hotel_date ON public.booking_analytics(hotel_id, created_at);
CREATE INDEX idx_hotel_amenities_hotel_type ON public.hotel_amenities(hotel_id, amenity_type);

-- Create functions for advanced booking operations
CREATE OR REPLACE FUNCTION public.check_hotel_availability(
  p_hotel_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_rooms INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  check_date DATE;
  available_rooms INTEGER;
BEGIN
  -- Check availability for each date in the range
  check_date := p_check_in;
  
  WHILE check_date < p_check_out LOOP
    -- Get available rooms for this date
    SELECT COALESCE(ha.available_rooms, 100) INTO available_rooms
    FROM public.hotels h
    LEFT JOIN public.hotel_availability ha ON ha.hotel_id = h.id AND ha.date = check_date
    WHERE h.id = p_hotel_id;
    
    -- Check if enough rooms are available
    IF available_rooms < p_rooms THEN
      RETURN FALSE;
    END IF;
    
    check_date := check_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- Function to calculate dynamic pricing
CREATE OR REPLACE FUNCTION public.calculate_dynamic_price(
  p_hotel_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_rooms INTEGER DEFAULT 1
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_price NUMERIC;
  total_price NUMERIC := 0;
  check_date DATE;
  surge_multiplier NUMERIC;
  nights INTEGER;
BEGIN
  -- Get base price from hotel
  SELECT COALESCE(price_per_night, 0) INTO base_price
  FROM public.hotels
  WHERE id = p_hotel_id;
  
  nights := p_check_out - p_check_in;
  check_date := p_check_in;
  
  -- Calculate price for each night with dynamic pricing
  WHILE check_date < p_check_out LOOP
    -- Get surge multiplier for this date
    SELECT COALESCE(ha.surge_multiplier, 1.0) INTO surge_multiplier
    FROM public.hotel_availability ha
    WHERE ha.hotel_id = p_hotel_id AND ha.date = check_date;
    
    -- Add to total price
    total_price := total_price + (base_price * surge_multiplier);
    check_date := check_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN total_price * p_rooms;
END;
$$;

-- Function to track analytics events
CREATE OR REPLACE FUNCTION public.track_booking_event(
  p_event_type TEXT,
  p_hotel_id UUID,
  p_booking_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analytics_id UUID;
BEGIN
  INSERT INTO public.booking_analytics (
    booking_id,
    hotel_id,
    event_type,
    user_id,
    session_id,
    metadata
  ) VALUES (
    p_booking_id,
    p_hotel_id,
    p_event_type,
    COALESCE(p_user_id, auth.uid()),
    p_session_id,
    p_metadata
  ) RETURNING id INTO analytics_id;
  
  RETURN analytics_id;
END;
$$;