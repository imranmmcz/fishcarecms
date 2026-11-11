import { describe, expect, it } from "vitest";
import { buildApiUrl } from "../apiUrl";

describe("buildApiUrl", () => {
  it("removes a duplicate /api prefix when the base already includes it", () => {
    expect(
      buildApiUrl("https://api.fishcare.com.bd/api", "/api/health/summary")
    ).toBe("https://api.fishcare.com.bd/api/health/summary");
  });

  it("keeps one /api prefix when the request path has no prefix", () => {
    expect(
      buildApiUrl("https://api.fishcare.com.bd/api", "/health/summary")
    ).toBe("https://api.fishcare.com.bd/api/health/summary");
  });

  it("adds the request prefix when the configured base has no /api suffix", () => {
    expect(
      buildApiUrl("https://api.fishcare.com.bd", "/api/health/summary")
    ).toBe("https://api.fishcare.com.bd/api/health/summary");
  });

  it("preserves non-API paths when the base already ends in /api", () => {
    expect(
      buildApiUrl("https://api.fishcare.com.bd/api/", "/health")
    ).toBe("https://api.fishcare.com.bd/api/health");
  });
});