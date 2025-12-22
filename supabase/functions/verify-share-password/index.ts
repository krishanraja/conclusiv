import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Hash a password with SHA-256 and a salt (same as client-side implementation)
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Verify a password against a stored hash (constant-time comparison)
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Check if it's the new hashed format (salt:hash)
  const parts = storedHash.split(':');
  
  if (parts.length === 2 && parts[0].length === 32 && parts[1].length === 64) {
    // New hashed format
    const [salt, expectedHash] = parts;
    const computedHash = await hashPassword(password, salt);
    
    // Constant-time comparison
    if (computedHash.length !== expectedHash.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
    }
    
    return result === 0;
  } else {
    // Legacy plaintext format - do constant-time comparison
    // This handles passwords set before hashing was implemented
    let isValid = password.length === storedHash.length;
    for (let i = 0; i < Math.max(password.length, storedHash.length); i++) {
      if (password[i] !== storedHash[i]) {
        isValid = false;
      }
    }
    return isValid;
  }
}

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

    // Server-side password verification (supports both hashed and legacy plaintext)
    const storedPassword = data.share_password || '';
    
    // Verify using our secure comparison function
    const isValid = await verifyPassword(password, storedPassword);

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
