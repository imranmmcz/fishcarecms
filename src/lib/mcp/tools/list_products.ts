import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireRole, supabaseForUser } from "../authz";

export default defineTool({
  name: "list_products",
  title: "List products",
  description:
    "List products from the FishCare shop catalog with optional search. Admin-only (returns internal cost_price).",
  inputSchema: {
    search: z.string().optional().describe("Optional keyword to filter by name."),
    limit: z.number().int().min(1).max(50).default(20).describe("Max rows to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    const denied = await requireRole(ctx, "admin");
    if (denied) return denied;
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("products")
      .select("id,name,price,cost_price,stock_quantity,category_id,image_url")
      .limit(limit);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});