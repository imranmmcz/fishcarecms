import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Allow unauthenticated access for this specific function
  const url = new URL(req.url);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if demo user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const demoUserExists = existingUsers?.users?.some(
      (user) => user.email === "demo@fishfarm.com"
    );

    if (demoUserExists) {
      return new Response(
        JSON.stringify({ message: "Demo user already exists", success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create demo user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: "demo@fishfarm.com",
      password: "demo123",
      email_confirm: true,
      user_metadata: {
        full_name: "ডেমো ইউজার",
      },
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        message: "Demo user created successfully", 
        success: true,
        userId: data.user?.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
