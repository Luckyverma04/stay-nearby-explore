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

    const { bookingId } = await req.json()

    console.log('Generating invoice for booking:', bookingId)

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: 'Booking ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get booking details with hotel information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        hotels(name, address, city, state, country, email, phone),
        profiles(full_name, email)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError)
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate due date (30 days from now)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    // Generate invoice number
    const { data: invoiceNumData, error: invoiceNumError } = await supabase
      .rpc('generate_invoice_number')

    if (invoiceNumError) {
      console.error('Error generating invoice number:', invoiceNumError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate invoice number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const invoiceNumber = invoiceNumData

    // Prepare invoice data
    const invoiceData = {
      booking_reference: booking.booking_reference,
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      hotel: {
        name: booking.hotels.name,
        address: booking.hotels.address,
        city: booking.hotels.city,
        state: booking.hotels.state,
        country: booking.hotels.country,
        email: booking.hotels.email,
        phone: booking.hotels.phone
      },
      booking_details: {
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        guests: booking.guests,
        rooms: booking.rooms,
        special_requests: booking.special_requests
      },
      amount_breakdown: {
        subtotal: booking.total_amount,
        taxes: Number((booking.total_amount * 0.18).toFixed(2)), // 18% GST
        total: Number((booking.total_amount * 1.18).toFixed(2))
      },
      payment_info: {
        payment_status: booking.payment_status,
        payment_method: booking.payment_method,
        payment_reference: booking.payment_reference
      },
      generated_at: new Date().toISOString(),
      terms_and_conditions: [
        "Payment is due within 30 days of invoice date",
        "Cancellation policy applies as per booking terms",
        "All prices include applicable taxes",
        "For queries, contact hotel directly"
      ]
    }

    // Insert invoice record
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        invoice_number: invoiceNumber,
        amount: invoiceData.amount_breakdown.total,
        currency: 'INR',
        status: booking.payment_status === 'paid' ? 'paid' : 'generated',
        due_date: dueDate.toISOString(),
        invoice_data: invoiceData,
        paid_at: booking.payment_status === 'paid' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return new Response(
        JSON.stringify({ error: 'Failed to create invoice' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Invoice generated successfully:', invoice.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoice: invoice,
        message: `Invoice ${invoiceNumber} generated successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in invoice-generator function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})