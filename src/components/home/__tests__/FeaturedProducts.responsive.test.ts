import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Lightweight static check: verifies responsive padding/gap classes are
 * present in the FeaturedProducts source so that breakpoints (sm/md/lg/xl)
 * remain consistent without rendering the whole component (which depends on
 * many providers + Supabase).
 */
const featuredSrc = readFileSync(
  resolve(__dirname, "../FeaturedProducts.tsx"),
  "utf8"
);
const productCardSrc = readFileSync(
  resolve(__dirname, "../../ProductCard.tsx"),
  "utf8"
);

describe("FeaturedProducts responsive layout", () => {
  it("section uses responsive vertical padding across breakpoints", () => {
    expect(featuredSrc).toMatch(
      /py-10\s+sm:py-12\s+md:py-14\s+lg:py-16/
    );
  });

  it("container uses responsive horizontal padding", () => {
    expect(featuredSrc).toMatch(/px-3\s+sm:px-4\s+md:px-6/);
  });

  it("carousel content uses responsive negative margin (gap base)", () => {
    expect(featuredSrc).toMatch(/-ml-2\s+sm:-ml-3\s+md:-ml-4\s+lg:-ml-5/);
  });

  it("each carousel item has responsive left padding (gutter)", () => {
    expect(featuredSrc).toMatch(/pl-2\s+sm:pl-3\s+md:pl-4\s+lg:pl-5/);
  });

  it("carousel item shows 2/3/4/5/6 cards across sm/md/lg/xl", () => {
    expect(featuredSrc).toMatch(
      /basis-1\/2\s+sm:basis-1\/3\s+md:basis-1\/4\s+lg:basis-1\/5\s+xl:basis-1\/6/
    );
  });
});

describe("ProductCard responsive alignment", () => {
  it("product image uses aspect-square so all cards align in the grid", () => {
    expect(productCardSrc).toMatch(/aspect-square/);
  });

  it("title has responsive min-height to keep cards aligned", () => {
    expect(productCardSrc).toMatch(
      /min-h-\[1\.25rem\]\s+sm:min-h-\[2\.75rem\]\s+md:min-h-\[3rem\]/
    );
  });

  it("price row reserves a responsive min-height", () => {
    expect(productCardSrc).toMatch(
      /min-h-\[1\.75rem\]\s+sm:min-h-\[2\.25rem\]/
    );
  });

  it("info container scales padding with breakpoints", () => {
    expect(productCardSrc).toMatch(/p-3\s+sm:p-4\s+md:p-5/);
  });

  it("card fills row height (h-full + flex-col) for equal heights in grid", () => {
    expect(productCardSrc).toMatch(/h-full/);
    expect(productCardSrc).toMatch(/flex flex-col/);
  });

  it("hover transition is limited to box-shadow / border / filter (no size jump)", () => {
    expect(productCardSrc).toMatch(
      /transition-\[box-shadow,border-color,filter\]/
    );
    expect(productCardSrc).toMatch(/hover:scale-100/);
    expect(productCardSrc).toMatch(/hover:-translate-y-0/);
  });

  it("info container grows (flex-1) so footer buttons stay aligned", () => {
    expect(productCardSrc).toMatch(/flex flex-col flex-1/);
  });

  it("action row is bottom-pinned with a fixed min-height", () => {
    expect(productCardSrc).toMatch(/mt-auto/);
    expect(productCardSrc).toMatch(/min-h-\[2\.25rem\]\s+sm:min-h-\[2\.5rem\]/);
  });

  it("card isolates transforms so image zoom doesn't affect siblings", () => {
    expect(productCardSrc).toMatch(/\bisolate\b/);
    expect(productCardSrc).toMatch(/transform-gpu/);
  });
});