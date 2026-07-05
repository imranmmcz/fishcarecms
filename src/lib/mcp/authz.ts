import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

// Build a Supabase client that runs as the OAuth end-user so RLS applies.
export function supabaseForUser(ctx: ToolContext): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

// Verify the caller has the given app_role (via the has_role() SECURITY DEFINER
// function). Returns null when authorized, or an MCP error result to return.
export async function requireRole(
  ctx: ToolContext,
  role: "admin" | "moderator" | "user" | "farmer" | "blogger",
) {
  if (!ctx.isAuthenticated()) {
    return {
      content: [{ type: "text" as const, text: "Not authenticated. Sign in with your FishCare account." }],
      isError: true,
    };
  }
  const supabase = supabaseForUser(ctx);
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: ctx.getUserId(),
    _role: role,
  });
  if (error) {
    return {
      content: [{ type: "text" as const, text: `Role check failed: ${error.message}` }],
      isError: true,
    };
  }
  if (!data) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Forbidden. This tool requires the '${role}' role on your FishCare account.`,
        },
      ],
      isError: true,
    };
  }
  return null;
}

export function requireAuth(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) {
    return {
      content: [{ type: "text" as const, text: "Not authenticated. Sign in with your FishCare account." }],
      isError: true,
    };
  }
  return null;
}