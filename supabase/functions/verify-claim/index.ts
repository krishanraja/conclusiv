import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: Create SHA-256 hash for cache key
async function hashClaim(claim: string): Promise<string> {
  const normalized = claim.toLowerCase().trim().replace(/\s+/g, ' ');
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Types
type ClaimType = "financial" | "news" | "general";
type VerificationStatus = "verified" | "reliable" | "unreliable" | "unable_to_verify";
type FreshnessStatus = "fresh" | "dated" | "stale";

interface VerificationResult {
  status: VerificationStatus;
  confidence: number;
  sources: { title: string; url: string; publishedAt?: string }[];
  summary: string;
  freshness: FreshnessStatus;
  freshnessReason: string;
  dataDate?: string;
  requiresManualReview?: boolean;
}

interface ClaimClassification {
  type: ClaimType;
  extractedEntities: {
    companies?: string[];
    tickers?: string[];
    dates?: string[];
    percentages?: string[];
    currencies?: string[];
  };
  timeframe?: string;
}

// Classify the claim to determine verification route
async function classifyClaim(claim: string, apiKey: string): Promise<ClaimClassification> {
  const prompt = `Analyze this claim and classify it for fact-checking. Extract key entities.

CLAIM: "${claim}"

Return a JSON object:
{
  "type": "financial" | "news" | "general",
  "extractedEntities": {
    "companies": ["company names mentioned"],
    "tickers": ["stock tickers like DASH, AAPL"],
    "dates": ["any dates or time periods mentioned"],
    "percentages": ["any percentages mentioned"],
    "currencies": ["any dollar amounts or currencies"]
  },
  "timeframe": "the time period this claim refers to (e.g., 'Q4 2024', '2023', 'trailing 12 months', null if unclear)"
}

Classification rules:
- "financial": stock prices, revenue, market cap, earnings, financial metrics
- "news": company announcements, partnerships, acquisitions, product launches, recent events
- "general": industry trends, market statistics, general business facts

Return ONLY valid JSON, no markdown.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    if (!response.ok) {
      console.error("[classifyClaim] Gemini error:", response.status);
      return { type: "general", extractedEntities: {} };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) return { type: "general", extractedEntities: {} };

    const jsonStr = content.replace(/```json?\s*|\s*```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("[classifyClaim] Error:", err);
    return { type: "general", extractedEntities: {} };
  }
}

// Verify financial claims via Alpha Vantage
async function verifyFinancial(
  claim: string,
  classification: ClaimClassification,
  apiKey: string
): Promise<{ verified: boolean; data: any; source?: string }> {
  const tickers = classification.extractedEntities.tickers || [];
  const companies = classification.extractedEntities.companies || [];
  
  // Map common company names to tickers
  const companyToTicker: Record<string, string> = {
    "doordash": "DASH",
    "uber": "UBER",
    "apple": "AAPL",
    "google": "GOOGL",
    "amazon": "AMZN",
    "microsoft": "MSFT",
    "meta": "META",
    "netflix": "NFLX",
    "tesla": "TSLA",
  };

  // Try to find a ticker
  let ticker = tickers[0];
  if (!ticker && companies.length > 0) {
    const companyLower = companies[0].toLowerCase();
    ticker = companyToTicker[companyLower];
  }

  if (!ticker) {
    return { verified: false, data: null };
  }

  try {
    // Get stock quote
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
    const quoteRes = await fetch(quoteUrl);
    const quoteData = await quoteRes.json();

    // Get time series for historical comparison
    const timeSeriesUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=compact&apikey=${apiKey}`;
    const timeSeriesRes = await fetch(timeSeriesUrl);
    const timeSeriesData = await timeSeriesRes.json();

    if (quoteData["Global Quote"] || timeSeriesData["Time Series (Daily)"]) {
      return {
        verified: true,
        data: {
          quote: quoteData["Global Quote"],
          timeSeries: timeSeriesData["Time Series (Daily)"],
          ticker,
        },
        source: `Alpha Vantage - ${ticker}`,
      };
    }

    return { verified: false, data: null };
  } catch (err) {
    console.error("[verifyFinancial] Alpha Vantage error:", err);
    return { verified: false, data: null };
  }
}

// Verify news claims via NewsAPI
async function verifyNews(
  claim: string,
  classification: ClaimClassification,
  apiKey: string
): Promise<{ articles: any[]; relevant: boolean }> {
  const companies = classification.extractedEntities.companies || [];
  const searchTerms = companies.length > 0 ? companies.join(" OR ") : claim.split(" ").slice(0, 5).join(" ");

  try {
    // Search everything endpoint for broader coverage
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", searchTerms);
    url.searchParams.set("sortBy", "relevancy");
    url.searchParams.set("pageSize", "10");
    url.searchParams.set("language", "en");
    
    // Search last 30 days
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    url.searchParams.set("from", fromDate.toISOString().split("T")[0]);

    const response = await fetch(url.toString(), {
      headers: { "X-Api-Key": apiKey },
    });

    if (!response.ok) {
      console.error("[verifyNews] NewsAPI error:", response.status);
      return { articles: [], relevant: false };
    }

    const data = await response.json();
    const articles = data.articles || [];

    return {
      articles: articles.slice(0, 5).map((a: any) => ({
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt,
        source: a.source?.name,
        description: a.description,
      })),
      relevant: articles.length > 0,
    };
  } catch (err) {
    console.error("[verifyNews] Error:", err);
    return { articles: [], relevant: false };
  }
}

// Verify via Gemini with Google Search Grounding
async function verifyWithGrounding(
  claim: string,
  context: string | undefined,
  financialData: any,
  newsArticles: any[],
  apiKey: string
): Promise<{ status: VerificationStatus; confidence: number; summary: string; dataDate?: string }> {
  
  // Build context with external data
  let externalContext = "";
  
  if (financialData?.data?.quote) {
    const quote = financialData.data.quote;
    externalContext += `\nFINANCIAL DATA (from Alpha Vantage):
- Symbol: ${quote["01. symbol"]}
- Current Price: $${quote["05. price"]}
- Change: ${quote["09. change"]} (${quote["10. change percent"]})
- Latest Trading Day: ${quote["07. latest trading day"]}`;
  }

  if (newsArticles.length > 0) {
    externalContext += `\n\nRECENT NEWS ARTICLES (from NewsAPI):`;
    newsArticles.forEach((article, i) => {
      externalContext += `\n${i + 1}. "${article.title}" - ${article.source} (${article.publishedAt?.split("T")[0] || "unknown date"})`;
    });
  }

  const prompt = `You are a fact-checking assistant with access to real data. Verify this claim using the provided external data and your knowledge.

CLAIM TO VERIFY:
"${claim}"

${context ? `CONTEXT: ${context}` : ""}

${externalContext || "No external data available for this claim."}

Analyze the claim against the provided data and determine:
1. VERIFIED: Strong evidence supports this claim (confidence 75-100)
2. RELIABLE: Cannot fully verify but appears consistent with available data (confidence 50-74)
3. UNRELIABLE: Evidence contradicts or cannot find support (confidence 0-49)

Also determine the DATA FRESHNESS:
- Extract any dates mentioned in the claim
- Compare against source data dates
- Determine if the claim uses current or outdated information

Return a JSON object:
{
  "status": "verified" | "reliable" | "unreliable",
  "confidence": <number 0-100>,
  "summary": "<2-3 sentence explanation of verification result>",
  "dataDate": "<the date/timeframe the claim's data refers to, or null if unclear>",
  "contradictions": ["list any contradictions found"],
  "supportingEvidence": ["list supporting evidence found"]
}

Be rigorous but fair. If external data supports the claim's general direction even if numbers differ slightly, mark as "reliable".
Return ONLY valid JSON, no markdown.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
          // Enable Google Search grounding for real-time web data
          tools: [{
            googleSearch: {}
          }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[verifyWithGrounding] Gemini error:", response.status, errorText);
      
      // Fallback without grounding if it fails
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 },
          }),
        }
      );
      
      if (!fallbackResponse.ok) {
        throw new Error("Gemini fallback failed");
      }
      
      const fallbackData = await fallbackResponse.json();
      const content = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (content) {
        const jsonStr = content.replace(/```json?\s*|\s*```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        return {
          status: parsed.status || "unable_to_verify",
          confidence: parsed.confidence || 0,
          summary: parsed.summary || "Verification completed with limited data sources.",
          dataDate: parsed.dataDate,
        };
      }
      // If no content from fallback, throw error to be caught below
      throw new Error("No content from Gemini fallback");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No content in Gemini response");
    }

    const jsonStr = content.replace(/```json?\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      status: parsed.status || "reliable",
      confidence: Math.max(0, Math.min(100, parsed.confidence || 50)),
      summary: parsed.summary || "Verification completed.",
      dataDate: parsed.dataDate,
    };
  } catch (err) {
    console.error("[verifyWithGrounding] Error:", err);
    // Return unable_to_verify instead of masking as "reliable"
    return {
      status: "unable_to_verify",
      confidence: 0,
      summary: "Verification failed due to a processing error. Please review manually or retry.",
    };
  }
}

// Calculate freshness based on data date
function calculateFreshness(dataDate: string | undefined, claimText: string): { status: FreshnessStatus; reason: string } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Parse explicit data date first (most reliable)
  if (dataDate && dataDate !== "null" && dataDate !== "undefined") {
    try {
      const date = new Date(dataDate);
      if (!isNaN(date.getTime())) {
        const monthsAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);

        if (monthsAgo <= 3) return { status: "fresh", reason: "Data is within last 3 months" };
        if (monthsAgo <= 12) return { status: "dated", reason: `Data is ${Math.round(monthsAgo)} months old` };
        return { status: "stale", reason: `Data is over ${Math.round(monthsAgo / 12)} year(s) old` };
      }
    } catch {
      // Fall through to heuristic analysis
    }
  }

  // Check for explicit date patterns in the claim text
  const claimLower = claimText.toLowerCase();

  // Rolling time period indicators (always fresh)
  const rollingPatterns = [
    /trailing\s*(\d+)\s*(months?|years?)/i,
    /last\s*(\d+)\s*(months?|years?|quarters?)/i,
    /past\s*(\d+)\s*(months?|years?|quarters?)/i,
    /(ttm|ltm)/i, // Trailing Twelve Months, Last Twelve Months
    /year[- ]to[- ]date/i,
    /ytd/i,
  ];

  for (const pattern of rollingPatterns) {
    if (pattern.test(claimLower)) {
      return { status: "fresh", reason: "Uses rolling time period" };
    }
  }

  // Current state indicators (fresh unless proven otherwise)
  const currentStatePatterns = [
    /\b(current|currently|now|today|recent|latest|as of)\b/i,
    /\b(is|are|has|have)\b/i, // Present tense suggests current state
  ];

  let hasCurrentIndicator = false;
  for (const pattern of currentStatePatterns) {
    if (pattern.test(claimLower)) {
      hasCurrentIndicator = true;
      break;
    }
  }

  // Quarter patterns
  const quarterMatch = claimText.match(/Q([1-4])\s*(20\d{2})?/i);
  if (quarterMatch) {
    const quarter = parseInt(quarterMatch[1]);
    const year = quarterMatch[2] ? parseInt(quarterMatch[2]) : currentYear;
    const quarterEndMonth = quarter * 3 - 1;
    const monthsAgo = (currentYear - year) * 12 + (currentMonth - quarterEndMonth);

    if (monthsAgo <= 3) return { status: "fresh", reason: `Q${quarter} ${year} data` };
    if (monthsAgo <= 12) return { status: "dated", reason: `Q${quarter} ${year} is ${monthsAgo} months old` };
    return { status: "stale", reason: `Q${quarter} ${year} is over a year old` };
  }

  // Year patterns
  const yearMatch = claimText.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    const yearsAgo = currentYear - year;

    if (yearsAgo === 0) return { status: "fresh", reason: `${year} data` };
    if (yearsAgo === 1) return { status: "dated", reason: `${year} data is from last year` };
    return { status: "stale", reason: `${year} data is ${yearsAgo} years old` };
  }

  // Month/date patterns
  const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  for (let i = 0; i < monthNames.length; i++) {
    const monthPattern = new RegExp(`\\b${monthNames[i]}\\s*(\\d{1,2})?,?\\s*(20\\d{2})?\\b`, 'i');
    const monthMatch = claimText.match(monthPattern);
    if (monthMatch) {
      const year = monthMatch[2] ? parseInt(monthMatch[2]) : currentYear;
      const monthsAgo = (currentYear - year) * 12 + (currentMonth - i);

      if (monthsAgo <= 3) return { status: "fresh", reason: `${monthNames[i]} ${year} data` };
      if (monthsAgo <= 12) return { status: "dated", reason: `${monthNames[i]} ${year} is ${monthsAgo} months old` };
      return { status: "stale", reason: `${monthNames[i]} ${year} is over a year old` };
    }
  }

  // No explicit date found - use context clues
  // If claim has current-state indicators and no old dates, assume fresh
  if (hasCurrentIndicator) {
    return { status: "fresh", reason: "Claim appears to reference current state" };
  }

  // Default to fresh with caveat (better UX than assuming dated)
  return {
    status: "fresh",
    reason: "No date reference found - assumed current unless stated otherwise"
  };
}

// Main handler
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claim, context } = await req.json();

    if (!claim || typeof claim !== "string") {
      return new Response(
        JSON.stringify({ error: "Claim text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[verify-claim] Starting multi-source verification:", claim.slice(0, 100));

    // Initialize Supabase client for caching
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    let supabase = null;
    if (supabaseUrl && supabaseKey && authHeader) {
      supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });
    }

    // Check cache first
    if (supabase) {
      const claimHash = await hashClaim(claim);
      const { data: cached, error: cacheError } = await supabase
        .from("verification_cache")
        .select("*")
        .eq("claim_hash", claimHash)
        .gte("cached_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 days
        .single();

      if (cached && !cacheError) {
        console.log("[verify-claim] Cache hit for claim:", claim.slice(0, 50));

        // Update hit count
        await supabase
          .from("verification_cache")
          .update({ hits: cached.hits + 1 })
          .eq("id", cached.id);

        return new Response(
          JSON.stringify({
            ...cached.verification_result,
            cached: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get API keys
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");
    const ALPHA_API_KEY = Deno.env.get("ALPHA_API_KEY");

    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    // Step 1: Classify the claim
    console.log("[verify-claim] Classifying claim...");
    const classification = await classifyClaim(claim, GOOGLE_AI_API_KEY);
    console.log("[verify-claim] Classification:", classification.type);

    // Step 2: Route to appropriate verification sources
    let financialData = null;
    let newsArticles: any[] = [];

    // Financial verification for financial claims
    if (classification.type === "financial" && ALPHA_API_KEY) {
      console.log("[verify-claim] Fetching financial data...");
      financialData = await verifyFinancial(claim, classification, ALPHA_API_KEY);
    }

    // News verification for news or financial claims
    if ((classification.type === "news" || classification.type === "financial") && NEWS_API_KEY) {
      console.log("[verify-claim] Fetching news articles...");
      const newsResult = await verifyNews(claim, classification, NEWS_API_KEY);
      newsArticles = newsResult.articles;
    }

    // Step 3: Aggregate with Gemini grounding
    console.log("[verify-claim] Running grounded verification...");
    const verification = await verifyWithGrounding(
      claim,
      context,
      financialData,
      newsArticles,
      GOOGLE_AI_API_KEY
    );

    // Step 4: Calculate freshness
    const freshness = calculateFreshness(verification.dataDate, claim);

    // Step 5: Build sources list
    const sources: { title: string; url: string; publishedAt?: string }[] = [];
    
    if (financialData?.source) {
      sources.push({ title: financialData.source, url: "https://www.alphavantage.co" });
    }
    
    newsArticles.forEach(article => {
      sources.push({
        title: article.title,
        url: article.url,
        publishedAt: article.publishedAt,
      });
    });

    // Build final result
    const result: VerificationResult = {
      status: verification.status,
      confidence: verification.confidence,
      sources,
      summary: verification.summary,
      freshness: freshness.status,
      freshnessReason: freshness.reason,
      dataDate: verification.dataDate,
    };

    console.log("[verify-claim] Complete:", result.status, "confidence:", result.confidence, "freshness:", result.freshness);

    // Cache the result for future use (only successful verifications)
    if (supabase && result.status !== "unable_to_verify") {
      try {
        const claimHash = await hashClaim(claim);
        await supabase.from("verification_cache").upsert(
          {
            claim_hash: claimHash,
            claim_text: claim.slice(0, 500), // Store first 500 chars for debugging
            verification_result: result,
            cached_at: new Date().toISOString(),
            hits: 0,
          },
          { onConflict: "claim_hash" }
        );
        console.log("[verify-claim] Result cached successfully");
      } catch (cacheError) {
        console.error("[verify-claim] Cache storage error (non-fatal):", cacheError);
        // Continue without caching - don't fail the request
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[verify-claim] Error:", error);
    // Return explicit unable_to_verify status - never mask failures as "reliable"
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        status: "unable_to_verify",
        confidence: 0,
        sources: [],
        summary: "Verification failed. Please verify this claim manually.",
        freshness: "dated",
        freshnessReason: "Could not determine freshness due to error",
        requiresManualReview: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
