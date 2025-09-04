-- Create messaging system tables
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('guest', 'hotel', 'admin')),
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachment_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty points system
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  points_type TEXT NOT NULL CHECK (points_type IN ('earned', 'redeemed', 'expired', 'bonus')),
  booking_id UUID,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_loyalty_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  tier_level TEXT NOT NULL DEFAULT 'bronze' CHECK (tier_level IN ('bronze', 'silver', 'gold', 'platinum')),
  total_bookings INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group bookings
CREATE TABLE public.group_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL,
  hotel_id UUID NOT NULL,
  group_name TEXT NOT NULL,
  group_size INTEGER NOT NULL CHECK (group_size >= 5),
  booking_type TEXT NOT NULL CHECK (booking_type IN ('corporate', 'wedding', 'conference', 'tour', 'other')),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  rooms_required INTEGER NOT NULL,
  special_requirements TEXT,
  estimated_budget NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'confirmed', 'cancelled', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create local services integration
CREATE TABLE public.local_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('restaurant', 'attraction', 'transport', 'tour', 'spa', 'shopping')),
  service_name TEXT NOT NULL,
  description TEXT,
  contact_info JSONB,
  pricing_info JSONB,
  distance_from_hotel NUMERIC,
  rating NUMERIC CHECK (rating >= 0 AND rating <= 5),
  is_partner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create advanced notifications
CREATE TABLE public.push_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages
CREATE POLICY "Users can view messages for their bookings" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = messages.booking_id AND b.user_id = auth.uid()
  ) OR sender_id = auth.uid()
);

CREATE POLICY "Users can send messages for their bookings" ON public.messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.id = messages.booking_id AND b.user_id = auth.uid()
  ) AND sender_id = auth.uid()
);

CREATE POLICY "Admins can manage all messages" ON public.messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- Create RLS policies for loyalty points
CREATE POLICY "Users can view their own loyalty points" ON public.loyalty_points
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert loyalty points" ON public.loyalty_points
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage loyalty points" ON public.loyalty_points
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- Create RLS policies for loyalty summary
CREATE POLICY "Users can view their own loyalty summary" ON public.user_loyalty_summary
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty summary" ON public.user_loyalty_summary
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert loyalty summary" ON public.user_loyalty_summary
FOR INSERT WITH CHECK (true);

-- Create RLS policies for group bookings
CREATE POLICY "Users can view their own group bookings" ON public.group_bookings
FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Users can create group bookings" ON public.group_bookings
FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update their own group bookings" ON public.group_bookings
FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can manage all group bookings" ON public.group_bookings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- Create RLS policies for local services
CREATE POLICY "Anyone can view local services" ON public.local_services
FOR SELECT USING (true);

CREATE POLICY "Admins can manage local services" ON public.local_services
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- Create RLS policies for push notifications
CREATE POLICY "Users can view their own notifications" ON public.push_notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.push_notifications
FOR INSERT WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_loyalty_summary_updated_at
BEFORE UPDATE ON public.user_loyalty_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_bookings_updated_at
BEFORE UPDATE ON public.group_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_local_services_updated_at
BEFORE UPDATE ON public.local_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_loyalty_points_user_id ON public.loyalty_points(user_id);
CREATE INDEX idx_user_loyalty_summary_user_id ON public.user_loyalty_summary(user_id);
CREATE INDEX idx_group_bookings_organizer_id ON public.group_bookings(organizer_id);
CREATE INDEX idx_group_bookings_hotel_id ON public.group_bookings(hotel_id);
CREATE INDEX idx_local_services_hotel_id ON public.local_services(hotel_id);
CREATE INDEX idx_push_notifications_user_id ON public.push_notifications(user_id);