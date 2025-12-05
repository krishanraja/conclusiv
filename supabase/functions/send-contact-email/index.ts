import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, category, subject, message, userId }: ContactRequest = await req.json();

    // Validate input
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Store inquiry in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase.from("contact_inquiries").insert({
      name,
      email,
      subject,
      message,
      category: category || "general",
      user_id: userId || null,
    });

    if (dbError) {
      console.error("Database error:", dbError);
    }

    // Send notification email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Conclusiv <onboarding@resend.dev>",
      to: ["hello@krishraja.com"],
      subject: `[Conclusiv Contact] ${category ? `[${category}] ` : ""}${subject}`,
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
                <div class="value"><span class="category-badge">${category || "General"}</span></div>
              </div>
              <div class="field">
                <div class="label">From</div>
                <div class="value"><strong>${name}</strong> &lt;${email}&gt;</div>
              </div>
              <div class="field">
                <div class="label">Subject</div>
                <div class="value">${subject}</div>
              </div>
              <div class="field">
                <div class="label">Message</div>
                <div class="message-box">${message}</div>
              </div>
              ${userId ? `<div class="field"><div class="label">User ID</div><div class="value" style="font-family: monospace; font-size: 12px;">${userId}</div></div>` : ""}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Admin email sent:", adminEmailResponse);

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: "Conclusiv <onboarding@resend.dev>",
      to: [email],
      subject: `We received your message - ${subject}`,
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
              <h1 style="margin: 0; font-size: 24px;">Thank you, ${name}!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">We've received your message</p>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thanks for reaching out! We've received your message and will get back to you as soon as possible, typically within 24-48 hours.</p>
              
              <div class="message-preview">
                <p style="margin: 0 0 8px; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase;">Your message:</p>
                <p style="margin: 0; font-style: italic;">"${subject}"</p>
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

    console.log("User confirmation email sent:", userEmailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
