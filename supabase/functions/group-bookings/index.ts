import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GroupBookingRequest {
  action: 'create' | 'get_quote' | 'update_status' | 'get_bookings';
  hotelId?: string;
  groupName?: string;
  groupSize?: number;
  bookingType?: 'corporate' | 'wedding' | 'conference' | 'tour' | 'other';
  checkInDate?: string;
  checkOutDate?: string;
  roomsRequired?: number;
  specialRequirements?: string;
  estimatedBudget?: number;
  bookingId?: string;
  status?: string;
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestData: GroupBookingRequest = await req.json();
    console.log('Group booking request:', { action: requestData.action, userId: user.id });

    // Check if user is admin for certain actions
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    switch (requestData.action) {
      case 'create':
        return await createGroupBooking(supabase, user.id, requestData);
      case 'get_quote':
        return await generateQuote(supabase, user.id, requestData);
      case 'update_status':
        if (!profile?.is_admin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return await updateBookingStatus(supabase, requestData);
      case 'get_bookings':
        return await getGroupBookings(supabase, user.id, profile?.is_admin);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in group bookings:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function createGroupBooking(supabase: any, userId: string, request: GroupBookingRequest): Promise<Response> {
  // Validate minimum group size
  if (request.groupSize! < 5) {
    return new Response(
      JSON.stringify({ error: "Minimum group size is 5 people" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify hotel exists
  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name, price_per_night')
    .eq('id', request.hotelId)
    .eq('is_active', true)
    .single();

  if (!hotel) {
    return new Response(
      JSON.stringify({ error: "Hotel not found or inactive" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: groupBooking, error } = await supabase
    .from('group_bookings')
    .insert({
      organizer_id: userId,
      hotel_id: request.hotelId,
      group_name: request.groupName,
      group_size: request.groupSize,
      booking_type: request.bookingType,
      check_in_date: request.checkInDate,
      check_out_date: request.checkOutDate,
      rooms_required: request.roomsRequired,
      special_requirements: request.specialRequirements,
      estimated_budget: request.estimatedBudget,
      status: 'pending'
    })
    .select('*, hotels(name, price_per_night)')
    .single();

  if (error) {
    console.error('Error creating group booking:', error);
    return new Response(
      JSON.stringify({ error: "Failed to create group booking" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create notification for admins
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'group_booking',
      title: 'New Group Booking Request',
      message: `New group booking request for ${request.groupName} at ${hotel.name}`,
      data: { group_booking_id: groupBooking.id, hotel_id: request.hotelId }
    });

  // Track analytics
  await supabase.functions.invoke('advanced-search', {
    body: {
      action: 'track_event',
      eventType: 'group_booking_created',
      hotelId: request.hotelId,
      metadata: {
        group_size: request.groupSize,
        booking_type: request.bookingType,
        rooms_required: request.roomsRequired
      }
    }
  });

  return new Response(
    JSON.stringify({ success: true, booking: groupBooking }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function generateQuote(supabase: any, userId: string, request: GroupBookingRequest): Promise<Response> {
  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name, price_per_night')
    .eq('id', request.hotelId)
    .single();

  if (!hotel) {
    return new Response(
      JSON.stringify({ error: "Hotel not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const checkIn = new Date(request.checkInDate!);
  const checkOut = new Date(request.checkOutDate!);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate base price
  const basePrice = hotel.price_per_night * request.roomsRequired! * nights;
  
  // Apply group discounts based on size and type
  let discount = 0;
  if (request.groupSize! >= 50) discount = 0.2; // 20% discount for 50+ people
  else if (request.groupSize! >= 20) discount = 0.15; // 15% discount for 20+ people
  else if (request.groupSize! >= 10) discount = 0.1; // 10% discount for 10+ people
  
  // Additional discounts for certain booking types
  if (request.bookingType === 'corporate' || request.bookingType === 'conference') {
    discount += 0.05; // Additional 5% for business bookings
  }

  const discountAmount = basePrice * discount;
  const finalPrice = basePrice - discountAmount;
  
  // Calculate additional services (estimated)
  const additionalServices = {
    meetingRoom: request.bookingType === 'corporate' || request.bookingType === 'conference' ? 5000 * nights : 0,
    cateringPerPerson: request.bookingType === 'wedding' ? 2000 : 1000,
    decorations: request.bookingType === 'wedding' ? 15000 : 0,
    transportation: request.groupSize! > 20 ? 8000 : 0
  };

  const totalAdditionalServices = Object.values(additionalServices).reduce((sum, cost) => sum + cost, 0);

  const quote = {
    hotelName: hotel.name,
    groupSize: request.groupSize,
    nights,
    roomsRequired: request.roomsRequired,
    basePrice,
    discount: Math.round(discount * 100),
    discountAmount,
    roomsTotal: finalPrice,
    additionalServices,
    totalAdditionalServices,
    grandTotal: finalPrice + totalAdditionalServices,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Valid for 7 days
  };

  return new Response(
    JSON.stringify({ quote }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function updateBookingStatus(supabase: any, request: GroupBookingRequest): Promise<Response> {
  const { data: booking, error } = await supabase
    .from('group_bookings')
    .update({
      status: request.status,
      admin_notes: request.adminNotes
    })
    .eq('id', request.bookingId)
    .select('*, hotels(name)')
    .single();

  if (error) {
    console.error('Error updating booking status:', error);
    return new Response(
      JSON.stringify({ error: "Failed to update booking status" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create notification for organizer
  await supabase
    .from('notifications')
    .insert({
      user_id: booking.organizer_id,
      type: 'group_booking_update',
      title: 'Group Booking Update',
      message: `Your group booking for ${booking.group_name} has been ${request.status}`,
      data: { group_booking_id: booking.id, new_status: request.status }
    });

  return new Response(
    JSON.stringify({ success: true, booking }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function getGroupBookings(supabase: any, userId: string, isAdmin: boolean): Promise<Response> {
  let query = supabase
    .from('group_bookings')
    .select('*, hotels(name, city, image_urls)');

  if (!isAdmin) {
    query = query.eq('organizer_id', userId);
  }

  const { data: bookings, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching group bookings:', error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch group bookings" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ bookings }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(handler);