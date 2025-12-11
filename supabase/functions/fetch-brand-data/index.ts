import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    console.log('[fetch-brand-data] Fetching brand data for:', cleanDomain);

    const BRANDFETCH_BRAND_API_KEY = Deno.env.get('BRANDFETCH_BRAND_API_KEY');
    const BRANDFETCH_LOGO_API_KEY = Deno.env.get('BRANDFETCH_LOGO_API_KEY');

    if (!BRANDFETCH_BRAND_API_KEY || !BRANDFETCH_LOGO_API_KEY) {
      console.error('[fetch-brand-data] Brandfetch API keys not configured');
      return new Response(
        JSON.stringify({ error: 'Brandfetch API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch brand data from Brand API
    const brandResponse = await fetch(`https://api.brandfetch.io/v2/brands/${cleanDomain}`, {
      headers: {
        'Authorization': `Bearer ${BRANDFETCH_BRAND_API_KEY}`,
      },
    });

    let brandData: any = null;
    let colors = null;
    let fonts = null;
    let firmographics = null;
    let companyName = null;

    if (brandResponse.ok) {
      brandData = await brandResponse.json();
      console.log('[fetch-brand-data] Brand API response received');

      // Extract company name
      companyName = brandData.name || null;

      // Extract colors
      if (brandData.colors && brandData.colors.length > 0) {
        const primaryColor = brandData.colors.find((c: any) => c.type === 'accent') || brandData.colors[0];
        const secondaryColor = brandData.colors.find((c: any) => c.type === 'brand') || brandData.colors[1];
        colors = {
          primary: primaryColor?.hex || '#3B82F6',
          secondary: secondaryColor?.hex || '#1E40AF',
          accent: brandData.colors[2]?.hex || '#60A5FA',
        };
      }

      // Extract fonts
      if (brandData.fonts && brandData.fonts.length > 0) {
        fonts = {
          primary: brandData.fonts[0]?.name || 'Inter',
          secondary: brandData.fonts[1]?.name || 'Inter',
        };
      }

      // Extract firmographics from company info
      if (brandData.company) {
        firmographics = {
          employeeCount: brandData.company.employees || null,
          foundedYear: brandData.company.foundedYear || null,
          location: brandData.company.location?.city 
            ? `${brandData.company.location.city}, ${brandData.company.location.country}` 
            : null,
          companyKind: brandData.company.kind || null,
        };
      }
    } else {
      console.warn('[fetch-brand-data] Brand API error:', brandResponse.status);
    }

    // Fetch logo from Logo API
    let logo = null;
    const logoResponse = await fetch(`https://api.brandfetch.io/v2/brands/${cleanDomain}/logo`, {
      headers: {
        'Authorization': `Bearer ${BRANDFETCH_LOGO_API_KEY}`,
      },
    });

    if (logoResponse.ok) {
      const logoData = await logoResponse.json();
      console.log('[fetch-brand-data] Logo API response received');
      
      // Find the best logo format
      if (logoData.logos && logoData.logos.length > 0) {
        // Prefer primary/full logos over icons
        const primaryLogo = logoData.logos.find((l: any) => l.type === 'logo') || logoData.logos[0];
        if (primaryLogo?.formats && primaryLogo.formats.length > 0) {
          // Prefer PNG or SVG
          const format = primaryLogo.formats.find((f: any) => f.format === 'svg') 
            || primaryLogo.formats.find((f: any) => f.format === 'png')
            || primaryLogo.formats[0];
          
          logo = {
            url: format.src,
            type: primaryLogo.type,
            theme: primaryLogo.theme || 'light',
          };
        }
      }
    } else {
      console.warn('[fetch-brand-data] Logo API error:', logoResponse.status);
    }

    // Return combined brand data
    const result = {
      companyName,
      logo,
      colors,
      fonts,
      firmographics,
    };

    console.log('[fetch-brand-data] Returning brand data:', { 
      hasLogo: !!logo, 
      hasColors: !!colors, 
      hasFonts: !!fonts,
      hasFirmographics: !!firmographics 
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[fetch-brand-data] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
