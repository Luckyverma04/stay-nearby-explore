import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!
    supabase.auth.setAuth(authHeader?.replace('Bearer ', '') ?? '')

    const { 
      hotelId, 
      checkInDate, 
      checkOutDate, 
      guests, 
      rooms, 
      guestName, 
      guestEmail, 
      guestPhone, 
      specialRequests 
    } = await req.json()

    console.log('Creating booking for hotel:', hotelId)

    // Validate input
    if (!hotelId || !checkInDate || !checkOutDate || !guestName || !guestEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate total amount using the database function
    const { data: totalData, error: totalError } = await supabase
      .rpc('calculate_booking_total', {
        p_hotel_id: hotelId,
        p_check_in: checkInDate,
        p_check_out: checkOutDate,
        p_rooms: rooms || 1
      })

    if (totalError) {
      console.error('Error calculating total:', totalError)
      return new Response(
        JSON.stringify({ error: 'Error calculating booking total' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        hotel_id: hotelId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests: guests || 1,
        rooms: rooms || 1,
        total_amount: totalData,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        special_requests: specialRequests,
        booking_status: 'pending',
        payment_status: 'pending'
      })
      .select('*, hotels(name, address, city)')
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create notification for user
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'booking_confirmed',
        title: 'Booking Created Successfully',
        message: `Your booking for ${booking.hotels.name} has been created. Booking reference: ${booking.booking_reference}`,
        data: { booking_id: booking.id, booking_reference: booking.booking_reference }
      })

    console.log('Booking created successfully:', booking.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking: booking,
        message: 'Booking created successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-booking function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})