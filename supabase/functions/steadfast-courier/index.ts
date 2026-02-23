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

    // Verify user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Steadfast credentials from DB
    const { data: settings } = await supabase
      .from("courier_settings")
      .select("*")
      .eq("courier_name", "steadfast")
      .single();

    if (!settings || !settings.api_key || !settings.secret_key) {
      return new Response(
        JSON.stringify({ error: "Steadfast API credentials not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const BASE_URL = settings.base_url || "https://portal.packzy.com/api/v1";
    const apiHeaders = {
      "Api-Key": settings.api_key,
      "Secret-Key": settings.secret_key,
      "Content-Type": "application/json",
    };

    const { action, ...body } = await req.json();

    let result;

    switch (action) {
      case "create_order": {
        const { order_id, invoice, recipient_name, recipient_phone, recipient_address, cod_amount, note } = body;

        const response = await fetch(`${BASE_URL}/create_order`, {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({
            invoice,
            recipient_name,
            recipient_phone,
            recipient_address,
            cod_amount: cod_amount || 0,
            note: note || "",
          }),
        });

        const data = await response.json();

        // Save consignment to DB
        if (data.status === 200 && data.consignment) {
          await supabase.from("steadfast_consignments").insert({
            order_id,
            consignment_id: String(data.consignment.consignment_id),
            tracking_code: data.consignment.tracking_code,
            invoice,
            status: "created",
            delivery_status: data.consignment.status || "in_review",
            cod_amount,
            recipient_name,
            recipient_phone,
            recipient_address,
            note,
            api_response: data,
          });

          // Update order with tracking info
          await supabase.from("orders").update({
            status: "shipped",
          }).eq("id", order_id);
        }

        result = data;
        break;
      }

      case "bulk_create_order": {
        const { orders } = body;

        const response = await fetch(`${BASE_URL}/create_order/bulk-order`, {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({ data: orders }),
        });

        const data = await response.json();
        result = data;
        break;
      }

      case "check_status_by_cid": {
        const { consignment_id } = body;

        const response = await fetch(`${BASE_URL}/status_by_cid/${consignment_id}`, {
          method: "GET",
          headers: apiHeaders,
        });

        const data = await response.json();

        // Update local record
        if (data.status === 200 && data.delivery_status) {
          await supabase
            .from("steadfast_consignments")
            .update({
              delivery_status: data.delivery_status,
              api_response: data,
            })
            .eq("consignment_id", consignment_id);
        }

        result = data;
        break;
      }

      case "check_status_by_invoice": {
        const { invoice } = body;

        const response = await fetch(`${BASE_URL}/status_by_invoice/${invoice}`, {
          method: "GET",
          headers: apiHeaders,
        });

        result = await response.json();
        break;
      }

      case "check_status_by_tracking": {
        const { tracking_code } = body;

        const response = await fetch(`${BASE_URL}/status_by_trackingcode/${tracking_code}`, {
          method: "GET",
          headers: apiHeaders,
        });

        result = await response.json();
        break;
      }

      case "get_balance": {
        const response = await fetch(`${BASE_URL}/get_balance`, {
          method: "GET",
          headers: apiHeaders,
        });

        result = await response.json();
        break;
      }

      case "fraud_check": {
        const { phone } = body;

        const response = await fetch(`${BASE_URL}/fraud_check/${phone}`, {
          method: "GET",
          headers: apiHeaders,
        });

        result = await response.json();
        break;
      }

      case "sync_all_statuses": {
        // Sync all active consignments
        const { data: consignments } = await supabase
          .from("steadfast_consignments")
          .select("*")
          .not("delivery_status", "in", '("delivered","cancelled")');

        if (consignments && consignments.length > 0) {
          const results = [];
          for (const c of consignments) {
            if (!c.consignment_id) continue;
            try {
              const response = await fetch(`${BASE_URL}/status_by_cid/${c.consignment_id}`, {
                method: "GET",
                headers: apiHeaders,
              });
              const data = await response.json();
              if (data.status === 200 && data.delivery_status) {
                await supabase
                  .from("steadfast_consignments")
                  .update({
                    delivery_status: data.delivery_status,
                    api_response: data,
                  })
                  .eq("id", c.id);

                // Auto-update order status based on delivery
                if (data.delivery_status === "delivered") {
                  await supabase.from("orders").update({ status: "delivered" }).eq("id", c.order_id);
                } else if (data.delivery_status === "cancelled") {
                  await supabase.from("orders").update({ status: "cancelled" }).eq("id", c.order_id);
                }

                results.push({ id: c.consignment_id, status: data.delivery_status });
              }
            } catch (e) {
              results.push({ id: c.consignment_id, error: String(e) });
            }
          }
          result = { synced: results.length, results };
        } else {
          result = { synced: 0, message: "No active consignments" };
        }
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Steadfast courier error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
