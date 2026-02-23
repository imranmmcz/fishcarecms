import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WhatsAppRequest {
  action: "send_template" | "send_text" | "test_connection";
  phone?: string;
  template_name?: string;
  template_language?: string;
  template_params?: string[];
  text_message?: string;
  order_number?: string;
  message_type?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get WhatsApp settings
    const { data: waSettings, error: settingsError } = await supabase
      .from("whatsapp_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      throw new Error("Failed to fetch WhatsApp settings");
    }

    if (!waSettings || !waSettings.is_enabled) {
      return new Response(
        JSON.stringify({ success: false, message: "WhatsApp notifications are disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!waSettings.access_token || !waSettings.phone_number_id) {
      return new Response(
        JSON.stringify({ success: false, message: "WhatsApp API credentials not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const request: WhatsAppRequest = await req.json();
    const { action } = request;
    const apiVersion = waSettings.api_version || "v21.0";
    const baseUrl = `https://graph.facebook.com/${apiVersion}/${waSettings.phone_number_id}`;

    switch (action) {
      case "test_connection": {
        // Test by fetching phone number info
        const testRes = await fetch(
          `https://graph.facebook.com/${apiVersion}/${waSettings.phone_number_id}`,
          {
            headers: { Authorization: `Bearer ${waSettings.access_token}` },
          }
        );
        const testData = await testRes.json();

        if (!testRes.ok) {
          return new Response(
            JSON.stringify({ success: false, error: testData.error?.message || "Connection failed" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              phone_number: testData.display_phone_number,
              verified_name: testData.verified_name,
              quality_rating: testData.quality_rating,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send_template": {
        const { phone, template_name, template_language, template_params, order_number, message_type } = request;

        if (!phone || !template_name) {
          throw new Error("Missing required fields: phone, template_name");
        }

        // Format phone number (ensure country code)
        const formattedPhone = formatBDPhone(phone);

        const templateBody: any = {
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "template",
          template: {
            name: template_name,
            language: { code: template_language || waSettings.template_language || "bn" },
          },
        };

        // Add template parameters if provided
        if (template_params && template_params.length > 0) {
          templateBody.template.components = [
            {
              type: "body",
              parameters: template_params.map((p) => ({
                type: "text",
                text: p,
              })),
            },
          ];
        }

        const sendRes = await fetch(`${baseUrl}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${waSettings.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateBody),
        });

        const sendData = await sendRes.json();

        // Log the message
        await supabase.from("whatsapp_logs").insert({
          order_number: order_number || null,
          recipient_phone: formattedPhone,
          message_type: message_type || "template",
          template_name,
          whatsapp_message_id: sendData.messages?.[0]?.id || null,
          status: sendRes.ok ? "sent" : "failed",
          error_message: sendRes.ok ? null : (sendData.error?.message || "Unknown error"),
          sent_at: sendRes.ok ? new Date().toISOString() : null,
        });

        if (!sendRes.ok) {
          console.error("WhatsApp API error:", sendData);
          return new Response(
            JSON.stringify({ success: false, error: sendData.error?.message || "Failed to send" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message_id: sendData.messages?.[0]?.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send_text": {
        const { phone, text_message, order_number } = request;

        if (!phone || !text_message) {
          throw new Error("Missing required fields: phone, text_message");
        }

        const formattedPhone = formatBDPhone(phone);

        const textRes = await fetch(`${baseUrl}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${waSettings.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "text",
            text: { body: text_message },
          }),
        });

        const textData = await textRes.json();

        await supabase.from("whatsapp_logs").insert({
          order_number: order_number || null,
          recipient_phone: formattedPhone,
          message_type: "text",
          whatsapp_message_id: textData.messages?.[0]?.id || null,
          status: textRes.ok ? "sent" : "failed",
          error_message: textRes.ok ? null : (textData.error?.message || "Unknown error"),
          sent_at: textRes.ok ? new Date().toISOString() : null,
        });

        if (!textRes.ok) {
          return new Response(
            JSON.stringify({ success: false, error: textData.error?.message || "Failed to send" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message_id: textData.messages?.[0]?.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("WhatsApp function error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Format Bangladesh phone number to international format
function formatBDPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "88" + cleaned;
  } else if (!cleaned.startsWith("88")) {
    cleaned = "88" + cleaned;
  }
  return cleaned;
}
