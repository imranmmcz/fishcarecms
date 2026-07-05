import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list_products";
import listMarketPrices from "./tools/list_market_prices";
import listFishSpecies from "./tools/list_fish_species";

// Build the OAuth issuer from the project ref (Vite inlines this literal at
// build time so the entry stays import-safe). Never derive from SUPABASE_URL —
// mcp-js rejects tokens whose issuer disagrees with the discovery document.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "fishcare-mcp",
  title: "FishCare MCP",
  version: "0.2.0",
  instructions:
    "Tools for the FishCare app: browse the shop product catalog, look up recent fish market prices across Bangladesh, and list supported fish species. Users must sign in with their FishCare account; `list_products` requires admin role.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, listMarketPrices, listFishSpecies],
});