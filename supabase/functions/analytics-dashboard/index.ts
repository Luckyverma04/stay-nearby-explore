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

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Generating analytics dashboard for admin:', user.id)

    // Get date range from query parameters
    const url = new URL(req.url)
    const startDate = url.searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = url.searchParams.get('end_date') || new Date().toISOString()

    // Booking statistics
    const { data: bookingStats } = await supabase
      .from('bookings')
      .select('booking_status, payment_status, total_amount, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Revenue analytics
    const totalRevenue = bookingStats
      ?.filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0

    const pendingRevenue = bookingStats
      ?.filter(b => b.payment_status === 'pending')
      .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0

    // Booking status breakdown
    const statusBreakdown = bookingStats?.reduce((acc, booking) => {
      acc[booking.booking_status] = (acc[booking.booking_status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Hotel performance
    const { data: hotelPerformance } = await supabase
      .from('bookings')
      .select('hotel_id, total_amount, hotels(name)')
      .eq('payment_status', 'paid')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const hotelRevenue = hotelPerformance?.reduce((acc, booking) => {
      const hotelName = booking.hotels?.name || 'Unknown'
      acc[hotelName] = (acc[hotelName] || 0) + Number(booking.total_amount)
      return acc
    }, {} as Record<string, number>) || {}

    // Review statistics
    const { data: reviewStats } = await supabase
      .from('reviews')
      .select('rating, status, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const averageRating = reviewStats?.length 
      ? reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length 
      : 0

    // User activity
    const { data: userActivity } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    // Daily booking trends
    const dailyBookings = bookingStats?.reduce((acc, booking) => {
      const date = new Date(booking.created_at).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const analytics = {
      summary: {
        totalBookings: bookingStats?.length || 0,
        totalRevenue: totalRevenue,
        pendingRevenue: pendingRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        newUsers: userActivity?.length || 0,
        totalReviews: reviewStats?.length || 0
      },
      bookingStatus: statusBreakdown,
      hotelPerformance: Object.entries(hotelRevenue)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      dailyTrends: Object.entries(dailyBookings)
        .map(([date, count]) => ({ date, bookings: count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      reviewDistribution: reviewStats?.reduce((acc, review) => {
        acc[review.rating] = (acc[review.rating] || 0) + 1
        return acc
      }, {} as Record<number, number>) || {},
      dateRange: {
        start: startDate,
        end: endDate
      }
    }

    return new Response(
      JSON.stringify({ success: true, analytics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analytics-dashboard function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})