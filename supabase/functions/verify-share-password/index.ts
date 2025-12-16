import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareId, password } = await req.json();

    // Validate inputs
    if (!shareId || typeof shareId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Share ID is required', valid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Password is required', valid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for secure DB access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is not set');
    }
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the narrative by share_id
    const { data, error } = await supabase
      .from('narratives')
      .select('id, share_password, narrative_data')
      .eq('share_id', shareId)
      .eq('is_public', true)
      .single();

    if (error || !data) {
      console.error('[verify-share-password] Narrative not found:', error);
      return new Response(
        JSON.stringify({ error: 'Narrative not found', valid: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server-side password comparison (constant-time to prevent timing attacks)
    const storedPassword = data.share_password || '';
    
    // Simple constant-time comparison for passwords
    let isValid = password.length === storedPassword.length;
    for (let i = 0; i < Math.max(password.length, storedPassword.length); i++) {
      if (password[i] !== storedPassword[i]) {
        isValid = false;
      }
    }

    if (!isValid) {
      console.log('[verify-share-password] Invalid password attempt for share:', shareId);
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Password is valid - return the narrative data
    console.log('[verify-share-password] Password verified for share:', shareId);
    return new Response(
      JSON.stringify({ 
        valid: true,
        narrative: data.narrative_data,
        narrativeId: data.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[verify-share-password] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', valid: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
