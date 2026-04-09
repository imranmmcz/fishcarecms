
# ২টি নতুন ই-কমার্স লেআউট থিম

## বর্তমান অবস্থা
- একটি ডিফল্ট লেআউট আছে (3-row header, 4-column footer, hero slider)
- ৮টি কালার প্রিসেট আছে কিন্তু লেআউট পরিবর্তন হয় না

## পরিকল্পনা

### লেআউট ১: "ক্লাসিক" (বর্তমান - ডিফল্ট)
- 3-row header (utility → logo/search → nav)
- Hero slider + featured products carousel
- Module cards grid
- 4-column footer with underwater effect

### লেআউট ২: "মডার্ন মিনিমাল"
- **হেডার**: Single-row sticky header — লোগো বামে, সেন্টার্ড নেভিগেশন, ডানে অ্যাকশন আইকন (search, cart, user)
- **হিরো**: Full-width split layout — বাম পাশে টেক্সট + CTA, ডান পাশে প্রোডাক্ট ইমেজ/ক্যারোউসেল
- **প্রোডাক্ট সেকশন**: Large card grid with hover zoom effect, category tabs
- **ফুটার**: 3-column clean footer with newsletter signup, no underwater effect

### লেআউট ৩: "মেগা শপ"  
- **হেডার**: 2-row header — টপে লোগো + mega search bar, নিচে ক্যাটাগরি dropdown menu + deals banner
- **হিরো**: Banner grid layout — বড় ব্যানার + ২টি ছোট সাইড ব্যানার
- **প্রোডাক্ট সেকশন**: Category-wise sections with "See All" links, horizontal scroll
- **ফুটার**: Full-width dark footer with app download CTA + payment icons + multi-column links

## প্রযুক্তিগত বাস্তবায়ন

1. **DB**: `system_settings` এ `theme_layout` কী যোগ (value: `classic` | `modern` | `megashop`)
2. **Layout Components**: 
   - `src/components/layouts/ModernHeader.tsx`
   - `src/components/layouts/ModernFooter.tsx`
   - `src/components/layouts/ModernHome.tsx`
   - `src/components/layouts/MegaShopHeader.tsx`
   - `src/components/layouts/MegaShopFooter.tsx`
   - `src/components/layouts/MegaShopHome.tsx`
3. **Layout Context**: `src/contexts/LayoutContext.tsx` — লেআউট সিলেকশন ম্যানেজ করবে
4. **Theme Settings UI**: লেআউট প্রিভিউ কার্ড + সিলেকশন যোগ
5. **Header/Footer/Index**: LayoutContext থেকে সঠিক কম্পোনেন্ট রেন্ডার

## ফাইল পরিবর্তন
- নতুন: ৭টি ফাইল (৬ layout components + 1 context)
- পরিবর্তন: `Header.tsx`, `Footer.tsx`, `Index.tsx`, `ThemeColorSettings.tsx`, `ThemeLoader.tsx`
