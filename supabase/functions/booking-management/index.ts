import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
        },
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')!,
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, bookingId, modificationType, newData, reason } = await req.json()

    switch (action) {
      case 'cancel':
        return await cancelBooking(supabase, user.id, bookingId, reason)
      case 'modify':
        return await modifyBooking(supabase, user.id, bookingId, modificationType, newData, reason)
      case 'get_modifications':
        return await getBookingModifications(supabase, user.id, bookingId)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error in booking-management function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function cancelBooking(supabase: any, userId: string, bookingId: string, reason: string) {
  // Get booking details first
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*, hotels(name)')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .single()

  if (bookingError || !booking) {
    return new Response(
      JSON.stringify({ error: 'Booking not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create modification request
  const { data: modification, error: modError } = await supabase
    .from('booking_modifications')
    .insert({
      booking_id: bookingId,
      modification_type: 'cancellation',
      old_data: { status: booking.booking_status },
      new_data: { status: 'cancelled' },
      reason: reason
    })
    .select()
    .single()

  if (modError) {
    return new Response(
      JSON.stringify({ error: 'Failed to create modification request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ booking_status: 'cancelled' })
    .eq('id', bookingId)

  if (updateError) {
    return new Response(
      JSON.stringify({ error: 'Failed to cancel booking' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking for ${booking.hotels.name} has been cancelled. Reference: ${booking.booking_reference}`,
      data: { booking_id: bookingId, booking_reference: booking.booking_reference }
    })

  // Track analytics
  await supabase.rpc('track_booking_event', {
    p_event_type: 'cancellation',
    p_hotel_id: booking.hotel_id,
    p_booking_id: bookingId,
    p_user_id: userId,
    p_metadata: { reason }
  })

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Booking cancelled successfully',
      modification_id: modification.id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function modifyBooking(supabase: any, userId: string, bookingId: string, modificationType: string, newData: any, reason: string) {
  // Get current booking data
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .single()

  if (bookingError || !booking) {
    return new Response(
      JSON.stringify({ error: 'Booking not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let oldData = {}
  let updateData = {}

  switch (modificationType) {
    case 'date_change':
      oldData = { 
        check_in_date: booking.check_in_date, 
        check_out_date: booking.check_out_date 
      }
      updateData = { 
        check_in_date: newData.check_in_date, 
        check_out_date: newData.check_out_date 
      }
      break
    case 'guest_count':
      oldData = { guests: booking.guests }
      updateData = { guests: newData.guests }
      break
    case 'room_count':
      oldData = { rooms: booking.rooms }
      updateData = { rooms: newData.rooms }
      break
    default:
      return new Response(
        JSON.stringify({ error: 'Invalid modification type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }

  // Create modification request
  const { data: modification, error: modError } = await supabase
    .from('booking_modifications')
    .insert({
      booking_id: bookingId,
      modification_type: modificationType,
      old_data: oldData,
      new_data: newData,
      reason: reason,
      status: 'approved' // Auto-approve for now
    })
    .select()
    .single()

  if (modError) {
    return new Response(
      JSON.stringify({ error: 'Failed to create modification request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update booking
  const { error: updateError } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)

  if (updateError) {
    return new Response(
      JSON.stringify({ error: 'Failed to modify booking' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'booking_modified',
      title: 'Booking Modified',
      message: `Your booking has been modified. Reference: ${booking.booking_reference}`,
      data: { booking_id: bookingId, modification_type: modificationType }
    })

  // Track analytics
  await supabase.rpc('track_booking_event', {
    p_event_type: 'modification',
    p_hotel_id: booking.hotel_id,
    p_booking_id: bookingId,
    p_user_id: userId,
    p_metadata: { modification_type: modificationType, reason }
  })

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Booking modified successfully',
      modification_id: modification.id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getBookingModifications(supabase: any, userId: string, bookingId: string) {
  const { data: modifications, error } = await supabase
    .from('booking_modifications')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch modifications' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ modifications }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}