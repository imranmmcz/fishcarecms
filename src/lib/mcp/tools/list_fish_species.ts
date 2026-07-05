import { defineTool } from "@lovable.dev/mcp-js";
import { FISH_SPECIES_OPTIONS } from "@/data/FISH_SPECIES_OPTIONS";
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
      ? FISH_SPECIES_OPTIONS.filter((s: any) => {
          const q = search.toLowerCase();
          return JSON.stringify(s).toLowerCase().includes(q);
        })
      : FISH_SPECIES_OPTIONS;
    return {
      content: [{ type: "text", text: JSON.stringify(list) }],
      structuredContent: { species: list },
    };
  },
});