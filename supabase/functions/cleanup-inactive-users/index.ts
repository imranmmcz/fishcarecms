import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const warningDeadline = new Date(now.getTime() - 105 * 24 * 60 * 60 * 1000); // 90 + 15 days

    // 1. Delete users who were warned 15+ days ago (105 days inactive)
    const { data: usersToDelete, error: fetchDeleteError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email')
      .not('deletion_warning_sent_at', 'is', null)
      .lte('deletion_warning_sent_at', new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString());

    if (fetchDeleteError) {
      console.error('Error fetching users to delete:', fetchDeleteError);
    }

    const deletedUsers: string[] = [];
    if (usersToDelete && usersToDelete.length > 0) {
      for (const user of usersToDelete) {
        // Don't delete admins
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.user_id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleData) {
          console.log(`Skipping admin user: ${user.email}`);
          continue;
        }

        // Delete auth user (cascades to profiles, user_roles etc.)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.user_id);
        if (deleteError) {
          console.error(`Error deleting user ${user.user_id}:`, deleteError);
        } else {
          deletedUsers.push(user.email || user.user_id);
          console.log(`Deleted inactive user: ${user.email}`);
        }
      }
    }

    // 2. Send warnings to users inactive for 90+ days who haven't been warned yet
    const { data: usersToWarn, error: fetchWarnError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, mobile')
      .lte('last_sign_in_at', ninetyDaysAgo.toISOString())
      .is('deletion_warning_sent_at', null);

    if (fetchWarnError) {
      console.error('Error fetching users to warn:', fetchWarnError);
    }

    const warnedUsers: string[] = [];
    if (usersToWarn && usersToWarn.length > 0) {
      for (const user of usersToWarn) {
        // Don't warn admins
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.user_id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleData) continue;

        // Send in-app notification
        await supabase.from('notifications').insert({
          user_id: user.user_id,
          title: `Account Deletion Warning`,
          title_bn: `অ্যাকাউন্ট মুছে ফেলার সতর্কতা`,
          message: `Your account has been inactive for 90 days. It will be automatically deleted in 15 days if you don't log in.`,
          message_bn: `আপনার অ্যাকাউন্ট ৯০ দিন ধরে নিষ্ক্রিয় রয়েছে। আপনি লগইন না করলে ১৫ দিনের মধ্যে এটি স্বয়ংক্রিয়ভাবে মুছে ফেলা হবে।`,
          type: 'account_warning',
        });

        // Mark as warned
        await supabase
          .from('profiles')
          .update({ deletion_warning_sent_at: now.toISOString() })
          .eq('user_id', user.user_id);

        warnedUsers.push(user.email || user.user_id);
        console.log(`Warned inactive user: ${user.email}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      warned: warnedUsers.length,
      deleted: deletedUsers.length,
      warnedUsers,
      deletedUsers,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
