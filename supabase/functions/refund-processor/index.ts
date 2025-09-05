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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { bookingId, refundAmount, reason, action } = await req.json()

    console.log('Processing refund:', { bookingId, refundAmount, reason, action })

    // Validate required fields
    if (!bookingId || (!refundAmount && action !== 'list') || (!reason && action === 'request')) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle different actions
    if (action === 'list') {
      // List refunds for a booking
      const { data: refunds, error: refundsError } = await supabase
        .from('refunds')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })

      if (refundsError) {
        console.error('Error fetching refunds:', refundsError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch refunds' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, refunds }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, hotels(name)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError)
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'request') {
      // Create refund request
      const refundReference = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .insert({
          booking_id: bookingId,
          user_id: booking.user_id,
          refund_amount: refundAmount,
          refund_reason: reason,
          status: 'pending',
          refund_reference: refundReference
        })
        .select()
        .single()

      if (refundError) {
        console.error('Error creating refund request:', refundError)
        return new Response(
          JSON.stringify({ error: 'Failed to create refund request' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: booking.user_id,
          type: 'refund_requested',
          title: 'Refund Request Submitted',
          message: `Refund request of ₹${refundAmount} for booking ${booking.booking_reference} has been submitted`,
          data: { 
            booking_id: bookingId, 
            refund_id: refund.id,
            refund_reference: refundReference,
            amount: refundAmount 
          }
        })

      console.log('Refund request created:', refund.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          refund: refund,
          message: 'Refund request submitted successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'approve' || action === 'reject') {
      const { refundId } = await req.json()
      
      if (!refundId) {
        return new Response(
          JSON.stringify({ error: 'Refund ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const status = action === 'approve' ? 'approved' : 'rejected'
      const processedAt = new Date().toISOString()
      
      // Simulate payment processing for approved refunds
      let refundReference = null
      if (action === 'approve') {
        refundReference = `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      const { data: updatedRefund, error: updateError } = await supabase
        .from('refunds')
        .update({
          status: status,
          processed_at: processedAt,
          refund_reference: refundReference
        })
        .eq('id', refundId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating refund:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update refund status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create notification
      const notificationMessage = action === 'approve' 
        ? `Refund of ₹${updatedRefund.refund_amount} has been approved and processed`
        : `Refund request of ₹${updatedRefund.refund_amount} has been rejected`

      await supabase
        .from('notifications')
        .insert({
          user_id: updatedRefund.user_id,
          type: action === 'approve' ? 'refund_approved' : 'refund_rejected',
          title: action === 'approve' ? 'Refund Approved' : 'Refund Rejected',
          message: notificationMessage,
          data: { 
            booking_id: bookingId, 
            refund_id: refundId,
            refund_reference: refundReference,
            amount: updatedRefund.refund_amount 
          }
        })

      console.log(`Refund ${action}d:`, updatedRefund.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          refund: updatedRefund,
          message: `Refund ${action}d successfully`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in refund-processor function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})