import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Error types for structured responses
const ErrorTypes = {
  MISSING_FIELDS: "MISSING_FIELDS",
  INVALID_EMAIL: "INVALID_EMAIL",
  EMAIL_SERVICE_NOT_CONFIGURED: "EMAIL_SERVICE_NOT_CONFIGURED",
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

interface ContactRequest {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  userId?: string;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize HTML to prevent XSS in emails
function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  console.log(`[send-contact-email][${requestId}] Request received at ${timestamp}`);
  console.log(`[send-contact-email][${requestId}] Method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log(`[send-contact-email][${requestId}] CORS preflight request handled`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate RESEND_API_KEY exists
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error(`[send-contact-email][${requestId}] CRITICAL: RESEND_API_KEY not configured`);
      return new Response(
        JSON.stringify({ 
          error: ErrorTypes.EMAIL_SERVICE_NOT_CONFIGURED,
          message: "Email service not configured",
          requestId 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    console.log(`[send-contact-email][${requestId}] RESEND_API_KEY present: true`);

    const resend = new Resend(resendApiKey);

    // Parse request body
    const { name, email, category, subject, message, userId }: ContactRequest = await req.json();
    
    // Log sanitized input (no message content for privacy)
    console.log(`[send-contact-email][${requestId}] Input: name="${name}", email="${email}", category="${category || 'general'}", subject="${subject}", userId="${userId || 'anonymous'}"`);

    // Validate required fields
    if (!name || !email || !subject || !message) {
      const missingFields = [];
      if (!name) missingFields.push("name");
      if (!email) missingFields.push("email");
      if (!subject) missingFields.push("subject");
      if (!message) missingFields.push("message");
      
      console.error(`[send-contact-email][${requestId}] Missing required fields: ${missingFields.join(", ")}`);
      return new Response(
        JSON.stringify({ 
          error: ErrorTypes.MISSING_FIELDS,
          message: `Missing required fields: ${missingFields.join(", ")}`,
          requestId 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      console.error(`[send-contact-email][${requestId}] Invalid email format: ${email}`);
      return new Response(
        JSON.stringify({ 
          error: ErrorTypes.INVALID_EMAIL,
          message: "Invalid email address format",
          requestId 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize inputs for HTML emails
    const sanitizedName = sanitizeHtml(name);
    const sanitizedEmail = sanitizeHtml(email);
    const sanitizedSubject = sanitizeHtml(subject);
    const sanitizedMessage = sanitizeHtml(message);
    const sanitizedCategory = sanitizeHtml(category || "general");

    // Store inquiry in database
    console.log(`[send-contact-email][${requestId}] Attempting to store inquiry in database...`);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let inquiryLogged = false;
    const { error: dbError } = await supabase.from("contact_inquiries").insert({
      name,
      email,
      subject,
      message,
      category: category || "general",
      user_id: userId || null,
    });

    if (dbError) {
      console.error(`[send-contact-email][${requestId}] Database error: ${JSON.stringify(dbError)}`);
      // Continue to send emails even if DB fails
    } else {
      inquiryLogged = true;
      console.log(`[send-contact-email][${requestId}] Inquiry stored in database successfully`);
    }

    // Send notification email to admin
    console.log(`[send-contact-email][${requestId}] Sending admin notification email...`);
    const adminEmailResponse = await resend.emails.send({
      from: "Conclusiv <onboarding@resend.dev>",
      to: ["hello@krishraja.com"],
      subject: `[Conclusiv Contact] ${category ? `[${sanitizedCategory}] ` : ""}${sanitizedSubject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 16px; }
            .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .value { margin-top: 4px; }
            .message-box { background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; white-space: pre-wrap; }
            .category-badge { display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #3730a3; border-radius: 20px; font-size: 12px; font-weight: 500; }
            .meta { font-size: 11px; color: #9ca3af; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 20px;">New Contact Form Submission</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Category</div>
                <div class="value"><span class="category-badge">${sanitizedCategory}</span></div>
              </div>
              <div class="field">
                <div class="label">From</div>
                <div class="value"><strong>${sanitizedName}</strong> &lt;${sanitizedEmail}&gt;</div>
              </div>
              <div class="field">
                <div class="label">Subject</div>
                <div class="value">${sanitizedSubject}</div>
              </div>
              <div class="field">
                <div class="label">Message</div>
                <div class="message-box">${sanitizedMessage}</div>
              </div>
              ${userId ? `<div class="field"><div class="label">User ID</div><div class="value" style="font-family: monospace; font-size: 12px;">${sanitizeHtml(userId)}</div></div>` : ""}
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

    let adminEmailSent = false;
    let adminEmailId: string | undefined;
    
    if (adminEmailResponse.data?.id) {
      adminEmailSent = true;
      adminEmailId = adminEmailResponse.data.id;
      console.log(`[send-contact-email][${requestId}] Admin email sent successfully. Resend ID: ${adminEmailId}`);
    } else if (adminEmailResponse.error) {
      console.error(`[send-contact-email][${requestId}] Admin email FAILED: ${JSON.stringify(adminEmailResponse.error)}`);
    }

    // Send confirmation email to user
    console.log(`[send-contact-email][${requestId}] Sending user confirmation email to ${email}...`);
    const userEmailResponse = await resend.emails.send({
      from: "Conclusiv <onboarding@resend.dev>",
      to: [email],
      subject: `We received your message - ${sanitizedSubject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .message-preview { background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Thank you, ${sanitizedName}!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">We've received your message</p>
            </div>
            <div class="content">
              <p>Hi ${sanitizedName},</p>
              <p>Thanks for reaching out! We've received your message and will get back to you as soon as possible, typically within 24-48 hours.</p>
              
              <div class="message-preview">
                <p style="margin: 0 0 8px; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase;">Your message:</p>
                <p style="margin: 0; font-style: italic;">"${sanitizedSubject}"</p>
              </div>
              
              <p>In the meantime, feel free to continue using Conclusiv to transform your data into compelling narratives.</p>
              
              <p>Best regards,<br><strong>The Conclusiv Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Mindmaker LLC. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    let userEmailSent = false;
    let userEmailId: string | undefined;
    
    if (userEmailResponse.data?.id) {
      userEmailSent = true;
      userEmailId = userEmailResponse.data.id;
      console.log(`[send-contact-email][${requestId}] User confirmation email sent successfully. Resend ID: ${userEmailId}`);
    } else if (userEmailResponse.error) {
      console.error(`[send-contact-email][${requestId}] User email FAILED: ${JSON.stringify(userEmailResponse.error)}`);
    }

    // Determine overall success
    const success = adminEmailSent || userEmailSent;
    
    if (!success) {
      console.error(`[send-contact-email][${requestId}] FAILED: Both emails failed to send`);
      return new Response(
        JSON.stringify({ 
          error: ErrorTypes.EMAIL_SEND_FAILED,
          message: "Failed to send emails. Please try again later.",
          requestId,
          inquiryLogged
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-contact-email][${requestId}] SUCCESS: adminEmail=${adminEmailSent}, userEmail=${userEmailSent}, dbLogged=${inquiryLogged}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        requestId,
        adminEmailId,
        userEmailId,
        inquiryLogged
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error(`[send-contact-email][${requestId}] INTERNAL ERROR: ${error.message}`);
    console.error(`[send-contact-email][${requestId}] Stack trace: ${error.stack}`);
    
    return new Response(
      JSON.stringify({ 
        error: ErrorTypes.INTERNAL_ERROR,
        message: "An unexpected error occurred. Please try again.",
        requestId 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
