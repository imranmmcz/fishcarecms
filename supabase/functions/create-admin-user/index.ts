import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // REQUIRE caller to be an authenticated admin — no anonymous fallback
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Authentication required", success: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser } } = await supabaseAdmin.auth.getUser(token);
    if (!callerUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token", success: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!callerRole) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required", success: false }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password, full_name, mobile, role } = body;

    // If no email/password provided, use the default admin creation flow
    const targetEmail = email || "admin@fishcare.com";
    const targetPassword = password || "admin123";
    const targetFullName = full_name || "এডমিন";
    const targetRole = role || "admin";
    const targetMobile = mobile || null;

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (user) => user.email === targetEmail
    );

    if (existingUser) {
      if (email) {
        // Dynamic creation - user already exists
        return new Response(
          JSON.stringify({ error: "এই ইমেইলে একজন ব্যবহারকারী ইতিমধ্যে আছে", success: false }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Default admin flow - check/add role
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("*")
        .eq("user_id", existingUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ message: "Admin user already exists", success: true, email: targetEmail, password: targetPassword }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabaseAdmin.from("user_roles").insert({ user_id: existingUser.id, role: "admin" });

      return new Response(
        JSON.stringify({ message: "Admin role added to existing user", success: true, email: targetEmail, password: targetPassword }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: targetEmail,
      password: targetPassword,
      email_confirm: true,
      user_metadata: {
        full_name: targetFullName,
        mobile: targetMobile,
        role_type: targetRole,
      },
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        message: `${targetRole} user created successfully`,
        success: true,
        email: targetEmail,
        userId: data.user?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
