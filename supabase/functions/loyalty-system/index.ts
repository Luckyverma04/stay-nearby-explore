import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoyaltyRequest {
  action: 'get_points' | 'redeem_points' | 'calculate_tier' | 'get_history';
  points?: number;
  bookingId?: string;
  description?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const requestData: LoyaltyRequest = await req.json();
    console.log('Loyalty request:', { action: requestData.action, userId: user.id });

    switch (requestData.action) {
      case 'get_points':
        return await getLoyaltyStatus(supabase, user.id);
      case 'redeem_points':
        return await redeemPoints(supabase, user.id, requestData);
      case 'calculate_tier':
        return await calculateTier(supabase, user.id);
      case 'get_history':
        return await getPointsHistory(supabase, user.id);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in loyalty system:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

async function getLoyaltyStatus(supabase: any, userId: string): Promise<Response> {
  // Get or create loyalty summary
  let { data: summary } = await supabase
    .from('user_loyalty_summary')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!summary) {
    // Create initial loyalty summary
    const { data: newSummary, error } = await supabase
      .from('user_loyalty_summary')
      .insert({
        user_id: userId,
        total_points: 0,
        tier_level: 'bronze',
        total_bookings: 0,
        total_spent: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating loyalty summary:', error);
      return new Response(
        JSON.stringify({ error: "Failed to create loyalty profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    summary = newSummary;
  }

  // Calculate tier benefits
  const benefits = calculateTierBenefits(summary.tier_level);

  return new Response(
    JSON.stringify({
      ...summary,
      benefits,
      nextTierProgress: calculateNextTierProgress(summary)
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function redeemPoints(supabase: any, userId: string, request: LoyaltyRequest): Promise<Response> {
  const pointsToRedeem = request.points!;
  
  // Get current points
  const { data: summary } = await supabase
    .from('user_loyalty_summary')
    .select('total_points')
    .eq('user_id', userId)
    .single();

  if (!summary || summary.total_points < pointsToRedeem) {
    return new Response(
      JSON.stringify({ error: "Insufficient points" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Start transaction
  const { data: redemption, error: redemptionError } = await supabase
    .from('loyalty_points')
    .insert({
      user_id: userId,
      points: -pointsToRedeem,
      points_type: 'redeemed',
      booking_id: request.bookingId,
      description: request.description || 'Points redeemed'
    })
    .select()
    .single();

  if (redemptionError) {
    console.error('Error recording redemption:', redemptionError);
    return new Response(
      JSON.stringify({ error: "Failed to redeem points" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Update summary
  await supabase
    .from('user_loyalty_summary')
    .update({
      total_points: summary.total_points - pointsToRedeem
    })
    .eq('user_id', userId);

  return new Response(
    JSON.stringify({
      success: true,
      redemption,
      newBalance: summary.total_points - pointsToRedeem
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function calculateTier(supabase: any, userId: string): Promise<Response> {
  const { data: summary } = await supabase
    .from('user_loyalty_summary')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!summary) {
    return new Response(
      JSON.stringify({ error: "Loyalty profile not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let newTier = 'bronze';
  if (summary.total_spent >= 100000) newTier = 'platinum';
  else if (summary.total_spent >= 50000) newTier = 'gold';
  else if (summary.total_spent >= 20000) newTier = 'silver';

  if (newTier !== summary.tier_level) {
    await supabase
      .from('user_loyalty_summary')
      .update({ tier_level: newTier })
      .eq('user_id', userId);

    // Award tier upgrade bonus
    const bonusPoints = getTierUpgradeBonus(newTier);
    if (bonusPoints > 0) {
      await supabase
        .from('loyalty_points')
        .insert({
          user_id: userId,
          points: bonusPoints,
          points_type: 'bonus',
          description: `Tier upgrade bonus: ${newTier}`
        });

      await supabase
        .from('user_loyalty_summary')
        .update({
          total_points: summary.total_points + bonusPoints
        })
        .eq('user_id', userId);
    }
  }

  return new Response(
    JSON.stringify({
      previousTier: summary.tier_level,
      newTier,
      bonusPoints: newTier !== summary.tier_level ? getTierUpgradeBonus(newTier) : 0
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function getPointsHistory(supabase: any, userId: string): Promise<Response> {
  const { data: history, error } = await supabase
    .from('loyalty_points')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching points history:', error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch points history" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ history }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function calculateTierBenefits(tier: string) {
  const benefits = {
    bronze: {
      pointsMultiplier: 1,
      earlyCheckIn: false,
      lateCheckOut: false,
      roomUpgrade: false,
      concierge: false
    },
    silver: {
      pointsMultiplier: 1.25,
      earlyCheckIn: true,
      lateCheckOut: false,
      roomUpgrade: false,
      concierge: false
    },
    gold: {
      pointsMultiplier: 1.5,
      earlyCheckIn: true,
      lateCheckOut: true,
      roomUpgrade: true,
      concierge: false
    },
    platinum: {
      pointsMultiplier: 2,
      earlyCheckIn: true,
      lateCheckOut: true,
      roomUpgrade: true,
      concierge: true
    }
  };

  return benefits[tier] || benefits.bronze;
}

function calculateNextTierProgress(summary: any) {
  const thresholds = { silver: 20000, gold: 50000, platinum: 100000 };
  const currentTier = summary.tier_level;
  const spent = summary.total_spent;

  if (currentTier === 'bronze') {
    return {
      nextTier: 'silver',
      progress: Math.min(spent / thresholds.silver, 1),
      needed: Math.max(thresholds.silver - spent, 0)
    };
  } else if (currentTier === 'silver') {
    return {
      nextTier: 'gold',
      progress: Math.min(spent / thresholds.gold, 1),
      needed: Math.max(thresholds.gold - spent, 0)
    };
  } else if (currentTier === 'gold') {
    return {
      nextTier: 'platinum',
      progress: Math.min(spent / thresholds.platinum, 1),
      needed: Math.max(thresholds.platinum - spent, 0)
    };
  } else {
    return {
      nextTier: null,
      progress: 1,
      needed: 0
    };
  }
}

function getTierUpgradeBonus(tier: string): number {
  const bonuses = {
    silver: 500,
    gold: 1000,
    platinum: 2000
  };
  return bonuses[tier] || 0;
}

serve(handler);