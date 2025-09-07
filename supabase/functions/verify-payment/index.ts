import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPaymentRequest {
  session_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Payment verification function started");

    // Get Stripe secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // Create service role client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const { session_id }: VerifyPaymentRequest = await req.json();

    if (!session_id) {
      throw new Error("Missing session_id");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("Retrieved Stripe session:", session.id, "Status:", session.payment_status);

    // Update payment record in database
    const { data: payment, error: updateError } = await supabaseService
      .from("stripe_payments")
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
        status: session.payment_status === "paid" ? "paid" : "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_session_id", session_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating payment record:", updateError);
      throw new Error("Failed to update payment record");
    }

    // If payment is successful, update booking status
    if (session.payment_status === "paid") {
      const { error: bookingError } = await supabaseService
        .from("bookings")
        .update({
          payment_status: "paid",
          booking_status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.booking_id);

      if (bookingError) {
        console.error("Error updating booking status:", bookingError);
      }

      // Create success notification
      const { error: notificationError } = await supabaseService
        .from("notifications")
        .insert({
          user_id: payment.user_id,
          type: "payment_success",
          title: "Payment Successful",
          message: `Your payment for booking #${payment.booking_id.slice(-8)} has been processed successfully.`,
          data: {
            booking_id: payment.booking_id,
            amount: payment.amount / 100,
            currency: payment.currency,
          },
        });

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      }
    }

    return new Response(JSON.stringify({
      success: session.payment_status === "paid",
      status: session.payment_status,
      booking_id: payment.booking_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});