import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_market_prices",
  title: "List market prices",
  description: "List recent fish market prices submitted by users across Bangladesh.",
  inputSchema: {
    fish_name: z.string().optional().describe("Optional fish name filter."),
    location: z.string().optional().describe("Optional location filter (district/market)."),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ fish_name, location, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let q = supabase
      .from("market_prices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (fish_name) q = q.ilike("fish_name", `%${fish_name}%`);
    if (location) q = q.ilike("location", `%${location}%`);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { prices: data ?? [] },
    };
  },
});