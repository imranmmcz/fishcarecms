# Fish Care – SEO System Guide

**Domain:** https://fishcare.com.bd
**Tagline:** Solution of Fish Farming
**Languages:** English (default), Bengali (`?lang=bn`)
**Target:** Bangladesh

## What's configured

### 1. Static SEO – `index.html`
- Title, meta description, keywords, robots, geo tags
- Canonical + hreflang (`en`, `bn`, `x-default`)
- Open Graph + Twitter Card
- JSON-LD: Organization, WebSite + SearchAction, BreadcrumbList, FAQPage
- Verification placeholders: Google Search Console, Bing, Yandex
- GA4 placeholder (replace `G-XXXXXXXXXX`)
- Preconnect / DNS-prefetch for Core Web Vitals

### 2. Dynamic per-route SEO – `src/components/SeoHead.tsx`
Drop into any page:
```tsx
import SeoHead from "@/components/SeoHead";
<SeoHead title="..." description="..." url="/path" image="..." />
```
Automatically writes: title, description, OG, Twitter, canonical, hreflang.

### 3. JSON-LD – `src/components/JsonLd.tsx` + `src/lib/seo.ts`
```tsx
import JsonLd from "@/components/JsonLd";
import { schemas } from "@/lib/seo";

<JsonLd id="ld-product" data={schemas.product({
  name: "Aqua Pro Plus", description: "...", slug: "aqua-pro-plus",
  price: 250, currency: "BDT", availability: "InStock",
})} />
```
Available: `organization`, `website`, `breadcrumb`, `article`, `blog`, `product`, `faq`.

### 4. Metadata templates – `src/lib/seo.ts`
Pre-built title/description templates for: `home`, `blogPost`, `medicine`,
`disease`, `species`, `calculator`, `dashboard`.

```tsx
import { seoTemplates } from "@/lib/seo";
const meta = seoTemplates.medicine({ name: "Aqua Pro Plus", slug: "aqua-pro-plus" });
<SeoHead {...meta} />
```

### 5. robots.txt – `public/robots.txt`
- Allows all crawlers on public pages
- Disallows `/admin`, `/dashboard`, `/pos`, `/checkout`, `/auth`, etc.
- Points to sitemap

### 6. sitemap.xml – `public/sitemap.xml`
- All 22 public routes
- hreflang alternates on homepage
- Update with dynamic blog/product/species URLs from your DB (recommended: generator script)

## Action items (replace placeholders)

| Where | What to replace |
|---|---|
| `index.html` | `REPLACE_WITH_GOOGLE_VERIFICATION_TOKEN` (Search Console) |
| `index.html` | `REPLACE_WITH_BING_VERIFICATION_TOKEN` (Bing Webmaster) |
| `index.html` | `REPLACE_WITH_YANDEX_VERIFICATION_TOKEN` (Yandex) |
| `index.html` | `G-XXXXXXXXXX` (uncomment GA4 block + use your Measurement ID) |
| `src/lib/seo.ts` | `sameAs` URLs – your real Facebook/YouTube |

## Image SEO
- Use `generateAltText(name)` from `src/lib/seo.ts` for product image alts
- Use `seoFilename(name)` to slugify uploaded image filenames
- Always set `width`/`height` + `loading="lazy"` (already in `OptimizedImage`)

## Core Web Vitals
- Preconnect to font CDN: done
- Lazy-load below-fold images: use `<OptimizedImage loading="lazy">`
- Compress images: prefer WebP/AVIF where possible
- Code-split heavy routes (Vite does this automatically per route)

## Internal linking strategy
- Header → Shop / Modules / Blog / Fish Species / Disease Advice
- Footer → all 22 public routes + essential pages
- Each product → related products slider + matching disease pages
- Each disease → recommended medicines (cross-link)
- Each blog post → related posts by tag/category
- Breadcrumbs on all detail pages (use `schemas.breadcrumb()`)