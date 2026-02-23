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
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
