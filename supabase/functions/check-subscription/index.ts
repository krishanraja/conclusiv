import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is not set");
  }
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
  }
  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  const supabaseClient = createClient(
    supabaseUrl,
    supabaseServiceKey,
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier");
      
      // Update subscriptions table
      await supabaseClient
        .from('subscriptions')
        .upsert({ 
          user_id: user.id, 
          status: 'free', 
          plan: 'free',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: 'free',
        status: 'free'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active or trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });
    
    const activeOrTrialing = subscriptions.data.find(
      (s: { status: string }) => s.status === 'active' || s.status === 'trialing'
    );
    
    let plan = 'free';
    let status = 'free';
    let subscriptionEnd = null;
    let trialEnd = null;

    if (activeOrTrialing) {
      plan = 'pro';
      status = activeOrTrialing.status;
      subscriptionEnd = new Date(activeOrTrialing.current_period_end * 1000).toISOString();
      
      if (activeOrTrialing.trial_end) {
        trialEnd = new Date(activeOrTrialing.trial_end * 1000).toISOString();
      }
      
      logStep("Active subscription found", { 
        subscriptionId: activeOrTrialing.id, 
        status,
        endDate: subscriptionEnd,
        trialEnd 
      });
    } else {
      logStep("No active subscription found");
    }

    // Update subscriptions table
    await supabaseClient
      .from('subscriptions')
      .upsert({ 
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: activeOrTrialing?.id || null,
        status,
        plan,
        trial_end: trialEnd,
        current_period_end: subscriptionEnd,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({
      subscribed: plan === 'pro',
      plan,
      status,
      subscription_end: subscriptionEnd,
      trial_end: trialEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
