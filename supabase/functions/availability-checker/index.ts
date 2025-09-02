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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { action, hotelId, checkIn, checkOut, rooms } = await req.json()

    switch (action) {
      case 'check_availability':
        return await checkAvailability(supabase, hotelId, checkIn, checkOut, rooms)
      case 'get_availability_calendar':
        return await getAvailabilityCalendar(supabase, hotelId, checkIn, checkOut)
      case 'update_availability':
        return await updateAvailability(supabase, hotelId, checkIn, checkOut, rooms)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error in availability-checker function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function checkAvailability(supabase: any, hotelId: string, checkIn: string, checkOut: string, rooms: number = 1) {
  // Use the database function to check availability
  const { data: isAvailable, error } = await supabase
    .rpc('check_hotel_availability', {
      p_hotel_id: hotelId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_rooms: rooms
    })

  if (error) {
    console.error('Error checking availability:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to check availability' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get dynamic pricing
  const { data: totalPrice, error: priceError } = await supabase
    .rpc('calculate_dynamic_price', {
      p_hotel_id: hotelId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_rooms: rooms
    })

  if (priceError) {
    console.error('Error calculating price:', priceError)
  }

  return new Response(
    JSON.stringify({ 
      available: isAvailable,
      total_price: totalPrice || null,
      hotel_id: hotelId,
      check_in: checkIn,
      check_out: checkOut,
      rooms: rooms
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAvailabilityCalendar(supabase: any, hotelId: string, startDate: string, endDate: string) {
  const { data: availability, error } = await supabase
    .from('hotel_availability')
    .select('date, available_rooms, max_rooms, base_price, surge_multiplier')
    .eq('hotel_id', hotelId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  if (error) {
    console.error('Error fetching availability calendar:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch availability calendar' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get hotel base info for fallback
  const { data: hotel, error: hotelError } = await supabase
    .from('hotels')
    .select('price_per_night')
    .eq('id', hotelId)
    .single()

  if (hotelError) {
    console.error('Error fetching hotel info:', hotelError)
  }

  // Fill in missing dates with default values
  const calendar = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dayAvailability = availability.find(a => a.date === dateStr)
    
    calendar.push({
      date: dateStr,
      available_rooms: dayAvailability?.available_rooms || 100,
      max_rooms: dayAvailability?.max_rooms || 100,
      base_price: dayAvailability?.base_price || hotel?.price_per_night || 0,
      surge_multiplier: dayAvailability?.surge_multiplier || 1.0,
      is_available: (dayAvailability?.available_rooms || 100) > 0
    })
  }

  return new Response(
    JSON.stringify({ 
      hotel_id: hotelId,
      calendar
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updateAvailability(supabase: any, hotelId: string, date: string, availableRooms: number, surgeMultiplier: number = 1.0) {
  const { data, error } = await supabase
    .from('hotel_availability')
    .upsert({
      hotel_id: hotelId,
      date: date,
      available_rooms: availableRooms,
      surge_multiplier: surgeMultiplier
    })
    .select()

  if (error) {
    console.error('Error updating availability:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update availability' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Availability updated successfully',
      data
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}