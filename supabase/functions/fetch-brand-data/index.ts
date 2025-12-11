import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogoFormat {
  src: string;
  format: string;
  size?: number;
}

interface LogoItem {
  type: string;
  theme: string;
  formats: LogoFormat[];
}

interface LogoVariant {
  url: string;
  type: 'logo' | 'icon' | 'symbol';
  theme: 'light' | 'dark';
  format: 'svg' | 'png' | 'jpeg';
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[fetch-brand-data][${requestId}] Request received`);

  if (req.method === 'OPTIONS') {
    console.log(`[fetch-brand-data][${requestId}] Handling OPTIONS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    
    if (!domain) {
      console.error(`[fetch-brand-data][${requestId}] Missing domain parameter`);
      return new Response(
        JSON.stringify({ error: 'Domain required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    console.log(`[fetch-brand-data][${requestId}] Fetching brand data for: ${cleanDomain}`);

    const BRANDFETCH_BRAND_API_KEY = Deno.env.get('BRANDFETCH_BRAND_API_KEY');

    if (!BRANDFETCH_BRAND_API_KEY) {
      console.error(`[fetch-brand-data][${requestId}] BRANDFETCH_BRAND_API_KEY not configured`);
      return new Response(
        JSON.stringify({ error: 'Brandfetch API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch brand data from Brand API (includes logos!)
    console.log(`[fetch-brand-data][${requestId}] Calling Brandfetch Brand API...`);
    const brandResponse = await fetch(`https://api.brandfetch.io/v2/brands/${cleanDomain}`, {
      headers: {
        'Authorization': `Bearer ${BRANDFETCH_BRAND_API_KEY}`,
      },
    });

    console.log(`[fetch-brand-data][${requestId}] Brand API response status: ${brandResponse.status}`);

    if (!brandResponse.ok) {
      const errorText = await brandResponse.text();
      console.error(`[fetch-brand-data][${requestId}] Brand API error: ${brandResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Brand API error: ${brandResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const brandData = await brandResponse.json();
    console.log(`[fetch-brand-data][${requestId}] Brand API response received`, {
      hasName: !!brandData.name,
      hasLogos: !!(brandData.logos && brandData.logos.length > 0),
      logoCount: brandData.logos?.length || 0,
      hasColors: !!(brandData.colors && brandData.colors.length > 0),
      hasFonts: !!(brandData.fonts && brandData.fonts.length > 0),
      hasCompany: !!brandData.company,
    });

    // Extract company name
    const companyName = brandData.name || null;

    // Extract colors
    let colors = null;
    if (brandData.colors && brandData.colors.length > 0) {
      const primaryColor = brandData.colors.find((c: any) => c.type === 'accent') || brandData.colors[0];
      const secondaryColor = brandData.colors.find((c: any) => c.type === 'brand') || brandData.colors[1];
      colors = {
        primary: primaryColor?.hex || '#3B82F6',
        secondary: secondaryColor?.hex || '#1E40AF',
        accent: brandData.colors[2]?.hex || '#60A5FA',
      };
      console.log(`[fetch-brand-data][${requestId}] Colors extracted:`, colors);
    }

    // Extract fonts
    let fonts = null;
    if (brandData.fonts && brandData.fonts.length > 0) {
      fonts = {
        primary: brandData.fonts[0]?.name || 'Inter',
        secondary: brandData.fonts[1]?.name || 'Inter',
      };
      console.log(`[fetch-brand-data][${requestId}] Fonts extracted:`, fonts);
    }

    // Extract firmographics from company info
    let firmographics = null;
    if (brandData.company) {
      firmographics = {
        employeeCount: brandData.company.employees || null,
        foundedYear: brandData.company.foundedYear || null,
        location: brandData.company.location?.city 
          ? `${brandData.company.location.city}, ${brandData.company.location.country}` 
          : null,
        companyKind: brandData.company.kind || null,
      };
      console.log(`[fetch-brand-data][${requestId}] Firmographics extracted:`, firmographics);
    }

    // Extract ALL logo variants from Brand API
    const logoVariants: LogoVariant[] = [];
    let primaryLogo: LogoVariant | null = null;

    if (brandData.logos && brandData.logos.length > 0) {
      console.log(`[fetch-brand-data][${requestId}] Processing ${brandData.logos.length} logos...`);

      for (const logoItem of brandData.logos as LogoItem[]) {
        const logoType = logoItem.type as 'logo' | 'icon' | 'symbol';
        const logoTheme = (logoItem.theme || 'light') as 'light' | 'dark';

        if (logoItem.formats && logoItem.formats.length > 0) {
          for (const format of logoItem.formats) {
            if (format.src) {
              const variant: LogoVariant = {
                url: format.src,
                type: logoType,
                theme: logoTheme,
                format: (format.format || 'png') as 'svg' | 'png' | 'jpeg',
              };
              logoVariants.push(variant);
              console.log(`[fetch-brand-data][${requestId}] Found logo variant: type=${logoType}, theme=${logoTheme}, format=${format.format}`);
            }
          }
        }
      }

      // Select primary logo: prefer type "logo" > "symbol" > "icon", theme "light", format "svg" > "png"
      const sortPriority = (v: LogoVariant) => {
        let score = 0;
        if (v.type === 'logo') score += 100;
        else if (v.type === 'symbol') score += 50;
        else score += 10;
        
        if (v.theme === 'light') score += 20;
        
        if (v.format === 'svg') score += 5;
        else if (v.format === 'png') score += 3;
        
        return score;
      };

      logoVariants.sort((a, b) => sortPriority(b) - sortPriority(a));
      primaryLogo = logoVariants[0] || null;

      console.log(`[fetch-brand-data][${requestId}] Selected primary logo:`, primaryLogo);
      console.log(`[fetch-brand-data][${requestId}] Total logo variants: ${logoVariants.length}`);
    } else {
      console.log(`[fetch-brand-data][${requestId}] No logos found in Brand API response`);
    }

    // Return combined brand data with all logo variants
    const result = {
      companyName,
      logo: primaryLogo,
      logos: logoVariants,
      colors,
      fonts,
      firmographics,
    };

    console.log(`[fetch-brand-data][${requestId}] Returning brand data:`, { 
      companyName,
      hasPrimaryLogo: !!primaryLogo, 
      logoVariantCount: logoVariants.length,
      hasColors: !!colors, 
      hasFonts: !!fonts,
      hasFirmographics: !!firmographics 
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[fetch-brand-data] Error:`, error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
