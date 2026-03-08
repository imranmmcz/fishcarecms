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

    // Get RedX settings
    const { data: settings } = await supabase
      .from("courier_settings")
      .select("*")
      .eq("courier_name", "redx")
      .single();

    const { action, ...body } = await req.json();
    let result;

    switch (action) {
      case "track_parcel": {
        const { tracking_id } = body;
        if (!tracking_id) {
          return new Response(JSON.stringify({ error: "Tracking ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (settings?.api_key) {
          try {
            const response = await fetch(
              `${settings.base_url || "https://openapi.redx.com.bd/v1.0.0-beta"}/parcel/track/${tracking_id}`,
              {
                method: "GET",
                headers: {
                  "API-ACCESS-TOKEN": `Bearer ${settings.api_key}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              result = {
                success: true,
                tracking: {
                  tracking_id,
                  status: data.parcel?.parcel_status || data.status || "unknown",
                  status_bn: getStatusBn(data.parcel?.parcel_status || data.status || "unknown"),
                  area: data.parcel?.customer_area || null,
                  created_at: data.parcel?.created_at || null,
                  raw: data,
                },
              };
            } else {
              const errData = await response.text();
              result = {
                success: false,
                message: `RedX API ত্রুটি: ${response.status}`,
                tracking_url: `https://redx.com.bd/track-parcel/?trackingId=${tracking_id}`,
              };
            }
          } catch (fetchErr) {
            result = {
              success: false,
              message: "RedX API-এর সাথে সংযোগ করা যায়নি।",
              tracking_url: `https://redx.com.bd/track-parcel/?trackingId=${tracking_id}`,
            };
          }
        } else {
          result = {
            success: false,
            message: "API Token সেট করা হয়নি। RedX ওয়েবসাইটে ট্র্যাক করুন।",
            tracking_url: `https://redx.com.bd/track-parcel/?trackingId=${tracking_id}`,
          };
        }
        break;
      }

      case "create_parcel": {
        if (!settings?.api_key) {
          // Manual booking
          const { order_id, invoice, recipient_name, recipient_phone, recipient_address, recipient_area, cod_amount, weight, note } = body;

          await supabase.from("steadfast_consignments").insert({
            order_id,
            invoice,
            status: "booked_manually",
            delivery_status: "pending",
            cod_amount: cod_amount || 0,
            recipient_name,
            recipient_phone,
            recipient_address,
            note: `[RedX কুরিয়ার] ${note || ""} | এলাকা: ${recipient_area} | ওজন: ${weight}kg`,
            api_response: { courier: "redx", manual: true },
          });

          result = {
            success: true,
            manual: true,
            message: "ম্যানুয়াল বুকিং রেকর্ড সংরক্ষিত। RedX মার্চেন্ট প্যানেল থেকে পার্সেল তৈরি করুন।",
          };
          break;
        }

        // API-based parcel creation
        const { recipient_name, recipient_phone, recipient_address, recipient_area, cod_amount, weight, note, order_id, invoice } = body;

        try {
          const response = await fetch(
            `${settings.base_url || "https://openapi.redx.com.bd/v1.0.0-beta"}/parcel`,
            {
              method: "POST",
              headers: {
                "API-ACCESS-TOKEN": `Bearer ${settings.api_key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                customer_name: recipient_name,
                customer_phone: recipient_phone,
                delivery_area: recipient_area,
                delivery_area_id: null,
                customer_address: recipient_address,
                merchant_invoice_id: invoice,
                cash_collection_amount: String(cod_amount || 0),
                parcel_weight: weight || 500,
                instruction: note || "",
                value: String(cod_amount || 0),
              }),
            }
          );

          const data = await response.json();

          if (response.ok && data.tracking_id) {
            // Save consignment record
            await supabase.from("steadfast_consignments").insert({
              order_id,
              invoice,
              consignment_id: String(data.tracking_id),
              tracking_code: String(data.tracking_id),
              status: "created",
              delivery_status: "pending",
              cod_amount: cod_amount || 0,
              recipient_name,
              recipient_phone,
              recipient_address,
              note: `[RedX] ${note || ""}`,
              api_response: { courier: "redx", ...data },
            });

            // Update order with tracking info
            await supabase
              .from("orders")
              .update({
                courier_name: "RedX",
                tracking_number: String(data.tracking_id),
                tracking_url: `https://redx.com.bd/track-parcel/?trackingId=${data.tracking_id}`,
              })
              .eq("id", order_id);

            result = { success: true, tracking_id: data.tracking_id, data };
          } else {
            result = { success: false, message: data.message || "পার্সেল তৈরি ব্যর্থ", data };
          }
        } catch (fetchErr) {
          result = { success: false, message: "RedX API-এর সাথে সংযোগ করা যায়নি।" };
        }
        break;
      }

      case "get_areas": {
        if (!settings?.api_key) {
          result = { success: false, message: "API Token প্রয়োজন" };
          break;
        }

        try {
          const response = await fetch(
            `${settings.base_url || "https://openapi.redx.com.bd/v1.0.0-beta"}/areas`,
            {
              method: "GET",
              headers: {
                "API-ACCESS-TOKEN": `Bearer ${settings.api_key}`,
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();
          result = { success: true, areas: data.areas || data };
        } catch (fetchErr) {
          result = { success: false, message: "এলাকা তথ্য আনতে সমস্যা" };
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
    console.error("RedX courier error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getStatusBn(status: string): string {
  const statusMap: Record<string, string> = {
    "Pending": "অপেক্ষমাণ",
    "pending": "অপেক্ষমাণ",
    "Picked Up": "পিকআপ হয়েছে",
    "picked_up": "পিকআপ হয়েছে",
    "In Transit": "ট্রানজিটে",
    "in_transit": "ট্রানজিটে",
    "Delivered": "ডেলিভার্ড",
    "delivered": "ডেলিভার্ড",
    "Returned": "রিটার্ন",
    "returned": "রিটার্ন",
    "Cancelled": "বাতিল",
    "cancelled": "বাতিল",
    "On Hold": "হোল্ডে আছে",
    "on_hold": "হোল্ডে আছে",
    "unknown": "অজানা",
  };
  return statusMap[status] || status;
}
