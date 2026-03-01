import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { phone, message, message_type = "general", order_number } = await req.json();

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "phone and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get SMS settings
    const { data: settings, error: settingsError } = await supabase
      .from("sms_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settingsError || !settings) {
      throw new Error("SMS settings not found");
    }

    if (!settings.is_enabled) {
      // Log but don't send
      await supabase.from("sms_logs").insert({
        recipient_phone: phone,
        message,
        status: "skipped",
        message_type,
        order_number,
        provider: settings.provider,
      });
      return new Response(JSON.stringify({ success: false, reason: "SMS service disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!settings.api_key || !settings.api_url) {
      throw new Error("SMS API key or URL not configured");
    }

    // Build request based on provider
    let apiResponse;
    const cleanPhone = phone.replace(/[^0-9+]/g, "");

    if (settings.provider === "bulksmsbd") {
      const params = new URLSearchParams({
        api_key: settings.api_key,
        senderid: settings.sender_id || "",
        number: cleanPhone,
        message: message,
        type: "text",
      });
      apiResponse = await fetch(`${settings.api_url}?${params.toString()}`);
    } else if (settings.provider === "greenweb") {
      const params = new URLSearchParams({
        token: settings.api_key,
        to: cleanPhone,
        message: message,
      });
      apiResponse = await fetch(`${settings.api_url}?${params.toString()}`);
    } else {
      // Generic POST for custom/other providers
      apiResponse = await fetch(settings.api_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.api_key}`,
        },
        body: JSON.stringify({
          to: cleanPhone,
          message,
          sender_id: settings.sender_id,
        }),
      });
    }

    const responseText = await apiResponse.text();
    const isSuccess = apiResponse.ok;

    // Log the SMS
    await supabase.from("sms_logs").insert({
      recipient_phone: cleanPhone,
      message,
      status: isSuccess ? "sent" : "failed",
      message_type,
      order_number,
      provider: settings.provider,
      api_response: responseText,
      error_message: isSuccess ? null : responseText,
      sent_at: isSuccess ? new Date().toISOString() : null,
    });

    return new Response(
      JSON.stringify({ success: isSuccess, response: responseText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("SMS Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
