import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  to: string;
  template_type: "order_confirmation" | "order_status_update" | "shipping_notification";
  order_number: string;
  customer_name: string;
  order_status?: string;
  tracking_number?: string;
  courier_name?: string;
  tracking_url?: string;
  estimated_delivery?: string;
  order_items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total_amount?: number;
}

interface SmtpSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  smtp_secure: boolean;
  is_enabled: boolean;
}

const getEmailTemplate = (request: EmailRequest): { subject: string; html: string } => {
  const { template_type, order_number, customer_name, order_status, tracking_number, courier_name, tracking_url, estimated_delivery, order_items, total_amount } = request;

  switch (template_type) {
    case "order_confirmation":
      return {
        subject: `অর্ডার নিশ্চিত হয়েছে - ${order_number}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #0ea5e9, #10b981); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .order-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .items-table th, .items-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
              .items-table th { background: #f1f5f9; }
              .total { font-size: 18px; font-weight: bold; color: #0ea5e9; }
              .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🐟 FishCare BD</h1>
              <p>অর্ডার নিশ্চিত হয়েছে!</p>
            </div>
            <div class="content">
              <p>প্রিয় ${customer_name},</p>
              <p>আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। আমরা শীঘ্রই আপনার অর্ডার প্রক্রিয়া শুরু করব।</p>
              
              <div class="order-info">
                <strong>অর্ডার নম্বর:</strong> ${order_number}<br>
                <strong>স্ট্যাটাস:</strong> অপেক্ষমাণ (Pending)
              </div>

              ${order_items && order_items.length > 0 ? `
              <table class="items-table">
                <thead>
                  <tr>
                    <th>পণ্য</th>
                    <th>পরিমাণ</th>
                    <th>মূল্য</th>
                  </tr>
                </thead>
                <tbody>
                  ${order_items.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>৳${item.price.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ` : ''}

              ${total_amount ? `<p class="total">মোট: ৳${total_amount.toFixed(2)}</p>` : ''}

              <p>ধন্যবাদ আমাদের সাথে থাকার জন্য!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} FishCare BD। সর্বস্বত্ব সংরক্ষিত।</p>
              <p>এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। দয়া করে উত্তর দেবেন না।</p>
            </div>
          </body>
          </html>
        `,
      };

    case "order_status_update":
      const statusLabels: Record<string, string> = {
        pending: "অপেক্ষমাণ",
        processing: "প্রক্রিয়াধীন",
        shipped: "শিপড",
        delivered: "ডেলিভারড",
        cancelled: "বাতিল",
        refunded: "রিফান্ড",
      };
      
      return {
        subject: `অর্ডার স্ট্যাটাস আপডেট - ${order_number}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
              .status-pending { background: #fef3c7; color: #92400e; }
              .status-processing { background: #dbeafe; color: #1e40af; }
              .status-shipped { background: #d1fae5; color: #065f46; }
              .status-delivered { background: #dcfce7; color: #166534; }
              .status-cancelled { background: #fee2e2; color: #991b1b; }
              .order-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🐟 FishCare BD</h1>
              <p>অর্ডার স্ট্যাটাস আপডেট</p>
            </div>
            <div class="content">
              <p>প্রিয় ${customer_name},</p>
              <p>আপনার অর্ডারের স্ট্যাটাস আপডেট হয়েছে।</p>
              
              <div class="order-info">
                <strong>অর্ডার নম্বর:</strong> ${order_number}<br>
                <span class="status-badge status-${order_status}">${statusLabels[order_status || ''] || order_status}</span>
              </div>

              <p>আপনার অর্ডার সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} FishCare BD। সর্বস্বত্ব সংরক্ষিত।</p>
            </div>
          </body>
          </html>
        `,
      };

    case "shipping_notification":
      return {
        subject: `শিপমেন্ট নোটিফিকেশন - ${order_number}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .tracking-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 20px; border-radius: 12px; margin: 15px 0; border: 2px solid #10b981; }
              .tracking-number { font-size: 24px; font-weight: bold; color: #059669; letter-spacing: 2px; }
              .track-btn { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 10px 0; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
              .info-item { background: #f8fafc; padding: 10px; border-radius: 8px; }
              .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📦 শিপমেন্ট নোটিফিকেশন</h1>
              <p>আপনার অর্ডার শিপ করা হয়েছে!</p>
            </div>
            <div class="content">
              <p>প্রিয় ${customer_name},</p>
              <p>সুখবর! আপনার অর্ডার শিপ করা হয়েছে এবং আপনার ঠিকানায় পৌঁছাতে যাচ্ছে।</p>
              
              <div class="tracking-box">
                <p><strong>📋 অর্ডার নম্বর:</strong> ${order_number}</p>
                ${courier_name ? `<p><strong>🚚 কুরিয়ার:</strong> ${courier_name}</p>` : ''}
                ${tracking_number ? `
                  <p><strong>ট্র্যাকিং নম্বর:</strong></p>
                  <p class="tracking-number">${tracking_number}</p>
                ` : ''}
                ${tracking_url ? `<a href="${tracking_url}" class="track-btn">🔍 ট্র্যাক করুন</a>` : ''}
              </div>

              ${estimated_delivery ? `
              <div class="info-item">
                <strong>📅 আনুমানিক ডেলিভারি:</strong> ${estimated_delivery}
              </div>
              ` : ''}

              <p>ধৈর্য ধরে অপেক্ষা করুন। শীঘ্রই আপনার পণ্য পেয়ে যাবেন!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} FishCare BD। সর্বস্বত্ব সংরক্ষিত।</p>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: `FishCare BD - ${order_number}`,
        html: `<p>অর্ডার: ${order_number}</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get SMTP settings
    const { data: smtpSettings, error: smtpError } = await supabaseClient
      .from("smtp_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (smtpError) {
      console.error("Error fetching SMTP settings:", smtpError);
      throw new Error("Failed to fetch SMTP settings");
    }

    if (!smtpSettings || !smtpSettings.is_enabled) {
      console.log("SMTP is not enabled or configured");
      return new Response(
        JSON.stringify({ success: false, message: "Email notifications are disabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const settings = smtpSettings as SmtpSettings;

    if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
      console.log("SMTP settings incomplete");
      return new Response(
        JSON.stringify({ success: false, message: "SMTP settings are incomplete" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRequest: EmailRequest = await req.json();
    const { to, template_type, order_number } = emailRequest;

    if (!to || !template_type || !order_number) {
      throw new Error("Missing required fields: to, template_type, order_number");
    }

    const { subject, html } = getEmailTemplate(emailRequest);

    console.log(`Sending ${template_type} email to ${to} for order ${order_number}`);

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: settings.smtp_host,
        port: settings.smtp_port,
        tls: settings.smtp_secure,
        auth: {
          username: settings.smtp_user,
          password: settings.smtp_password,
        },
      },
    });

    // Send email
    await client.send({
      from: `${settings.smtp_from_name} <${settings.smtp_from_email}>`,
      to: to,
      subject: subject,
      content: "Please view this email in an HTML-capable email client.",
      html: html,
    });

    await client.close();

    // Log email
    await supabaseClient.from("email_logs").insert({
      order_number,
      recipient_email: to,
      subject,
      template_type,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    console.log(`Email sent successfully to ${to}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Try to log the failed email
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      const body = await req.clone().json().catch(() => ({}));
      
      await supabaseClient.from("email_logs").insert({
        order_number: body.order_number || "unknown",
        recipient_email: body.to || "unknown",
        subject: "Failed to send",
        template_type: body.template_type || "unknown",
        status: "failed",
        error_message: errorMessage,
      });
    } catch (logError) {
      console.error("Failed to log email error:", logError);
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
