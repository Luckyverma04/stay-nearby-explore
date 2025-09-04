import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LocalServicesRequest {
  action: 'get_services' | 'get_weather' | 'get_attractions' | 'add_service';
  hotelId?: string;
  city?: string;
  serviceType?: string;
  lat?: number;
  lng?: number;
  service?: {
    hotelId: string;
    serviceType: string;
    serviceName: string;
    description: string;
    contactInfo: any;
    pricingInfo: any;
    distanceFromHotel: number;
    rating: number;
    isPartner: boolean;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: LocalServicesRequest = await req.json();
    console.log('Local services request:', { action: requestData.action });

    switch (requestData.action) {
      case 'get_services':
        return await getLocalServices(supabase, requestData);
      case 'get_weather':
        return await getWeatherInfo(requestData);
      case 'get_attractions':
        return await getNearbyAttractions(requestData);
      case 'add_service':
        // Verify admin access for adding services
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

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();

        if (!profile?.is_admin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return await addLocalService(supabase, requestData);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in local services:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function getLocalServices(supabase: any, request: LocalServicesRequest): Promise<Response> {
  let query = supabase
    .from('local_services')
    .select('*');

  if (request.hotelId) {
    query = query.eq('hotel_id', request.hotelId);
  }

  if (request.serviceType) {
    query = query.eq('service_type', request.serviceType);
  }

  const { data: services, error } = await query
    .order('is_partner', { ascending: false })
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching local services:', error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch local services" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ services }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function getWeatherInfo(request: LocalServicesRequest): Promise<Response> {
  try {
    // For demo purposes, returning mock weather data
    // In production, you would integrate with a weather API like OpenWeatherMap
    const weatherData = {
      city: request.city || "Unknown",
      current: {
        temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
        condition: ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain"][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 30) + 40, // 40-70%
        windSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 km/h
      },
      forecast: Array.from({ length: 5 }, (_, i) => ({
        date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        high: Math.floor(Math.random() * 10) + 25,
        low: Math.floor(Math.random() * 10) + 15,
        condition: ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain"][Math.floor(Math.random() * 4)]
      }))
    };

    return new Response(
      JSON.stringify({ weather: weatherData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error fetching weather:', error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch weather information" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function getNearbyAttractions(request: LocalServicesRequest): Promise<Response> {
  try {
    // For demo purposes, returning mock attractions data
    // In production, you would integrate with Google Places API or similar
    const attractions = [
      {
        id: "1",
        name: "City Museum",
        type: "attraction",
        description: "Explore local history and culture",
        rating: 4.5,
        distance: 2.3,
        openingHours: "9:00 AM - 6:00 PM",
        ticketPrice: "₹200",
        image: "/api/placeholder/400/300"
      },
      {
        id: "2",
        name: "Central Park",
        type: "attraction",
        description: "Beautiful park perfect for morning walks",
        rating: 4.2,
        distance: 1.8,
        openingHours: "5:00 AM - 10:00 PM",
        ticketPrice: "Free",
        image: "/api/placeholder/400/300"
      },
      {
        id: "3",
        name: "Local Market",
        type: "shopping",
        description: "Traditional market with local crafts and food",
        rating: 4.0,
        distance: 0.8,
        openingHours: "8:00 AM - 8:00 PM",
        ticketPrice: "Free Entry",
        image: "/api/placeholder/400/300"
      },
      {
        id: "4",
        name: "Heritage Restaurant",
        type: "restaurant",
        description: "Authentic local cuisine in a historic setting",
        rating: 4.7,
        distance: 1.2,
        openingHours: "11:00 AM - 11:00 PM",
        ticketPrice: "₹800-1200 per person",
        image: "/api/placeholder/400/300"
      },
      {
        id: "5",
        name: "Spa & Wellness Center",
        type: "spa",
        description: "Rejuvenating treatments and therapies",
        rating: 4.4,
        distance: 3.1,
        openingHours: "9:00 AM - 9:00 PM",
        ticketPrice: "₹2000-5000",
        image: "/api/placeholder/400/300"
      }
    ];

    return new Response(
      JSON.stringify({ attractions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error fetching attractions:', error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch nearby attractions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function addLocalService(supabase: any, request: LocalServicesRequest): Promise<Response> {
  const service = request.service!;

  const { data: newService, error } = await supabase
    .from('local_services')
    .insert({
      hotel_id: service.hotelId,
      service_type: service.serviceType,
      service_name: service.serviceName,
      description: service.description,
      contact_info: service.contactInfo,
      pricing_info: service.pricingInfo,
      distance_from_hotel: service.distanceFromHotel,
      rating: service.rating,
      is_partner: service.isPartner
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding local service:', error);
    return new Response(
      JSON.stringify({ error: "Failed to add local service" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, service: newService }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(handler);