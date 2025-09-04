import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessageRequest {
  action: 'send_message' | 'get_messages' | 'mark_read';
  bookingId?: string;
  message?: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  attachmentUrl?: string;
  messageId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestData: MessageRequest = await req.json();
    console.log('Messaging request:', { action: requestData.action, userId: user.id });

    switch (requestData.action) {
      case 'send_message':
        return await sendMessage(supabase, user.id, requestData);
      case 'get_messages':
        return await getMessages(supabase, user.id, requestData.bookingId!);
      case 'mark_read':
        return await markMessageRead(supabase, user.id, requestData.messageId!);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in messaging function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function sendMessage(supabase: any, userId: string, request: MessageRequest): Promise<Response> {
  // Verify booking ownership
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, user_id')
    .eq('id', request.bookingId)
    .eq('user_id', userId)
    .single();

  if (!booking) {
    return new Response(
      JSON.stringify({ error: "Booking not found or unauthorized" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Insert message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      booking_id: request.bookingId,
      sender_id: userId,
      sender_type: 'guest',
      message: request.message,
      message_type: request.messageType || 'text',
      attachment_url: request.attachmentUrl
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return new Response(
      JSON.stringify({ error: "Failed to send message" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create notification for admin
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'message',
      title: 'New Message',
      message: `You have a new message regarding booking ${booking.id}`,
      data: { booking_id: request.bookingId, message_id: message.id }
    });

  return new Response(
    JSON.stringify({ success: true, message }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function getMessages(supabase: any, userId: string, bookingId: string): Promise<Response> {
  // Verify booking ownership
  const { data: booking } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .single();

  if (!booking) {
    return new Response(
      JSON.stringify({ error: "Booking not found or unauthorized" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch messages" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ messages }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function markMessageRead(supabase: any, userId: string, messageId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error marking message as read:', error);
    return new Response(
      JSON.stringify({ error: "Failed to mark message as read" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: data }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(handler);