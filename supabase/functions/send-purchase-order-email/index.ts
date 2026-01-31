import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PurchaseOrderItem {
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

interface PurchaseOrderEmailRequest {
  purchase_order_id: string;
  supplier_email: string;
  supplier_name: string;
  order_number: string;
  order_date: string;
  expected_date: string | null;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  notes: string | null;
  company_info: {
    name: string;
    email: string;
    phone: string;
  };
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

const generatePurchaseOrderEmailHtml = (data: PurchaseOrderEmailRequest): { subject: string; html: string } => {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.product_name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">৳${item.unit_cost.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">৳${item.total_cost.toFixed(2)}</td>
    </tr>
  `).join('');

  return {
    subject: `ক্রয় অর্ডার - ${data.order_number} | FishCare BD`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; background-color: #f8fafc;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7c3aed, #8b5cf6); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🐟 FishCare BD</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">ক্রয় অর্ডার</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 30px;">
          <!-- Greeting -->
          <p style="font-size: 16px; margin-bottom: 20px;">
            প্রিয় <strong>${data.supplier_name}</strong>,
          </p>
          <p style="font-size: 15px; color: #64748b; margin-bottom: 25px;">
            আমরা নিম্নলিখিত পণ্যগুলির জন্য একটি ক্রয় অর্ডার জমা দিচ্ছি। অনুগ্রহ করে অর্ডারটি পর্যালোচনা করুন এবং নিশ্চিত করুন।
          </p>

          <!-- Order Info Box -->
          <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 20px; border-radius: 12px; border: 1px solid #7dd3fc; margin-bottom: 25px;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0;">
                  <strong style="color: #0369a1;">📋 অর্ডার নম্বর:</strong>
                  <span style="color: #0c4a6e; font-weight: bold; margin-left: 10px;">${data.order_number}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">
                  <strong style="color: #0369a1;">📅 অর্ডার তারিখ:</strong>
                  <span style="margin-left: 10px;">${data.order_date}</span>
                </td>
              </tr>
              ${data.expected_date ? `
              <tr>
                <td style="padding: 5px 0;">
                  <strong style="color: #0369a1;">📆 প্রত্যাশিত ডেলিভারি:</strong>
                  <span style="margin-left: 10px;">${data.expected_date}</span>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Items Table -->
          <h3 style="color: #1e293b; margin-bottom: 15px; font-size: 18px;">📦 অর্ডার আইটেম</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;">
                <th style="padding: 14px; text-align: left;">পণ্য</th>
                <th style="padding: 14px; text-align: center;">পরিমাণ</th>
                <th style="padding: 14px; text-align: right;">একক মূল্য</th>
                <th style="padding: 14px; text-align: right;">মোট</th>
              </tr>
            </thead>
            <tbody style="background: white;">
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <table style="width: 100%; max-width: 300px; margin-left: auto;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">সাবটোটাল:</td>
                <td style="padding: 8px 0; text-align: right;">৳${data.subtotal.toFixed(2)}</td>
              </tr>
              ${data.tax_amount > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">ট্যাক্স:</td>
                <td style="padding: 8px 0; text-align: right;">৳${data.tax_amount.toFixed(2)}</td>
              </tr>
              ` : ''}
              ${data.shipping_cost > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">শিপিং:</td>
                <td style="padding: 8px 0; text-align: right;">৳${data.shipping_cost.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #e2e8f0;">
                <td style="padding: 12px 0; font-weight: bold; font-size: 18px; color: #7c3aed;">মোট:</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; color: #7c3aed;">৳${data.total_amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          ${data.notes ? `
          <!-- Notes -->
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
            <strong style="color: #92400e;">📝 নোট:</strong>
            <p style="margin: 10px 0 0 0; color: #78350f;">${data.notes}</p>
          </div>
          ` : ''}

          <!-- Contact Info -->
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #86efac;">
            <h4 style="margin: 0 0 10px 0; color: #166534;">📞 যোগাযোগ</h4>
            <p style="margin: 5px 0; color: #166534;">
              <strong>${data.company_info.name}</strong><br>
              ${data.company_info.email ? `✉️ ${data.company_info.email}<br>` : ''}
              ${data.company_info.phone ? `📱 ${data.company_info.phone}` : ''}
            </p>
          </div>

          <p style="margin-top: 25px; color: #64748b; font-size: 14px;">
            অনুগ্রহ করে এই অর্ডার নিশ্চিত করতে আমাদের সাথে যোগাযোগ করুন।
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} FishCare BD। সর্বস্বত্ব সংরক্ষিত।</p>
          <p style="margin: 5px 0 0 0;">এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।</p>
        </div>
      </body>
      </html>
    `
  };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting send-purchase-order-email function");

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
        JSON.stringify({ success: false, message: "ইমেইল নোটিফিকেশন নিষ্ক্রিয়। অ্যাডমিন সেটিংস থেকে SMTP কনফিগার করুন।" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const settings = smtpSettings as SmtpSettings;

    if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_password) {
      console.log("SMTP settings incomplete");
      return new Response(
        JSON.stringify({ success: false, message: "SMTP সেটিংস অসম্পূর্ণ" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRequest: PurchaseOrderEmailRequest = await req.json();
    console.log("Received email request for order:", emailRequest.order_number);

    if (!emailRequest.supplier_email || !emailRequest.order_number) {
      throw new Error("সাপ্লায়ার ইমেইল এবং অর্ডার নম্বর প্রয়োজন");
    }

    const { subject, html } = generatePurchaseOrderEmailHtml(emailRequest);

    console.log(`Sending purchase order email to ${emailRequest.supplier_email}`);

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
      to: emailRequest.supplier_email,
      subject: subject,
      content: "Please view this email in an HTML-capable email client.",
      html: html,
    });

    await client.close();

    // Log email
    await supabaseClient.from("email_logs").insert({
      order_number: emailRequest.order_number,
      recipient_email: emailRequest.supplier_email,
      subject,
      template_type: "purchase_order",
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    console.log(`Purchase order email sent successfully to ${emailRequest.supplier_email}`);

    return new Response(
      JSON.stringify({ success: true, message: "ইমেইল সফলভাবে পাঠানো হয়েছে" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error sending purchase order email:", error);
    
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
        recipient_email: body.supplier_email || "unknown",
        subject: "Purchase Order - Failed",
        template_type: "purchase_order",
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
