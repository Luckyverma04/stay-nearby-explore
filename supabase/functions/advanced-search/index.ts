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
    )

    const searchParams = await req.json()
    const userId = req.headers.get('Authorization') ? 
      (await supabase.auth.getUser()).data.user?.id : null

    // Track search analytics
    if (searchParams.hotelIds?.length > 0) {
      for (const hotelId of searchParams.hotelIds) {
        await supabase.rpc('track_booking_event', {
          p_event_type: 'search',
          p_hotel_id: hotelId,
          p_user_id: userId,
          p_session_id: searchParams.sessionId || null,
          p_metadata: {
            search_params: searchParams,
            timestamp: new Date().toISOString()
          }
        })
      }
    }

    return await searchHotels(supabase, searchParams, userId)

  } catch (error) {
    console.error('Error in advanced-search function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function searchHotels(supabase: any, params: any, userId: string | null) {
  let query = supabase
    .from('hotels')
    .select(`
      *,
      hotel_amenities!inner(amenity_name, amenity_type, is_free),
      reviews(rating, comment, created_at)
    `)
    .eq('is_active', true)

  // Location filters
  if (params.city) {
    query = query.ilike('city', `%${params.city}%`)
  }
  if (params.state) {
    query = query.ilike('state', `%${params.state}%`)
  }
  if (params.country) {
    query = query.ilike('country', `%${params.country}%`)
  }

  // Price range filter
  if (params.minPrice) {
    query = query.gte('price_per_night', params.minPrice)
  }
  if (params.maxPrice) {
    query = query.lte('price_per_night', params.maxPrice)
  }

  // Star rating filter
  if (params.minRating) {
    query = query.gte('star_rating', params.minRating)
  }

  // Amenities filter
  if (params.amenities && params.amenities.length > 0) {
    query = query.in('hotel_amenities.amenity_name', params.amenities)
  }

  // Execute the query
  const { data: hotels, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching hotels:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to search hotels' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Process hotels and check availability if dates provided
  const processedHotels = []
  
  for (const hotel of hotels) {
    let hotelData = {
      ...hotel,
      amenities_list: hotel.hotel_amenities || [],
      average_rating: 0,
      review_count: 0,
      is_available: true,
      dynamic_price: hotel.price_per_night
    }

    // Calculate average rating
    if (hotel.reviews && hotel.reviews.length > 0) {
      const totalRating = hotel.reviews.reduce((sum: number, review: any) => sum + review.rating, 0)
      hotelData.average_rating = totalRating / hotel.reviews.length
      hotelData.review_count = hotel.reviews.length
    }

    // Check availability if dates provided
    if (params.checkIn && params.checkOut) {
      const { data: isAvailable } = await supabase
        .rpc('check_hotel_availability', {
          p_hotel_id: hotel.id,
          p_check_in: params.checkIn,
          p_check_out: params.checkOut,
          p_rooms: params.rooms || 1
        })

      hotelData.is_available = isAvailable || false

      // Get dynamic pricing
      if (isAvailable) {
        const { data: dynamicPrice } = await supabase
          .rpc('calculate_dynamic_price', {
            p_hotel_id: hotel.id,
            p_check_in: params.checkIn,
            p_check_out: params.checkOut,
            p_rooms: params.rooms || 1
          })

        if (dynamicPrice) {
          hotelData.dynamic_price = dynamicPrice
        }
      }
    }

    // Filter out unavailable hotels if dates are provided
    if (!params.checkIn || !params.checkOut || hotelData.is_available) {
      processedHotels.push(hotelData)
    }
  }

  // Sort based on preferences
  let sortedHotels = processedHotels

  switch (params.sortBy) {
    case 'price_low':
      sortedHotels = processedHotels.sort((a, b) => a.dynamic_price - b.dynamic_price)
      break
    case 'price_high':
      sortedHotels = processedHotels.sort((a, b) => b.dynamic_price - a.dynamic_price)
      break
    case 'rating':
      sortedHotels = processedHotels.sort((a, b) => b.average_rating - a.average_rating)
      break
    case 'newest':
      sortedHotels = processedHotels.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      break
    default:
      // Default sorting by relevance (could be improved with more sophisticated scoring)
      sortedHotels = processedHotels.sort((a, b) => b.average_rating - a.average_rating)
  }

  // Pagination
  const page = params.page || 1
  const limit = params.limit || 20
  const offset = (page - 1) * limit
  const paginatedHotels = sortedHotels.slice(offset, offset + limit)

  // Get search suggestions for similar queries
  const suggestions = await getSearchSuggestions(supabase, params)

  return new Response(
    JSON.stringify({ 
      hotels: paginatedHotels,
      total_count: sortedHotels.length,
      page,
      limit,
      has_more: offset + limit < sortedHotels.length,
      suggestions,
      search_metadata: {
        search_time: new Date().toISOString(),
        filters_applied: Object.keys(params).filter(key => 
          params[key] !== null && params[key] !== undefined && params[key] !== ''
        )
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getSearchSuggestions(supabase: any, params: any) {
  const suggestions = []

  // Get popular cities
  const { data: popularCities } = await supabase
    .from('hotels')
    .select('city')
    .eq('is_active', true)
    .limit(5)

  if (popularCities) {
    suggestions.push({
      type: 'popular_cities',
      items: [...new Set(popularCities.map((h: any) => h.city))]
    })
  }

  // Get popular amenities
  const { data: popularAmenities } = await supabase
    .from('hotel_amenities')
    .select('amenity_name')
    .limit(10)

  if (popularAmenities) {
    const amenityCount: { [key: string]: number } = {}
    popularAmenities.forEach((a: any) => {
      amenityCount[a.amenity_name] = (amenityCount[a.amenity_name] || 0) + 1
    })

    const sortedAmenities = Object.entries(amenityCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([name]) => name)

    suggestions.push({
      type: 'popular_amenities',
      items: sortedAmenities
    })
  }

  return suggestions
}