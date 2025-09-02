-- Fix security warnings by setting search_path for all functions
CREATE OR REPLACE FUNCTION public.check_hotel_availability(
  p_hotel_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_rooms INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.calculate_dynamic_price(
  p_hotel_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_rooms INTEGER DEFAULT 1
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.calculate_booking_total(p_hotel_id uuid, p_check_in date, p_check_out date, p_rooms integer DEFAULT 1)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nights INTEGER;
  price_per_night NUMERIC;
  total NUMERIC;
BEGIN
  -- Calculate number of nights
  nights := p_check_out - p_check_in;
  
  -- Get hotel price per night
  SELECT COALESCE(price_per_night, 0) INTO price_per_night
  FROM hotels 
  WHERE id = p_hotel_id;
  
  -- Calculate total
  total := nights * price_per_night * p_rooms;
  
  RETURN total;
END;
$$;