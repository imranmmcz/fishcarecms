

# Invoice Bangla Font Broken - Fix Plan

## Problem Analysis

The Bangla font system for invoice PDFs has a robust multi-font fallback chain (Nikosh → HindSiliguri → NotoSansBengali → BalooDa2 → AnekBangla). Local font files exist in `/public/fonts/` and are valid TrueType files. The code structure is correct.

The likely root causes of broken Bangla text:

1. **Font loading race condition**: The `registerBanglaFont` function uses `fetch()` with `force-cache`, but in some browsers/environments the local font path `/fonts/Nikosh.ttf` may not resolve correctly (especially in deployed builds or certain CDN configurations).

2. **Missing error recovery in autoTable**: If font registration silently fails, autoTable falls back to Helvetica which cannot render Bengali characters, producing garbled/box text.

3. **No verification after font registration**: The code checks `doc.getFont().fontName` but doesn't verify actual Bengali glyph rendering capability.

## Fix Plan

### Step 1: Strengthen font loading with inline base64 fallback
- Add a small inline base64-encoded Bengali font subset as a last-resort fallback in `pdfBanglaFont.ts`
- This ensures fonts work even when fetch fails (offline, CORS issues, CDN down)

### Step 2: Add robust error handling in generateInvoicePDF.ts
- After `registerBanglaFont(doc)`, check the return value and warn the user via toast if font loading failed
- Ensure `fontName` defaults to a registered font name (not just "Nikosh" which may not exist)

### Step 3: Fix font path resolution
- Use absolute URLs with `window.location.origin` prefix for local font paths instead of relative `/fonts/Nikosh.ttf`
- This prevents path resolution issues in different deployment environments

### Step 4: Add font preload verification
- In `preloadBanglaFont()`, actually create a temporary jsPDF doc and register the font to verify it works end-to-end
- Show a console warning if preload fails

### Technical Details

**File changes:**
- `src/lib/pdfBanglaFont.ts` — Fix URL resolution, add origin prefix, improve error handling
- `src/lib/generateInvoicePDF.ts` — Add toast notification on font failure, verify fontName before use
- `src/main.tsx` or `src/App.tsx` — Ensure `preloadBanglaFont()` runs on app startup (verify current behavior)

