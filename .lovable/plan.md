## MegaShop Homepage Style Improvement

Refresh only the **MegaShop** homepage layout (`src/components/layouts/MegaShopHome.tsx` and its `MegaShopHeader`/`MegaShopFooter`) with a magazine-style composition, premium green palette, and modern tech typography. Classic and Modern layouts stay untouched.

### Design Tokens (added to `src/index.css` + `tailwind.config.ts`)

- **Primary green**: `#25671E` → HSL `113 55% 26%`
- **Accent lime**: `#4CAF10` → HSL `97 83% 37%`
- **Supporting**: warm cream surface, deep forest text, soft sage muted
- New gradient tokens: `--gradient-hero` (forest → lime), `--gradient-card` (cream → sage tint)
- New shadow tokens: `--shadow-magazine` (soft layered), `--shadow-feature` (elevated)
- **Fonts**: Space Grotesk (headings) + DM Sans (body), loaded via Google Fonts in `index.html`; mapped to `font-display` and `font-sans` in Tailwind. Bengali text continues using existing Bengali font stack as a fallback.

### Magazine Layout Structure

```text
┌──────────────────────────────────────────────────┐
│  MegaShopHeader (compact, refined spacing)       │
├──────────────────────────────────────────────────┤
│  FEATURED HERO STRIP (magazine cover)            │
│  ┌──────────────┬──────────────┬──────────────┐  │
│  │              │  Eyebrow     │ Side feature │  │
│  │  Big Hero    │  Big H1      │ card (promo) │  │
│  │  (7 cols)    │  CTA buttons ├──────────────┤  │
│  │              │  (3 cols)    │ Side feature │  │
│  └──────────────┴──────────────┴──────────────┘  │
├──────────────────────────────────────────────────┤
│  Category pill rail (kept, restyled)             │
├──────────────────────────────────────────────────┤
│  FLASH SALE band (full-width, dark green)        │
├──────────────────────────────────────────────────┤
│  FEATURED PRODUCTS — editorial grid              │
│  [Big card 2×2] [Card] [Card]                    │
│                 [Card] [Card]                    │
├──────────────────────────────────────────────────┤
│  FARMING TOOLS — bento (1 large + 6 small)       │
├──────────────────────────────────────────────────┤
│  "From the Field" editorial split                │
│  (FishHealthAdvice on left, ProductSlider right) │
├──────────────────────────────────────────────────┤
│  CTA banner (forest→lime gradient, asymmetric)   │
├──────────────────────────────────────────────────┤
│  MegaShopFooter                                  │
└──────────────────────────────────────────────────┘
```

### Section-level Changes

1. **Hero** — Replace the 3+1 grid with a 10-col magazine layout: HeroSlider on the left (cols 1–7), an editorial text block + dual CTAs (cols 8–10 top), two stacked promo cards (cols 8–10 bottom). Adds an eyebrow tag ("নতুন সিজন / New Season").
2. **Category rail** — Pills get a subtle border, hover lifts with green accent underline.
3. **Flash sale** — Wrapped in a full-bleed dark-green band with a magazine-style label ("সীমিত সময়ের অফার").
4. **Featured Products** — Replace carousel with a 4-column editorial grid: first product spans 2×2 as a "cover product"; remaining 6 fill the rest. Adds section eyebrow + serif-feel display heading using Space Grotesk weight 700.
5. **Modules** — Convert to bento: first tile (Pond Calculator) spans 2×2 with illustration treatment; 6 smaller tiles around it. Keeps existing `ModuleCard` props.
6. **Editorial split** — New 2-column band combining `FishHealthAdvice` (left) and a compact `ProductSlider` (right) under a shared "From the Field / মাঠ থেকে" header.
7. **CTA** — Asymmetric layout: large headline left, stacked CTAs right, decorative leaf/wave SVG accent using accent lime.
8. **AdUnit slots** — Kept in the same positions but with magazine-styled containers (cream background, rounded-2xl).

### Files to Edit

- `src/index.css` — add HSL tokens, gradient/shadow tokens, font-family vars
- `tailwind.config.ts` — register `font-display`, new color tokens, shadow tokens
- `index.html` — add Space Grotesk + DM Sans Google Fonts preconnect/link
- `src/components/layouts/MegaShopHome.tsx` — full restructure (magazine sections)
- `src/components/layouts/MegaShopHeader.tsx` — spacing/typography polish only
- `src/components/layouts/MegaShopFooter.tsx` — spacing/typography polish only

### Out of Scope

- Classic / Modern home layouts
- Product card internals, header search/menu logic, business logic
- Backend, data fetching, RLS, routes
- Other pages (Shop, Product Details, etc.)

### Responsive

- Mobile (≤640px): magazine grid collapses to single column; bento becomes 2-col; cover product becomes full-width.
- Tablet (768–1024px): 2-col editorial grids.
- Desktop (≥1024px): full magazine layout as diagrammed.
- Maintains 360px minimum per project standard.
