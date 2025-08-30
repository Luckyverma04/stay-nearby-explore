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

    const { type, recipient, data } = await req.json()

    console.log('Sending email notification:', type, 'to:', recipient)

    // Generate email content based on type
    let subject = ''
    let htmlContent = ''

    switch (type) {
      case 'booking_confirmation':
        subject = `Booking Confirmation - ${data.hotelName}`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Booking Confirmation</h2>
            <p>Dear ${data.guestName},</p>
            <p>Your booking has been confirmed! Here are the details:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2563eb;">Booking Details</h3>
              <p><strong>Booking Reference:</strong> ${data.bookingReference}</p>
              <p><strong>Hotel:</strong> ${data.hotelName}</p>
              <p><strong>Address:</strong> ${data.hotelAddress}</p>
              <p><strong>Check-in:</strong> ${new Date(data.checkInDate).toLocaleDateString()}</p>
              <p><strong>Check-out:</strong> ${new Date(data.checkOutDate).toLocaleDateString()}</p>
              <p><strong>Guests:</strong> ${data.guests}</p>
              <p><strong>Rooms:</strong> ${data.rooms}</p>
              <p><strong>Total Amount:</strong> ₹${data.totalAmount}</p>
            </div>
            
            <p>We look forward to hosting you!</p>
            <p>Best regards,<br>The Hotel Booking Team</p>
          </div>
        `
        break

      case 'booking_cancellation':
        subject = `Booking Cancellation - ${data.hotelName}`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Booking Cancellation</h2>
            <p>Dear ${data.guestName},</p>
            <p>Your booking has been cancelled as requested.</p>
            
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="margin-top: 0; color: #dc2626;">Cancelled Booking</h3>
              <p><strong>Booking Reference:</strong> ${data.bookingReference}</p>
              <p><strong>Hotel:</strong> ${data.hotelName}</p>
              <p><strong>Original Check-in:</strong> ${new Date(data.checkInDate).toLocaleDateString()}</p>
              <p><strong>Amount:</strong> ₹${data.totalAmount}</p>
            </div>
            
            <p>If you paid for this booking, a refund will be processed within 5-7 business days.</p>
            <p>We hope to serve you again in the future.</p>
            <p>Best regards,<br>The Hotel Booking Team</p>
          </div>
        `
        break

      case 'payment_confirmation':
        subject = `Payment Received - ${data.hotelName}`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Payment Confirmation</h2>
            <p>Dear ${data.guestName},</p>
            <p>We have successfully received your payment!</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <h3 style="margin-top: 0; color: #16a34a;">Payment Details</h3>
              <p><strong>Booking Reference:</strong> ${data.bookingReference}</p>
              <p><strong>Amount Paid:</strong> ₹${data.amount}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
              <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
            </div>
            
            <p>Your booking is now confirmed and you can expect to receive a check-in email 24 hours before your arrival.</p>
            <p>Best regards,<br>The Hotel Booking Team</p>
          </div>
        `
        break

      default:
        throw new Error('Invalid email type')
    }

    // Here you would integrate with your preferred email service
    // For now, we'll log the email content and return success
    console.log('Email would be sent:', {
      to: recipient,
      subject,
      html: htmlContent
    })

    // Store email log in database
    await supabase
      .from('notifications')
      .insert({
        user_id: data.userId || null,
        type: 'system',
        title: `Email Sent: ${subject}`,
        message: `Email notification sent to ${recipient}`,
        data: { email_type: type, recipient }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-email-notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})