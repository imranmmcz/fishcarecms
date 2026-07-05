import { defineTool } from "@lovable.dev/mcp-js";
import { fishSpeciesOptions } from "@/data/fishSpeciesOptions";
import { z } from "zod";

export default defineTool({
  name: "list_fish_species",
  title: "List fish species",
  description: "List the fish species supported by FishCare calculators and content.",
  inputSchema: {
    search: z.string().optional().describe("Optional keyword filter (matches Bangla or English name)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ search }) => {
    const list = search
      ? fishSpeciesOptions.filter((s: any) => {
          const q = search.toLowerCase();
          return JSON.stringify(s).toLowerCase().includes(q);
        })
      : fishSpeciesOptions;
    return {
      content: [{ type: "text", text: JSON.stringify(list) }],
      structuredContent: { species: list },
    };
  },
});