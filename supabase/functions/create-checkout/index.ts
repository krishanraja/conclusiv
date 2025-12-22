import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate environment variables
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is not set");
  }
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
  }

  const supabaseClient = createClient(
    supabaseUrl,
    supabaseServiceKey,
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-11-20.acacia",
    });

    // Check if a Stripe customer record exists for this user
    // First, try to find by user_id in metadata (preferred, stable lookup)
    let customerId: string | undefined;
    
    try {
      const customersByUserId = await stripe.customers.search({
        query: `metadata['user_id']:'${user.id}'`,
        limit: 1,
      });
      if (customersByUserId.data.length > 0) {
        customerId = customersByUserId.data[0].id;
        logStep("Found customer by user_id", { customerId });
      }
    } catch (searchError) {
      logStep("Customer search by user_id failed, falling back to email", { error: String(searchError) });
    }
    
    // Fall back to email lookup for legacy customers
    if (!customerId) {
      const customersByEmail = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customersByEmail.data.length > 0) {
        const existingCustomer = customersByEmail.data[0];
        customerId = existingCustomer.id;
        logStep("Found existing customer by email", { customerId });
        
        // Upgrade legacy customer with user_id metadata for future lookups
        if (!existingCustomer.metadata?.user_id) {
          await stripe.customers.update(customerId, {
            metadata: { user_id: user.id },
          });
          logStep("Updated legacy customer with user_id metadata", { customerId });
        }
      }
    }

    // Get origin from request header or environment variable
    // Fallback to extracting from SUPABASE_URL if needed (for development)
    let origin: string | null = req.headers.get("origin");
    if (!origin) {
      // Try environment variable first
      origin = Deno.env.get("APP_URL") || Deno.env.get("VERCEL_URL") || null;
      if (origin && !origin.startsWith("http")) {
        origin = `https://${origin}`;
      }
      // Last resort: extract from SUPABASE_URL (development only)
      if (!origin) {
        const projectIdMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
        if (projectIdMatch && projectIdMatch[1]) {
          origin = `https://${projectIdMatch[1]}.lovableproject.com`;
        } else {
          throw new Error("Could not determine app origin. Set APP_URL or VERCEL_URL environment variable, or include Origin header in request.");
        }
      }
    }
    
    // Create subscription checkout session with 7-day trial
    // Price: $10/month USD (price_1SarxoHv8qNXfrXZv7VUgjJY)
    // allow_promotion_codes lets users enter EARLYADOPTER or 3MONTHS at checkout
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: "price_1SarxoHv8qNXfrXZv7VUgjJY",
          quantity: 1,
        },
      ],
      mode: "subscription",
      currency: "usd",
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    };
    
    // If creating a new customer, include user_id in metadata for stable lookups
    if (!customerId) {
      sessionParams.customer_creation = 'always';
      // Stripe Checkout doesn't support direct metadata on customer creation,
      // so we'll update the customer after the session is created via webhook
      // For now, include in client_reference_id for tracking
      sessionParams.client_reference_id = user.id;
    }
    
    const session = await stripe.checkout.sessions.create(sessionParams);
    
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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
