import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireAuth, supabaseForUser } from "../authz";

export default defineTool({
  name: "list_market_prices",
  title: "List market prices",
  description:
    "List recent fish market prices submitted by users across Bangladesh. Requires a signed-in FishCare user.",
  inputSchema: {
    fish_name: z.string().optional().describe("Optional fish name filter."),
    location: z.string().optional().describe("Optional location filter (district/market)."),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ fish_name, location, limit }, ctx) => {
    const denied = requireAuth(ctx);
    if (denied) return denied;
    const supabase = supabaseForUser(ctx);
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