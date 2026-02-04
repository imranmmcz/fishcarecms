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

    const adminEmail = "admin@fishcare.com";
    const adminPassword = "admin123";

    // Check if admin user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = existingUsers?.users?.find(
      (user) => user.email === adminEmail
    );

    if (adminUser) {
      // Check if user already has admin role
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("*")
        .eq("user_id", adminUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ 
            message: "Admin user already exists", 
            success: true,
            email: adminEmail,
            password: adminPassword 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Add admin role to existing user
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: adminUser.id, role: "admin" });

      return new Response(
        JSON.stringify({ 
          message: "Admin role added to existing user", 
          success: true,
          email: adminEmail,
          password: adminPassword 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "এডমিন",
      },
    });

    if (error) {
      throw error;
    }

    // Add admin role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ 
        user_id: data.user?.id, 
        role: "admin" 
      }, { onConflict: "user_id,role" });

    return new Response(
      JSON.stringify({ 
        message: "Admin user created successfully", 
        success: true,
        email: adminEmail,
        password: adminPassword,
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
