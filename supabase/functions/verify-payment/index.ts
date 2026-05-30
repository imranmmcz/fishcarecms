import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyPaymentRequest {
  order_id: string;
  payment_method: "bkash" | "nagad";
  transaction_id: string;
  sender_number: string;
  amount: number;
}

// ========== bKash Merchant API ==========
async function getBkashToken(settings: Record<string, string>): Promise<string | null> {
  const baseUrl = settings.bkash_api_environment === "production"
    ? "https://tokenized.pay.bka.sh/v1.2.0-beta"
    : "https://tokenized.sandbox.bka.sh/v1.2.0-beta";

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        username: settings.bkash_username || "",
        password: settings.bkash_password || "",
      },
      body: JSON.stringify({
        app_key: settings.bkash_app_key || "",
        app_secret: settings.bkash_app_secret || "",
      }),
    });
    const data = await res.json();
    return data.id_token || null;
  } catch (err) {
    console.error("bKash token error:", err);
    return null;
  }
}

async function verifyBkashPayment(
  settings: Record<string, string>,
  trxId: string,
): Promise<{ verified: boolean; data?: any; error?: string }> {
  // Check if merchant API is enabled
  if (settings.bkash_merchant_api_enabled !== "true") {
    return { verified: false, error: "bKash Merchant API is not enabled" };
  }

  const token = await getBkashToken(settings);
  if (!token) {
    return { verified: false, error: "Failed to get bKash token" };
  }

  const baseUrl = settings.bkash_api_environment === "production"
    ? "https://tokenized.pay.bka.sh/v1.2.0-beta"
    : "https://tokenized.sandbox.bka.sh/v1.2.0-beta";

  try {
    const res = await fetch(`${baseUrl}/tokenized/checkout/payment/search/${trxId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        "X-APP-Key": settings.bkash_app_key || "",
      },
    });

    const data = await res.json();

    if (data.statusCode === "0000" && data.transactionStatus === "Completed") {
      return { verified: true, data };
    }

    return { verified: false, data, error: data.statusMessage || "Transaction not completed" };
  } catch (err) {
    console.error("bKash verify error:", err);
    return { verified: false, error: String(err) };
  }
}

// ========== Nagad Merchant API ==========
async function verifyNagadPayment(
  settings: Record<string, string>,
  trxId: string,
): Promise<{ verified: boolean; data?: any; error?: string }> {
  if (settings.nagad_merchant_api_enabled !== "true") {
    return { verified: false, error: "Nagad Merchant API is not enabled" };
  }

  const baseUrl = settings.nagad_api_environment === "production"
    ? "https://api.mynagad.com"
    : "https://sandbox.mynagad.com";

  try {
    // Nagad verification endpoint
    const res = await fetch(
      `${baseUrl}/api/dfs/verify/payment/${trxId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-KM-Api-Version": "v-0.2.0",
          "X-KM-IP-V4": "127.0.0.1",
          "X-KM-Client-Type": "PC_WEB",
        },
      },
    );

    const data = await res.json();

    if (data.status === "Success") {
      return { verified: true, data };
    }

    return { verified: false, data, error: data.message || "Transaction not verified" };
  } catch (err) {
    console.error("Nagad verify error:", err);
    return { verified: false, error: String(err) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Require authenticated caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user: caller } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!caller) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: VerifyPaymentRequest = await req.json();
    const { order_id, payment_method, transaction_id, sender_number, amount } = body;

    if (!order_id || !payment_method || !transaction_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify caller owns this order (or is admin)
    const { data: orderRow } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, transaction_id")
      .eq("id", order_id)
      .maybeSingle();
    if (!orderRow) {
      return new Response(JSON.stringify({ success: false, error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: adminRole } = await supabase
      .from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
    if (orderRow.user_id && orderRow.user_id !== caller.id && !adminRole) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Reject reused transaction IDs (idempotency)
    const { data: existingTx } = await supabase
      .from("orders").select("id").eq("transaction_id", transaction_id).neq("id", order_id).maybeSingle();
    if (existingTx) {
      return new Response(JSON.stringify({ success: false, error: "Transaction ID already used" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get merchant API settings from system_settings
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("setting_key, setting_value")
      .like("setting_key", `${payment_method === "bkash" ? "bkash" : "nagad"}_%`);

    const settings: Record<string, string> = {};
    settingsData?.forEach((s: any) => {
      settings[s.setting_key] = s.setting_value || "";
    });

    let result: { verified: boolean; data?: any; error?: string };

    if (payment_method === "bkash") {
      result = await verifyBkashPayment(settings, transaction_id);
    } else if (payment_method === "nagad") {
      result = await verifyNagadPayment(settings, transaction_id);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Unsupported payment method" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (result.verified) {
      // Verify amount matches
      const apiAmount = parseFloat(result.data?.amount || result.data?.totalAmount || "0");
      const amountMatches = Math.abs(apiAmount - amount) < 1; // Allow ১ টাকা tolerance

      // Verify sender number matches
      const apiSender = result.data?.customerMsisdn || result.data?.senderNumber || "";
      const senderMatches = apiSender.includes(sender_number.replace(/^0/, "")) ||
        sender_number.includes(apiSender.replace(/^880/, ""));

      if (amountMatches && senderMatches) {
        // Auto-approve: update order payment_status to 'paid' and status to 'processing'
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order_id);

        return new Response(
          JSON.stringify({
            success: true,
            verified: true,
            message: "Payment verified and approved",
            api_data: result.data,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } else {
        // Transaction found but amount/number mismatch
        return new Response(
          JSON.stringify({
            success: true,
            verified: false,
            message: "Transaction found but amount or sender number does not match",
            amount_match: amountMatches,
            sender_match: senderMatches,
            api_data: result.data,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          verified: false,
          message: result.error || "Payment not verified",
          api_data: result.data,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (err) {
    console.error("Verify payment error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
