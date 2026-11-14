import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type LoginRequest = {
  email?: unknown;
  password?: unknown;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json()) as LoginRequest;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "A valid email address is required" }, 400);
    }
    if (password.length < 6 || password.length > 1024) {
      return jsonResponse({ error: "Invalid email or password" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: "Sign-in service is unavailable" }, 503);
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: rateLimit, error: rateLimitError } = await adminClient.rpc(
      "check_login_rate_limit",
      { check_email: email },
    );
    if (rateLimitError) {
      console.error("Secure login rate check failed");
      return jsonResponse({ error: "Sign-in service is unavailable" }, 503);
    }
    if (rateLimit?.locked) {
      return jsonResponse({
        error: `অনেক বেশি ভুল চেষ্টা। ${rateLimit.remaining_minutes} মিনিট পর আবার চেষ্টা করুন।`,
        locked: true,
        remaining_minutes: rateLimit.remaining_minutes,
      }, 429);
    }

    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    let blocked = false;
    if (!error && data.user) {
      const { data: isBlocked, error: blockCheckError } = await adminClient.rpc(
        "is_user_blocked",
        { check_user_id: data.user.id },
      );
      if (blockCheckError) {
        console.error("Secure login account status check failed");
        return jsonResponse({ error: "Sign-in service is unavailable" }, 503);
      }
      blocked = isBlocked === true;
    }
    const forwardedIp = req.headers.get("cf-connecting-ip");
    const { error: logError } = await adminClient.from("login_attempts").insert({
      email,
      success: !error && !blocked,
      ip_address: forwardedIp?.slice(0, 100) ?? null,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
    if (logError) console.error("Secure login attempt could not be recorded");

    if (blocked) {
      return jsonResponse({ error: "আপনার অ্যাকাউন্ট ব্লক করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।", blocked: true }, 403);
    }
    if (error || !data.session || !data.user) {
      return jsonResponse({ error: error?.message || "Invalid email or password" }, 401);
    }

    return jsonResponse({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      user: { id: data.user.id },
    });
  } catch {
    return jsonResponse({ error: "Invalid sign-in request" }, 400);
  }
});