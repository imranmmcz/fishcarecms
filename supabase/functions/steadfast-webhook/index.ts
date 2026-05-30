import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify webhook secret to prevent spoofed delivery events
  const expected = Deno.env.get("STEADFAST_WEBHOOK_SECRET");
  const provided = req.headers.get("x-steadfast-secret") || req.headers.get("x-webhook-secret");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse webhook payload from Steadfast
    const payload = await req.json();
    console.log("Steadfast webhook received:", JSON.stringify(payload));

    // Steadfast sends: { consignment_id, tracking_code, status, invoice, ... }
    const {
      consignment_id,
      tracking_code,
      status: deliveryStatus,
      invoice,
    } = payload;

    if (!consignment_id && !tracking_code && !invoice) {
      return new Response(
        JSON.stringify({ error: "Missing identifier (consignment_id, tracking_code, or invoice)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the consignment record
    let query = supabase.from("steadfast_consignments").select("*");

    if (consignment_id) {
      query = query.eq("consignment_id", String(consignment_id));
    } else if (tracking_code) {
      query = query.eq("tracking_code", tracking_code);
    } else if (invoice) {
      query = query.eq("invoice", invoice);
    }

    const { data: consignment, error: findError } = await query.single();

    if (findError || !consignment) {
      console.log("Consignment not found for webhook payload:", payload);
      return new Response(
        JSON.stringify({ error: "Consignment not found", received: payload }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map Steadfast status to our delivery_status
    const statusMap: Record<string, string> = {
      "in_review": "in_review",
      "pending": "pending",
      "delivered": "delivered",
      "partial_delivered": "partial_delivered",
      "cancelled": "cancelled",
      "hold": "hold",
      "unknown": "unknown",
    };

    const mappedStatus = deliveryStatus
      ? statusMap[deliveryStatus] || deliveryStatus
      : consignment.delivery_status;

    // Update consignment record
    const { error: updateError } = await supabase
      .from("steadfast_consignments")
      .update({
        delivery_status: mappedStatus,
        api_response: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", consignment.id);

    if (updateError) {
      console.error("Failed to update consignment:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update consignment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-update order status based on delivery status
    if (consignment.order_id) {
      let orderStatus: string | null = null;

      if (mappedStatus === "delivered") {
        orderStatus = "delivered";
      } else if (mappedStatus === "cancelled") {
        orderStatus = "cancelled";
      } else if (mappedStatus === "hold") {
        orderStatus = "on_hold";
      } else if (mappedStatus === "partial_delivered") {
        orderStatus = "partial_delivered";
      }

      if (orderStatus) {
        await supabase
          .from("orders")
          .update({
            status: orderStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", consignment.order_id);

        console.log(`Order ${consignment.order_id} status updated to ${orderStatus}`);
      }
    }

    // Send email notification to customer on status change
    if (consignment.order_id && (mappedStatus === "delivered" || mappedStatus === "cancelled" || mappedStatus === "partial_delivered")) {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("customer_email, customer_name, order_number, customer_phone")
          .eq("id", consignment.order_id)
          .single();

        if (order?.customer_email) {
          const statusLabels: Record<string, string> = {
            delivered: "ডেলিভারড",
            cancelled: "বাতিল",
            partial_delivered: "আংশিক ডেলিভারড",
          };

          // Get SMTP settings
          const { data: smtpSettings } = await supabase
            .from("smtp_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (smtpSettings?.is_enabled && smtpSettings.smtp_host && smtpSettings.smtp_user && smtpSettings.smtp_password) {
            const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

            const statusLabel = statusLabels[mappedStatus] || mappedStatus;
            const subject = `অর্ডার আপডেট - ${order.order_number} - ${statusLabel}`;
            const html = `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .status-box { background: #f0fdf4; padding: 15px; border-radius: 12px; margin: 15px 0; border: 2px solid #10b981; text-align: center; }
                .status-text { font-size: 20px; font-weight: bold; color: #059669; }
                .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
              </style>
              </head>
              <body>
                <div class="header">
                  <h1>📦 ডেলিভারি আপডেট</h1>
                </div>
                <div class="content">
                  <p>প্রিয় ${order.customer_name},</p>
                  <p>আপনার অর্ডারের ডেলিভারি স্ট্যাটাস আপডেট হয়েছে।</p>
                  <div class="status-box">
                    <p><strong>অর্ডার নম্বর:</strong> ${order.order_number}</p>
                    ${consignment.tracking_code ? `<p><strong>ট্র্যাকিং কোড:</strong> ${consignment.tracking_code}</p>` : ''}
                    <p class="status-text">${statusLabel}</p>
                  </div>
                  ${mappedStatus === 'delivered' ? '<p>আপনার পণ্য সফলভাবে ডেলিভারি হয়েছে। ধন্যবাদ আমাদের সাথে থাকার জন্য! 🎉</p>' : ''}
                  ${mappedStatus === 'cancelled' ? '<p>দুঃখিত, আপনার অর্ডার বাতিল হয়েছে। বিস্তারিত জানতে আমাদের সাথে যোগাযোগ করুন।</p>' : ''}
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} FishCare BD। সর্বস্বত্ব সংরক্ষিত।</p>
                </div>
              </body>
              </html>
            `;

            const client = new SMTPClient({
              connection: {
                hostname: smtpSettings.smtp_host,
                port: smtpSettings.smtp_port,
                tls: smtpSettings.smtp_secure,
                auth: { username: smtpSettings.smtp_user, password: smtpSettings.smtp_password },
              },
            });

            await client.send({
              from: `${smtpSettings.smtp_from_name} <${smtpSettings.smtp_from_email}>`,
              to: order.customer_email,
              subject,
              content: "Please view this email in an HTML-capable email client.",
              html,
            });
            await client.close();

            // Log email
            await supabase.from("email_logs").insert({
              order_number: order.order_number,
              recipient_email: order.customer_email,
              subject,
              template_type: "delivery_update",
              status: "sent",
              sent_at: new Date().toISOString(),
            });

            console.log(`Delivery notification email sent to ${order.customer_email}`);
          }
        }
      } catch (emailError) {
        console.error("Failed to send delivery notification email:", emailError);
      }

      // Send WhatsApp notification
      try {
        const { data: waOrder } = await supabase
          .from("orders")
          .select("customer_phone, customer_name, order_number")
          .eq("id", consignment.order_id)
          .single();

        if (waOrder?.customer_phone) {
          const { data: waSettings } = await supabase
            .from("whatsapp_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (waSettings?.is_enabled && waSettings?.delivery_update_enabled && waSettings?.access_token && waSettings?.phone_number_id) {
            const statusLabelsWA: Record<string, string> = {
              delivered: "ডেলিভারড ✅",
              cancelled: "বাতিল ❌",
              partial_delivered: "আংশিক ডেলিভারড",
            };

            const waMessage = `📦 *ডেলিভারি আপডেট*\n\nপ্রিয় ${waOrder.customer_name},\n\nআপনার অর্ডার *${waOrder.order_number}* এর স্ট্যাটাস: *${statusLabelsWA[mappedStatus] || mappedStatus}*${consignment.tracking_code ? `\nট্র্যাকিং কোড: ${consignment.tracking_code}` : ''}\n\n${mappedStatus === 'delivered' ? 'ধন্যবাদ আমাদের সাথে থাকার জন্য! 🎉' : 'বিস্তারিত জানতে আমাদের সাথে যোগাযোগ করুন।'}\n\n— FishCare BD`;

            const apiVersion = waSettings.api_version || "v21.0";
            let formattedPhone = waOrder.customer_phone.replace(/[^0-9]/g, "");
            if (formattedPhone.startsWith("0")) formattedPhone = "88" + formattedPhone;
            else if (!formattedPhone.startsWith("88")) formattedPhone = "88" + formattedPhone;

            const waRes = await fetch(
              `https://graph.facebook.com/${apiVersion}/${waSettings.phone_number_id}/messages`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${waSettings.access_token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  to: formattedPhone,
                  type: "text",
                  text: { body: waMessage },
                }),
              }
            );

            const waData = await waRes.json();

            await supabase.from("whatsapp_logs").insert({
              order_number: waOrder.order_number,
              recipient_phone: formattedPhone,
              message_type: "delivery_update",
              whatsapp_message_id: waData.messages?.[0]?.id || null,
              status: waRes.ok ? "sent" : "failed",
              error_message: waRes.ok ? null : (waData.error?.message || "Unknown error"),
              sent_at: waRes.ok ? new Date().toISOString() : null,
            });

            console.log(`WhatsApp delivery notification ${waRes.ok ? 'sent' : 'failed'} to ${formattedPhone}`);
          }
        }
      } catch (waError) {
        console.error("Failed to send WhatsApp notification:", waError);
      }
    }

    // Log the webhook event
    console.log(
      `Webhook processed: consignment ${consignment.consignment_id} -> ${mappedStatus}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        consignment_id: consignment.consignment_id,
        new_status: mappedStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Steadfast webhook error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
