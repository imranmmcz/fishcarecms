import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

async function uploadToGoogleDrive(accessToken: string, fileName: string, content: string): Promise<{ id: string; webViewLink: string }> {
  const metadata = { name: fileName, mimeType: 'application/json' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'application/json' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Drive upload failed: ${err}`);
  }

  return await res.json();
}

async function deleteFromGoogleDrive(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404) {
    console.error('Failed to delete Drive file:', fileId);
  }
}

async function sendBackupNotificationEmail(
  adminSupabase: any,
  status: 'success' | 'failed',
  details: {
    fileName?: string;
    fileSize?: number;
    scope?: string;
    errorMessage?: string;
    driveUploaded?: boolean;
    cleanupDeleted?: number;
    retentionDeleted?: number;
  }
) {
  try {
    // Get SMTP settings
    const { data: smtpSettings } = await adminSupabase
      .from('smtp_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!smtpSettings?.is_enabled || !smtpSettings.smtp_host || !smtpSettings.smtp_user || !smtpSettings.smtp_password) {
      console.log('SMTP not configured, skipping backup notification email');
      return;
    }

    // Get admin emails
    const { data: adminRoles } = await adminSupabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles || adminRoles.length === 0) return;

    const adminUserIds = adminRoles.map((r: any) => r.user_id);
    const { data: adminProfiles } = await adminSupabase
      .from('profiles')
      .select('email')
      .in('user_id', adminUserIds);

    const adminEmails = (adminProfiles || [])
      .map((p: any) => p.email)
      .filter((e: string | null) => e);

    if (adminEmails.length === 0) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('bn-BD');

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isSuccess = status === 'success';
    const subject = isSuccess
      ? `✅ ব্যাকআপ সফল - ${details.fileName || 'System Backup'}`
      : `❌ ব্যাকআপ ব্যর্থ - ${dateStr}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: ${isSuccess ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'}; color: white; padding: 20px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { padding: 20px; background: #fff; }
          .info-box { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${isSuccess ? '#10b981' : '#ef4444'}; }
          .stat { display: inline-block; background: #f1f5f9; padding: 8px 14px; border-radius: 6px; margin: 4px; font-size: 14px; }
          .footer { background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 12px 12px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .badge-success { background: #dcfce7; color: #166534; }
          .badge-error { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${isSuccess ? '✅ ব্যাকআপ সফল' : '❌ ব্যাকআপ ব্যর্থ'}</h2>
          <p>${dateStr} - ${timeStr}</p>
        </div>
        <div class="content">
          ${isSuccess ? `
            <div class="info-box">
              <p><strong>📁 ফাইলের নাম:</strong> ${details.fileName}</p>
              <p><strong>📦 ফাইল সাইজ:</strong> ${details.fileSize ? formatSize(details.fileSize) : 'N/A'}</p>
              <p><strong>🔄 স্কোপ:</strong> <span class="badge badge-success">${details.scope || 'system'}</span></p>
              <p><strong>☁️ Google Drive:</strong> ${details.driveUploaded ? '✅ আপলোড হয়েছে' : '⚠️ লোকালে সংরক্ষিত'}</p>
            </div>
            ${(details.cleanupDeleted || 0) > 0 || (details.retentionDeleted || 0) > 0 ? `
              <div class="info-box">
                <p><strong>🧹 স্বয়ংক্রিয় ক্লিনআপ:</strong></p>
                ${(details.cleanupDeleted || 0) > 0 ? `<span class="stat">📊 সংখ্যা/সাইজ লিমিট: ${details.cleanupDeleted}টি মুছা হয়েছে</span>` : ''}
                ${(details.retentionDeleted || 0) > 0 ? `<span class="stat">📅 রিটেনশন পলিসি: ${details.retentionDeleted}টি মুছা হয়েছে</span>` : ''}
              </div>
            ` : ''}
          ` : `
            <div class="info-box">
              <p><strong>❌ ত্রুটির বিবরণ:</strong></p>
              <p style="color: #dc2626;">${details.errorMessage || 'অজানা ত্রুটি'}</p>
            </div>
            <p>অনুগ্রহ করে অ্যাডমিন প্যানেল থেকে ব্যাকআপ পুনরায় চেষ্টা করুন অথবা লগ দেখুন।</p>
          `}
        </div>
        <div class="footer">
          <p>© ${now.getFullYear()} FishCare BD - সিস্টেম ব্যাকআপ নোটিফিকেশন</p>
          <p>এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।</p>
        </div>
      </body>
      </html>
    `;

    const client = new SMTPClient({
      connection: {
        hostname: smtpSettings.smtp_host,
        port: smtpSettings.smtp_port,
        tls: smtpSettings.smtp_secure,
        auth: {
          username: smtpSettings.smtp_user,
          password: smtpSettings.smtp_password,
        },
      },
    });

    for (const email of adminEmails) {
      await client.send({
        from: `${smtpSettings.smtp_from_name} <${smtpSettings.smtp_from_email}>`,
        to: email,
        subject,
        content: 'Please view this email in an HTML-capable email client.',
        html,
      });

      // Log email
      await adminSupabase.from('email_logs').insert({
        order_number: details.fileName || 'backup',
        recipient_email: email,
        subject,
        template_type: 'backup_notification',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    }

    await client.close();
    console.log(`Backup notification sent to ${adminEmails.length} admin(s)`);
  } catch (emailError) {
    console.error('Failed to send backup notification email:', emailError);
  }
}

async function cleanupByRetention(
  adminSupabase: any,
  userId: string,
  isAdmin: boolean,
  retentionDays: number,
) {
  if (retentionDays <= 0) return { deleted: 0 };

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffISO = cutoffDate.toISOString();

  const scope = isAdmin ? 'system' : 'user';
  let query = adminSupabase
    .from('backup_logs')
    .select('*')
    .eq('backup_scope', scope)
    .lt('created_at', cutoffISO);

  if (!isAdmin) query = query.eq('user_id', userId);

  const { data: oldBackups } = await query;
  if (!oldBackups || oldBackups.length === 0) return { deleted: 0 };

  // Get Drive token
  let accessToken: string | null = null;
  const { data: driveToken } = await adminSupabase
    .from('google_drive_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (driveToken?.refresh_token) {
    try {
      accessToken = await refreshAccessToken(driveToken.refresh_token);
    } catch (_) { /* ignore */ }
  }

  for (const backup of oldBackups) {
    if (backup.google_drive_file_id && accessToken) {
      await deleteFromGoogleDrive(accessToken, backup.google_drive_file_id);
    }
    await adminSupabase.from('backup_logs').delete().eq('id', backup.id);
  }

  return { deleted: oldBackups.length };
}

async function cleanupOldBackups(
  adminSupabase: any,
  userId: string,
  isAdmin: boolean,
  maxBackups: number,
  maxSizeMB: number,
) {
  const scope = isAdmin ? 'system' : 'user';
  
  let query = adminSupabase
    .from('backup_logs')
    .select('*')
    .eq('backup_scope', scope)
    .order('created_at', { ascending: false });
  
  if (!isAdmin) query = query.eq('user_id', userId);
  
  const { data: allBackups } = await query;
  if (!allBackups || allBackups.length === 0) return { deleted: 0 };

  const toDelete: any[] = [];
  
  if (maxBackups > 0 && allBackups.length > maxBackups) {
    toDelete.push(...allBackups.slice(maxBackups));
  }

  if (maxSizeMB > 0) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    let totalSize = 0;
    for (const backup of allBackups) {
      totalSize += (backup.file_size || 0);
      if (totalSize > maxSizeBytes && !toDelete.find((d: any) => d.id === backup.id)) {
        toDelete.push(backup);
      }
    }
  }

  if (toDelete.length === 0) return { deleted: 0 };

  let accessToken: string | null = null;
  const { data: driveToken } = await adminSupabase
    .from('google_drive_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (driveToken?.refresh_token) {
    try {
      accessToken = await refreshAccessToken(driveToken.refresh_token);
    } catch (_) { /* ignore */ }
  }

  for (const backup of toDelete) {
    if (backup.google_drive_file_id && accessToken) {
      await deleteFromGoogleDrive(accessToken, backup.google_drive_file_id);
    }
    await adminSupabase.from('backup_logs').delete().eq('id', backup.id);
  }

  return { deleted: toDelete.length };
}

async function loadBackupSettings(adminSupabase: any) {
  const keys = ['backup_max_count', 'backup_max_size_mb', 'backup_retention_days', 'backup_email_notification'];
  const settings: Record<string, string> = {};
  for (const key of keys) {
    const { data } = await adminSupabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();
    if (data?.setting_value) settings[key] = data.setting_value;
  }
  return {
    maxBackups: parseInt(settings['backup_max_count'] || '10'),
    maxSizeMB: parseInt(settings['backup_max_size_mb'] || '500'),
    retentionDays: parseInt(settings['backup_retention_days'] || '30'),
    emailNotification: settings['backup_email_notification'] !== 'false',
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userId = userData.user.id;

    const { action, backup_scope, file_id, max_backups, max_size_mb } = await req.json();
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: roleData } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin');
    
    const isAdmin = roleData && roleData.length > 0;

    if (action === 'create_backup') {
      const scope = backup_scope || (isAdmin ? 'system' : 'user');
      
      if (scope === 'system' && !isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required for system backup' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = scope === 'system' 
        ? `system_backup_${dateStr}.json` 
        : `user_${userId.substring(0, 8)}_backup_${dateStr}.json`;

      const { data: logEntry, error: logError } = await adminSupabase
        .from('backup_logs')
        .insert({
          backup_type: 'manual',
          backup_scope: scope,
          status: 'in_progress',
          file_name: fileName,
          created_by: userId,
          user_id: scope === 'user' ? userId : null,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (logError) console.error('Error creating backup log:', logError);

      const backupSettings = await loadBackupSettings(adminSupabase);

      try {
        let backupData: Record<string, any> = {};

        if (scope === 'system') {
          const tables = ['products', 'categories', 'orders', 'order_items', 'profiles', 'user_roles',
            'market_prices', 'companies', 'brands', 'hero_slides', 'page_content', 'custom_pages',
            'system_settings', 'ad_settings', 'delivery_charge_rules', 'smtp_settings',
            'product_images', 'product_reviews', 'purchase_orders', 'purchase_order_items',
            'stock_adjustments', 'email_logs'];
          
          for (const table of tables) {
            const { data, error } = await adminSupabase.from(table).select('*');
            if (!error) backupData[table] = data;
          }

          for (const bucket of ['product-images', 'avatars']) {
            const { data: files } = await adminSupabase.storage.from(bucket).list();
            backupData[`storage_${bucket}`] = files || [];
          }
        } else {
          const { data: orders } = await adminSupabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('user_id', userId);
          backupData.orders = orders;

          const { data: profile } = await adminSupabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          backupData.profile = profile;

          backupData.localStorage_keys = [
            'farmingPondData', 'farmingFishStockingData', 'farmerIncomes',
            'farmerExpenses', 'farmerPonds', 'feedManagementData',
            'waterQualityData', 'medicineData', 'fertilizerData', 'biomassData'
          ];
        }

        backupData.backup_metadata = {
          created_at: new Date().toISOString(),
          scope,
          version: '2.0.0',
          user_id: userId,
        };

        const content = JSON.stringify(backupData, null, 2);
        const fileSize = new TextEncoder().encode(content).length;

        let driveFileId = null;
        let driveUrl = null;

        const { data: driveToken } = await adminSupabase
          .from('google_drive_tokens')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (driveToken?.refresh_token) {
          try {
            const accessToken = await refreshAccessToken(driveToken.refresh_token);
            await adminSupabase
              .from('google_drive_tokens')
              .update({ 
                access_token: accessToken,
                token_expires_at: new Date(Date.now() + 3600000).toISOString()
              })
              .eq('user_id', userId);

            const driveResult = await uploadToGoogleDrive(accessToken, fileName, content);
            driveFileId = driveResult.id;
            driveUrl = driveResult.webViewLink;
          } catch (driveError) {
            console.error('Google Drive upload failed:', driveError);
          }
        }

        if (logEntry) {
          await adminSupabase
            .from('backup_logs')
            .update({
              status: driveFileId ? 'completed' : 'completed_local',
              completed_at: new Date().toISOString(),
              file_size: fileSize,
              google_drive_file_id: driveFileId,
              google_drive_url: driveUrl,
              tables_included: Object.keys(backupData).filter(k => k !== 'backup_metadata'),
            })
            .eq('id', logEntry.id);
        }

        // Auto-cleanup by count/size
        const cleanupResult = await cleanupOldBackups(
          adminSupabase, userId, isAdmin, backupSettings.maxBackups, backupSettings.maxSizeMB
        );

        // Auto-cleanup by retention days
        const retentionResult = await cleanupByRetention(
          adminSupabase, userId, isAdmin, backupSettings.retentionDays
        );

        // Send email notification
        if (backupSettings.emailNotification) {
          await sendBackupNotificationEmail(adminSupabase, 'success', {
            fileName,
            fileSize,
            scope,
            driveUploaded: !!driveFileId,
            cleanupDeleted: cleanupResult.deleted,
            retentionDeleted: retentionResult.deleted,
          });
        }

        return new Response(JSON.stringify({
          success: true,
          file_name: fileName,
          file_size: fileSize,
          google_drive_uploaded: !!driveFileId,
          google_drive_url: driveUrl,
          backup_data: scope === 'user' ? backupData : undefined,
          log_id: logEntry?.id,
          auto_cleanup: cleanupResult,
          retention_cleanup: retentionResult,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (backupError) {
        if (logEntry) {
          await adminSupabase
            .from('backup_logs')
            .update({
              status: 'failed',
              error_message: backupError.message,
              completed_at: new Date().toISOString(),
            })
            .eq('id', logEntry.id);
        }

        // Send failure email notification
        if (backupSettings.emailNotification) {
          await sendBackupNotificationEmail(adminSupabase, 'failed', {
            errorMessage: backupError.message,
            scope: scope,
          });
        }

        throw backupError;
      }
    }

    if (action === 'restore_backup') {
      if (!file_id) {
        return new Response(JSON.stringify({ error: 'file_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: driveToken } = await adminSupabase
        .from('google_drive_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!driveToken?.refresh_token) {
        return new Response(JSON.stringify({ error: 'Google Drive not connected' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const accessToken = await refreshAccessToken(driveToken.refresh_token);
      const downloadRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file_id}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!downloadRes.ok) {
        return new Response(JSON.stringify({ error: 'Failed to download from Google Drive' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const backupData = await downloadRes.json();
      const scope = backupData.backup_metadata?.scope || 'user';

      if (scope === 'system' && !isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required for system restore' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const restoredTables: string[] = [];
      
      if (scope === 'system') {
        const restorableTables = ['products', 'categories', 'market_prices', 'companies', 'brands',
          'hero_slides', 'page_content', 'system_settings', 'ad_settings', 'delivery_charge_rules'];

        for (const table of restorableTables) {
          if (backupData[table] && Array.isArray(backupData[table])) {
            for (const row of backupData[table]) {
              await adminSupabase.from(table).upsert(row, { onConflict: 'id' });
            }
            restoredTables.push(table);
          }
        }
      }

      await adminSupabase
        .from('backup_logs')
        .update({ restore_status: 'restored', restored_at: new Date().toISOString() })
        .eq('google_drive_file_id', file_id);

      return new Response(JSON.stringify({
        success: true,
        restored_tables: restoredTables,
        local_storage_data: scope === 'user' ? backupData : undefined,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'list_backups') {
      const query = adminSupabase
        .from('backup_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!isAdmin) query.eq('user_id', userId);

      const { data: backups } = await query;

      return new Response(JSON.stringify({ backups: backups || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'list_drive_backups') {
      const { data: driveToken } = await adminSupabase
        .from('google_drive_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!driveToken?.refresh_token) {
        return new Response(JSON.stringify({ files: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const accessToken = await refreshAccessToken(driveToken.refresh_token);
      
      const searchQuery = isAdmin 
        ? "name contains 'system_backup' or name contains 'user_'" 
        : `name contains 'user_${userId.substring(0, 8)}'`;

      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery + " and mimeType='application/json'")}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const listData = await listRes.json();

      return new Response(JSON.stringify({ files: listData.files || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'cleanup_old_backups') {
      const effectiveMaxBackups = max_backups || 10;
      const effectiveMaxSizeMB = max_size_mb || 500;

      const result = await cleanupOldBackups(adminSupabase, userId, isAdmin, effectiveMaxBackups, effectiveMaxSizeMB);

      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_backup_stats') {
      const scope = isAdmin ? 'system' : 'user';
      let query = adminSupabase
        .from('backup_logs')
        .select('file_size, created_at')
        .eq('backup_scope', scope)
        .order('created_at', { ascending: false });
      
      if (!isAdmin) query = query.eq('user_id', userId);
      
      const { data: backups } = await query;
      const totalSize = (backups || []).reduce((sum: number, b: any) => sum + (b.file_size || 0), 0);
      const totalCount = (backups || []).length;
      const oldestBackup = backups && backups.length > 0 ? backups[backups.length - 1].created_at : null;

      return new Response(JSON.stringify({ total_size: totalSize, total_count: totalCount, oldest_backup: oldestBackup }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
