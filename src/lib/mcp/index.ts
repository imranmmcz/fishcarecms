import { defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list_products";
import listMarketPrices from "./tools/list_market_prices";
import listFishSpecies from "./tools/list_fish_species";

export default defineMcp({
  name: "fishcare-mcp",
  title: "FishCare MCP",
  version: "0.1.0",
  instructions:
    "Tools for the FishCare app: browse the shop product catalog, look up recent fish market prices across Bangladesh, and list supported fish species.",
  tools: [listProducts, listMarketPrices, listFishSpecies],
});