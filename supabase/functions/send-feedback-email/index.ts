import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackEmailRequest {
  feedbackType: string;
  rating?: number;
  message?: string;
  sentiment?: string;
  userId?: string;
  sessionId?: string;
  page?: string;
  context?: Record<string, unknown>;
}

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  console.log(`[send-feedback-email][${requestId}] Request received at ${timestamp}`);
  console.log(`[send-feedback-email][${requestId}] Method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log(`[send-feedback-email][${requestId}] CORS preflight handled`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate RESEND_API_KEY
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error(`[send-feedback-email][${requestId}] CRITICAL: RESEND_API_KEY not configured`);
      return new Response(
        JSON.stringify({ error: "EMAIL_SERVICE_NOT_CONFIGURED", requestId }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    console.log(`[send-feedback-email][${requestId}] RESEND_API_KEY present: true`);

    const resend = new Resend(resendApiKey);

    // Parse request body - Note: we ignore userId from request body for security
    const body: FeedbackEmailRequest = await req.json();
    const { feedbackType, rating, message, sentiment, sessionId, page, context } = body;
    
    // SECURITY: Extract userId from JWT token if present, never trust client-provided userId
    let validatedUserId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Supabase environment variables not configured");
        }
        const supabaseAuth = createClient(supabaseUrl, supabaseKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
        if (!authError && user) {
          validatedUserId = user.id;
          console.log(`[send-feedback-email][${requestId}] User ID validated from JWT: ${validatedUserId}`);
        }
      } catch (authErr) {
        console.warn(`[send-feedback-email][${requestId}] JWT validation failed, proceeding as anonymous`);
      }
    }

    console.log(`[send-feedback-email][${requestId}] Feedback received:`, {
      feedbackType,
      rating,
      sentiment,
      userId: validatedUserId || "anonymous",
      sessionId: sessionId || "none",
      page,
      hasMessage: !!message,
      contextKeys: context ? Object.keys(context) : [],
    });

    // Build readable feedback type
    const feedbackTypeLabels: Record<string, string> = {
      quick_rating: "⭐ Quick Rating",
      nps: "📊 NPS Score",
      detailed: "💬 Detailed Feedback",
      bug_report: "🐛 Bug Report",
      feature_request: "💡 Feature Request",
    };

    const feedbackLabel = feedbackTypeLabels[feedbackType] || feedbackType;

    // Determine sentiment emoji
    const sentimentEmoji = sentiment === "positive" ? "😊" : sentiment === "negative" ? "😟" : "😐";

    // Build context HTML
    let contextHtml = "";
    if (context && Object.keys(context).length > 0) {
      const contextItems = Object.entries(context)
        .filter(([key]) => !["browser", "device"].includes(key)) // Exclude verbose fields from main display
        .map(([key, value]) => {
          const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
          return `<tr><td style="padding: 4px 8px; color: #6b7280; font-size: 12px;">${key}</td><td style="padding: 4px 8px; font-size: 12px;">${displayValue}</td></tr>`;
        })
        .join("");
      
      if (contextItems) {
        contextHtml = `
          <div style="margin-top: 16px;">
            <div style="font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">Context</div>
            <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 6px;">
              ${contextItems}
            </table>
          </div>
        `;
      }
    }

    // Build device info section
    const browser = context?.browser as string || "Unknown";
    const device = context?.device as string || "Unknown";
    const deviceInfoHtml = `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <div style="font-size: 11px; color: #9ca3af;">
          <strong>Device:</strong> ${device}<br>
          <strong>Browser:</strong> ${browser.substring(0, 100)}${browser.length > 100 ? "..." : ""}
        </div>
      </div>
    `;

    // Send notification email to admin
    console.log(`[send-feedback-email][${requestId}] Sending feedback notification to krish@themindmaker.ai...`);
    
    const emailResponse = await resend.emails.send({
      from: "Conclusiv Feedback <hello@themindmaker.ai>",
      to: ["krish@themindmaker.ai"],
      subject: `[Conclusiv] ${feedbackLabel} ${rating !== undefined ? `(${rating}/5)` : ""} ${sentimentEmoji}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { 
              background: ${sentiment === "positive" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : 
                          sentiment === "negative" ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : 
                          "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"}; 
              color: white; 
              padding: 20px; 
              border-radius: 8px 8px 0 0; 
            }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 16px; }
            .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .value { margin-top: 4px; }
            .message-box { background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-wrap; }
            .rating-display { font-size: 24px; font-weight: bold; }
            .sentiment-badge { 
              display: inline-block; 
              padding: 4px 12px; 
              border-radius: 20px; 
              font-size: 12px; 
              font-weight: 500;
              background: ${sentiment === "positive" ? "#d1fae5" : sentiment === "negative" ? "#fee2e2" : "#f3f4f6"};
              color: ${sentiment === "positive" ? "#065f46" : sentiment === "negative" ? "#991b1b" : "#374151"};
            }
            .meta { font-size: 11px; color: #9ca3af; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 20px;">${feedbackLabel}</h1>
              <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">New feedback received from Conclusiv</p>
            </div>
            <div class="content">
              ${rating !== undefined ? `
                <div class="field">
                  <div class="label">Rating</div>
                  <div class="value">
                    <span class="rating-display">${rating}</span>
                    <span style="color: #6b7280;">/5</span>
                    <span class="sentiment-badge" style="margin-left: 12px;">${sentimentEmoji} ${sentiment || "neutral"}</span>
                  </div>
                </div>
              ` : ""}
              
              ${message ? `
                <div class="field">
                  <div class="label">Message</div>
                  <div class="message-box">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                </div>
              ` : ""}
              
              <div class="field">
                <div class="label">User Info</div>
                <div class="value">
                  <strong>User ID${validatedUserId ? " (Verified)" : ""}:</strong> ${validatedUserId || "Anonymous"}<br>
                  <strong>Session:</strong> ${sessionId || "N/A"}<br>
                  <strong>Page:</strong> ${page || "N/A"}
                </div>
              </div>
              
              ${contextHtml}
              ${deviceInfoHtml}
              
              <div class="meta">
                Request ID: ${requestId}<br>
                Timestamp: ${timestamp}
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailResponse.data?.id) {
      console.log(`[send-feedback-email][${requestId}] SUCCESS: Email sent. Resend ID: ${emailResponse.data.id}`);
      return new Response(
        JSON.stringify({ success: true, requestId, emailId: emailResponse.data.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else if (emailResponse.error) {
      console.error(`[send-feedback-email][${requestId}] FAILED: ${JSON.stringify(emailResponse.error)}`);
      return new Response(
        JSON.stringify({ error: "EMAIL_SEND_FAILED", details: emailResponse.error, requestId }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fallback
    console.warn(`[send-feedback-email][${requestId}] No data or error in response`);
    return new Response(
      JSON.stringify({ success: false, requestId }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error(`[send-feedback-email][${requestId}] INTERNAL ERROR: ${error.message}`);
    console.error(`[send-feedback-email][${requestId}] Stack: ${error.stack}`);
    
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR", message: error.message, requestId }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
