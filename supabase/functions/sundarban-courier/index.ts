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

    const { action, ...body } = await req.json();

    let result;

    switch (action) {
      case "track_parcel": {
        const { tracking_number } = body;

        if (!tracking_number) {
          return new Response(JSON.stringify({ error: "Tracking number required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Try the known SCS tracking server
        try {
          const response = await fetch(
            `http://103.3.227.172:4040/tracking?id=${encodeURIComponent(tracking_number)}`,
            {
              method: "GET",
              headers: { "Accept": "application/json" },
            }
          );

          if (response.ok) {
            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              const data = await response.json();
              result = {
                success: true,
                tracking: {
                  tracking_number,
                  status: data.status || data.Status || "unknown",
                  status_bn: getStatusBn(data.status || data.Status || "unknown"),
                  booking_date: data.booking_date || data.BookingDate || null,
                  from: data.from || data.BookingFrom || null,
                  destination: data.destination || data.Destination || null,
                  raw: data,
                },
              };
            } else {
              // HTML or other response - parse what we can
              const text = await response.text();
              result = {
                success: true,
                tracking: {
                  tracking_number,
                  status: "check_website",
                  status_bn: "ওয়েবসাইটে দেখুন",
                  message: "বিস্তারিত তথ্যের জন্য সুন্দরবন কুরিয়ারের ওয়েবসাইট ভিজিট করুন",
                  tracking_url: `https://sundarbancourier.com/tracking?tracking_id=${tracking_number}`,
                },
              };
            }
          } else {
            result = {
              success: false,
              message: "ট্র্যাকিং সার্ভারে সমস্যা। ওয়েবসাইটে চেক করুন।",
              tracking_url: `https://sundarbancourier.com/tracking?tracking_id=${tracking_number}`,
            };
          }
        } catch (fetchErr) {
          // Tracking server may not be accessible - provide fallback
          result = {
            success: false,
            message: "ট্র্যাকিং সার্ভারের সাথে সংযোগ করা যায়নি। সরাসরি ওয়েবসাইটে চেক করুন।",
            tracking_url: `https://sundarbancourier.com/tracking?tracking_id=${tracking_number}`,
          };
        }
        break;
      }

      case "create_booking": {
        // Get Sundarban credentials from DB
        const { data: settings } = await supabase
          .from("courier_settings")
          .select("*")
          .eq("courier_name", "sundarban")
          .single();

        if (!settings || !settings.api_key) {
          // Manual booking - just save the record
          const {
            order_id, invoice, recipient_name, recipient_phone,
            recipient_address, recipient_city, recipient_zone,
            cod_amount, weight, note,
          } = body;

          // Save booking record
          await supabase.from("steadfast_consignments").insert({
            order_id,
            invoice,
            status: "booked_manually",
            delivery_status: "pending",
            cod_amount: cod_amount || 0,
            recipient_name,
            recipient_phone,
            recipient_address,
            note: `[সুন্দরবন কুরিয়ার] ${note || ""} | শহর: ${recipient_city} | জোন: ${recipient_zone} | ওজন: ${weight}kg`,
            api_response: { courier: "sundarban", manual: true },
          });

          result = {
            success: true,
            manual: true,
            message: "ম্যানুয়াল বুকিং রেকর্ড সংরক্ষিত হয়েছে। সুন্দরবন শাখায় গিয়ে পার্সেল বুক করুন এবং ট্র্যাকিং নম্বর আপডেট করুন।",
          };
          break;
        }

        // If API key exists, try API booking (future implementation)
        result = {
          success: false,
          message: "সুন্দরবন কুরিয়ার API বুকিং এখনো সাপোর্ট করা হয়নি। ম্যানুয়ালি বুকিং করুন।",
        };
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
    console.error("Sundarban courier error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getStatusBn(status: string): string {
  const statusMap: Record<string, string> = {
    "Booked": "বুকড",
    "In Transit": "ট্রানজিটে",
    "in_transit": "ট্রানজিটে",
    "Delivered": "ডেলিভার্ড",
    "delivered": "ডেলিভার্ড",
    "Returned": "রিটার্ন",
    "returned": "রিটার্ন",
    "Pending": "অপেক্ষমাণ",
    "pending": "অপেক্ষমাণ",
    "unknown": "অজানা",
    "check_website": "ওয়েবসাইটে দেখুন",
  };
  return statusMap[status] || status;
}
