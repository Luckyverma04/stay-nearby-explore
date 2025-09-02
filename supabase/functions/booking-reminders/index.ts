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

    const { action, bookingId } = await req.json()

    switch (action) {
      case 'schedule_reminders':
        return await scheduleBookingReminders(supabase, bookingId)
      case 'send_pending_reminders':
        return await sendPendingReminders(supabase)
      case 'get_booking_reminders':
        return await getBookingReminders(supabase, bookingId)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error in booking-reminders function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function scheduleBookingReminders(supabase: any, bookingId: string) {
  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*, hotels(name)')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return new Response(
      JSON.stringify({ error: 'Booking not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const checkInDate = new Date(booking.check_in_date)
  const checkOutDate = new Date(booking.check_out_date)
  
  // Schedule different types of reminders
  const reminders = [
    {
      reminder_type: 'confirmation',
      scheduled_for: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
    },
    {
      reminder_type: 'pre_arrival',
      scheduled_for: new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000) // 1 day before check-in
    },
    {
      reminder_type: 'check_in',
      scheduled_for: new Date(checkInDate.getTime() - 4 * 60 * 60 * 1000) // 4 hours before check-in
    },
    {
      reminder_type: 'check_out',
      scheduled_for: new Date(checkOutDate.getTime() - 2 * 60 * 60 * 1000) // 2 hours before check-out
    },
    {
      reminder_type: 'review_request',
      scheduled_for: new Date(checkOutDate.getTime() + 24 * 60 * 60 * 1000) // 1 day after check-out
    }
  ]

  const reminderInserts = reminders.map(reminder => ({
    booking_id: bookingId,
    ...reminder
  }))

  const { data: scheduledReminders, error: reminderError } = await supabase
    .from('booking_reminders')
    .insert(reminderInserts)
    .select()

  if (reminderError) {
    console.error('Error scheduling reminders:', reminderError)
    return new Response(
      JSON.stringify({ error: 'Failed to schedule reminders' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log(`Scheduled ${scheduledReminders.length} reminders for booking ${bookingId}`)

  return new Response(
    JSON.stringify({ 
      success: true,
      message: `Scheduled ${scheduledReminders.length} reminders`,
      reminders: scheduledReminders
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendPendingReminders(supabase: any) {
  // Get all pending reminders that are due
  const { data: pendingReminders, error: fetchError } = await supabase
    .from('booking_reminders')
    .select(`
      *,
      bookings (
        *,
        hotels (name, address, city),
        profiles (full_name, email)
      )
    `)
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50)

  if (fetchError) {
    console.error('Error fetching pending reminders:', fetchError)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch pending reminders' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const results = []

  for (const reminder of pendingReminders) {
    try {
      // Send email notification based on reminder type
      const emailResult = await sendReminderEmail(supabase, reminder)
      
      // Update reminder status
      await supabase
        .from('booking_reminders')
        .update({ 
          status: emailResult.success ? 'sent' : 'failed',
          sent_at: new Date().toISOString()
        })
        .eq('id', reminder.id)

      // Create notification for user
      if (emailResult.success) {
        await supabase
          .from('notifications')
          .insert({
            user_id: reminder.bookings.user_id,
            type: `reminder_${reminder.reminder_type}`,
            title: getReminderTitle(reminder.reminder_type),
            message: getReminderMessage(reminder.reminder_type, reminder.bookings),
            data: { 
              booking_id: reminder.booking_id, 
              reminder_type: reminder.reminder_type 
            }
          })
      }

      results.push({
        reminder_id: reminder.id,
        type: reminder.reminder_type,
        success: emailResult.success,
        message: emailResult.message
      })

    } catch (error) {
      console.error(`Error processing reminder ${reminder.id}:`, error)
      results.push({
        reminder_id: reminder.id,
        type: reminder.reminder_type,
        success: false,
        message: error.message
      })
    }
  }

  console.log(`Processed ${results.length} reminders`)

  return new Response(
    JSON.stringify({ 
      success: true,
      processed_count: results.length,
      results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendReminderEmail(supabase: any, reminder: any) {
  const booking = reminder.bookings
  const hotel = booking.hotels
  
  try {
    // Call the send-email-notification function
    const { data, error } = await supabase.functions.invoke('send-email-notification', {
      body: {
        type: `booking_reminder_${reminder.reminder_type}`,
        recipient: booking.guest_email,
        data: {
          guest_name: booking.guest_name,
          hotel_name: hotel.name,
          booking_reference: booking.booking_reference,
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          hotel_address: `${hotel.address}, ${hotel.city}`,
          reminder_type: reminder.reminder_type
        }
      }
    })

    if (error) {
      console.error('Error sending reminder email:', error)
      return { success: false, message: error.message }
    }

    return { success: true, message: 'Reminder email sent successfully' }
  } catch (error) {
    console.error('Error in sendReminderEmail:', error)
    return { success: false, message: error.message }
  }
}

function getReminderTitle(type: string): string {
  const titles: { [key: string]: string } = {
    confirmation: 'Booking Confirmation',
    pre_arrival: 'Upcoming Stay Reminder',
    check_in: 'Check-in Reminder',
    check_out: 'Check-out Reminder',
    review_request: 'Share Your Experience'
  }
  return titles[type] || 'Booking Reminder'
}

function getReminderMessage(type: string, booking: any): string {
  const hotel = booking.hotels
  const messages: { [key: string]: string } = {
    confirmation: `Your booking for ${hotel.name} has been confirmed. Reference: ${booking.booking_reference}`,
    pre_arrival: `Your stay at ${hotel.name} is tomorrow! Reference: ${booking.booking_reference}`,
    check_in: `Check-in time is approaching for ${hotel.name}. Reference: ${booking.booking_reference}`,
    check_out: `Check-out reminder for ${hotel.name}. Reference: ${booking.booking_reference}`,
    review_request: `How was your stay at ${hotel.name}? Please share your experience.`
  }
  return messages[type] || 'You have a booking reminder'
}

async function getBookingReminders(supabase: any, bookingId: string) {
  const { data: reminders, error } = await supabase
    .from('booking_reminders')
    .select('*')
    .eq('booking_id', bookingId)
    .order('scheduled_for')

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch reminders' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ reminders }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}