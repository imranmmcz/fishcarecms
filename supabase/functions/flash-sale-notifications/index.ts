import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require cron secret OR admin JWT
  const cronSecret = req.headers.get('x-cron-secret');
  const expected = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization');
  let allowed = expected && cronSecret === expected;
  if (!allowed && authHeader?.startsWith('Bearer ')) {
    try {
      const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { data: { user } } = await sb.auth.getUser(authHeader.replace('Bearer ', ''));
      if (user) {
        const { data: role } = await sb.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
        allowed = !!role;
      }
    } catch (_) { /* noop */ }
  }
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();

    // Find flash sales that ended but notification not sent yet
    const { data: endedSales, error: salesError } = await supabase
      .from("flash_sales")
      .select("id, title, title_bn, end_time")
      .eq("is_active", true)
      .eq("end_notification_sent", false)
      .lt("end_time", now);

    if (salesError) throw salesError;

    if (!endedSales || endedSales.length === 0) {
      return new Response(
        JSON.stringify({ message: "No ended flash sales to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all user IDs from profiles
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("user_id");

    if (usersError) throw usersError;

    let totalNotifications = 0;

    for (const sale of endedSales) {
      // Create notification for each user
      const notifications = (users || []).map((u: any) => ({
        user_id: u.user_id,
        title: `Flash Sale Ended: ${sale.title}`,
        title_bn: `ফ্ল্যাশ সেল শেষ: ${sale.title_bn || sale.title}`,
        message: `The flash sale "${sale.title}" has ended. Stay tuned for more deals!`,
        message_bn: `"${sale.title_bn || sale.title}" ফ্ল্যাশ সেল শেষ হয়েছে। নতুন অফারের জন্য অপেক্ষা করুন!`,
        type: "flash_sale",
        reference_id: sale.id,
        reference_type: "flash_sale",
      }));

      if (notifications.length > 0) {
        // Insert in batches of 100
        for (let i = 0; i < notifications.length; i += 100) {
          const batch = notifications.slice(i, i + 100);
          const { error: insertError } = await supabase
            .from("notifications")
            .insert(batch);
          if (insertError) console.error("Batch insert error:", insertError);
        }
        totalNotifications += notifications.length;
      }

      // Mark as notified
      await supabase
        .from("flash_sales")
        .update({ end_notification_sent: true, is_active: false })
        .eq("id", sale.id);
    }

    return new Response(
      JSON.stringify({
        message: `Sent ${totalNotifications} notifications for ${endedSales.length} ended flash sales`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
