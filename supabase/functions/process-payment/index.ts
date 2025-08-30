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

    const { bookingId, paymentMethod, amount } = await req.json()

    console.log('Processing payment for booking:', bookingId)

    // Validate input
    if (!bookingId || !paymentMethod || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, hotels(name, address, city)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Simulate payment processing
    // In a real implementation, you would integrate with:
    // - Razorpay, Stripe, PayPal, etc.
    const paymentSuccess = Math.random() > 0.1 // 90% success rate for demo

    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const paymentStatus = paymentSuccess ? 'success' : 'failed'

    // Log payment attempt
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert({
        booking_id: bookingId,
        payment_provider: paymentMethod,
        transaction_id: transactionId,
        amount: amount,
        status: paymentStatus,
        provider_response: {
          success: paymentSuccess,
          message: paymentSuccess ? 'Payment processed successfully' : 'Payment failed - insufficient funds',
          timestamp: new Date().toISOString()
        }
      })

    if (logError) {
      console.error('Error logging payment:', logError)
    }

    if (paymentSuccess) {
      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          booking_status: 'confirmed',
          payment_method: paymentMethod,
          payment_reference: transactionId
        })
        .eq('id', bookingId)

      if (updateError) {
        console.error('Error updating booking:', updateError)
        return new Response(
          JSON.stringify({ error: 'Payment processed but booking update failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Send confirmation email
      await supabase.functions.invoke('send-email-notification', {
        body: {
          type: 'payment_confirmation',
          recipient: booking.guest_email,
          data: {
            userId: booking.user_id,
            guestName: booking.guest_name,
            hotelName: booking.hotels.name,
            bookingReference: booking.booking_reference,
            amount: amount,
            paymentMethod: paymentMethod,
            transactionId: transactionId
          }
        }
      })

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: booking.user_id,
          type: 'payment_received',
          title: 'Payment Successful',
          message: `Payment of ₹${amount} received for booking ${booking.booking_reference}`,
          data: { 
            booking_id: bookingId, 
            transaction_id: transactionId,
            amount: amount 
          }
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment processed successfully',
          transactionId: transactionId,
          bookingStatus: 'confirmed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Payment failed
      await supabase
        .from('notifications')
        .insert({
          user_id: booking.user_id,
          type: 'system',
          title: 'Payment Failed',
          message: `Payment for booking ${booking.booking_reference} failed. Please try again.`,
          data: { 
            booking_id: bookingId, 
            transaction_id: transactionId 
          }
        })

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment failed',
          transactionId: transactionId 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error in process-payment function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})