import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function cleanupOldBackups(
  adminSupabase: any,
  userId: string,
  isAdmin: boolean,
  maxBackups: number,
  maxSizeMB: number,
) {
  const scope = isAdmin ? 'system' : 'user';
  
  // Get all backups ordered by date
  let query = adminSupabase
    .from('backup_logs')
    .select('*')
    .eq('backup_scope', scope)
    .order('created_at', { ascending: false });
  
  if (!isAdmin) query = query.eq('user_id', userId);
  
  const { data: allBackups } = await query;
  if (!allBackups || allBackups.length === 0) return { deleted: 0 };

  const toDelete: any[] = [];
  
  // 1. Delete backups beyond max count
  if (maxBackups > 0 && allBackups.length > maxBackups) {
    toDelete.push(...allBackups.slice(maxBackups));
  }

  // 2. Delete backups if total size exceeds limit
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

  // Get Drive token for deleting Drive files
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

  // Delete each old backup
  for (const backup of toDelete) {
    // Delete from Google Drive if applicable
    if (backup.google_drive_file_id && accessToken) {
      await deleteFromGoogleDrive(accessToken, backup.google_drive_file_id);
    }
    // Delete log entry
    await adminSupabase.from('backup_logs').delete().eq('id', backup.id);
  }

  return { deleted: toDelete.length };
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

    // Check if user is admin for system backups
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

      // Create backup log entry
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

      if (logError) {
        console.error('Error creating backup log:', logError);
      }

      try {
        let backupData: Record<string, any> = {};

        if (scope === 'system') {
          // Export all public tables
          const tables = ['products', 'categories', 'orders', 'order_items', 'profiles', 'user_roles',
            'market_prices', 'companies', 'brands', 'hero_slides', 'page_content', 'custom_pages',
            'system_settings', 'ad_settings', 'delivery_charge_rules', 'smtp_settings',
            'product_images', 'product_reviews', 'purchase_orders', 'purchase_order_items',
            'stock_adjustments', 'email_logs'];
          
          for (const table of tables) {
            const { data, error } = await adminSupabase.from(table).select('*');
            if (!error) backupData[table] = data;
          }

          // Get storage file list
          for (const bucket of ['product-images', 'avatars']) {
            const { data: files } = await adminSupabase.storage.from(bucket).list();
            backupData[`storage_${bucket}`] = files || [];
          }
        } else {
          // User-specific backup
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

          // Include localStorage keys info (client needs to add these)
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

        // Try to upload to Google Drive
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
            
            // Update stored access token
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

        // Update backup log
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

        // Auto-cleanup: keep max 10 backups and 500MB by default
        const defaultMaxBackups = 10;
        const defaultMaxSizeMB = 500;
        
        // Load settings from system_settings
        const { data: maxBackupsSetting } = await adminSupabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'backup_max_count')
          .single();
        const { data: maxSizeSetting } = await adminSupabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'backup_max_size_mb')
          .single();

        const effectiveMaxBackups = maxBackupsSetting?.setting_value ? parseInt(maxBackupsSetting.setting_value) : defaultMaxBackups;
        const effectiveMaxSizeMB = maxSizeSetting?.setting_value ? parseInt(maxSizeSetting.setting_value) : defaultMaxSizeMB;

        const cleanupResult = await cleanupOldBackups(adminSupabase, userId, isAdmin, effectiveMaxBackups, effectiveMaxSizeMB);

        return new Response(JSON.stringify({
          success: true,
          file_name: fileName,
          file_size: fileSize,
          google_drive_uploaded: !!driveFileId,
          google_drive_url: driveUrl,
          backup_data: scope === 'user' ? backupData : undefined,
          log_id: logEntry?.id,
          auto_cleanup: cleanupResult,
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
        throw backupError;
      }
    }

    if (action === 'restore_backup') {
      if (!file_id) {
        return new Response(JSON.stringify({ error: 'file_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get user's Google Drive token
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

      // Download file from Google Drive
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

      // Restore data
      const restoredTables: string[] = [];
      
      if (scope === 'system') {
        // For system restore, upsert data table by table
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
      } else {
        // User restore - return data for client-side localStorage restore
      }

      // Update backup log restore status
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

      if (!isAdmin) {
        query.eq('user_id', userId);
      }

      const { data: backups, error } = await query;

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
      if (!isAdmin) {
        // Users can clean their own, but use default limits
      }
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
