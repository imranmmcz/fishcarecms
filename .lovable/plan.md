
লক্ষ্য: প্রোডাক্ট ডিটেইলস পেইজে মাউস কার্সরের নিচের অংশটাই লেন্সে সঠিকভাবে জুম দেখানো—এখনকার mismatch পুরোপুরি ঠিক করা।

বর্তমান সমস্যার নির্ণয় (root cause)
- `src/pages/ProductDetails.tsx`-এ লেন্সের ভিতরের জুম ইমেজে `left/top` `%` হিসেবে সেট করা হয়েছে, কিন্তু ওই `%` লেন্সের নিজের বক্সের রেফারেন্সে কাজ করছে।
- ফলে কার্সর 0%→100% গেলেও জুম ইমেজ যথেষ্ট দূরত্বে সরে না; তাই “একই জায়গা” বা “ভুল জায়গা” বেশি দেখা যায়।
- উপরন্তু মূল ইমেজ `object-cover` হওয়ায় source image crop হয়; কিন্তু বর্তমান লেন্স ক্যালকুলেশন সেই crop geometry পুরোপুরি account করছে না।

কোথায় পরিবর্তন হবে
- শুধুমাত্র: `src/pages/ProductDetails.tsx`
- Backend/DB/Cloud কোন পরিবর্তন লাগবে না।

ইমপ্লিমেন্টেশন প্ল্যান
1) Lens math-কে percentage থেকে pixel-based mapping-এ নেওয়া  
- `zoomPosition` শুধু `%` না রেখে mouse-এর container-relative pixel coordinateও রাখা হবে (যেমন `pointerPx` + `%` দুটোই)।
- mouse move-এ `rect` থেকে cursor-এর `x/y` clamp করে নেব, যাতে boundary mismatch না হয়।

2) `object-cover` অনুযায়ী rendered image geometry হিসাব করা  
- main image load হলে `naturalWidth/naturalHeight` state-এ সংরক্ষণ করব।
- container width/height + natural size থেকে cover scale হিসাব:
  - `scale = max(containerW/naturalW, containerH/naturalH)`
  - `renderW = naturalW * scale`, `renderH = naturalH * scale`
  - crop offset: `offsetX = (containerW - renderW)/2`, `offsetY = (containerH - renderH)/2`
- cursor point কে rendered image coordinate-এ map করব:
  - `imgX = clamp(cursorX - offsetX, 0, renderW)`
  - `imgY = clamp(cursorY - offsetY, 0, renderH)`

3) Lens-এর ভিতরের zoom image position সঠিকভাবে বসানো  
- নির্দিষ্ট zoom factor (যেমন 2.5) ও lens size (বর্তমান 192px) ধরে:
  - `zoomW = renderW * zoomFactor`, `zoomH = renderH * zoomFactor`
  - `left = lensSize/2 - imgX * zoomFactor`
  - `top = lensSize/2 - imgY * zoomFactor`
- edge-এ blank space ঠেকাতে `left/top` clamp করব:
  - `left ∈ [lensSize - zoomW, 0]`
  - `top ∈ [lensSize - zoomH, 0]`
- লেন্সের ভিতরের `<img>` এ px-based `width/height/left/top` বসানো হবে, `%` নয়।

4) Interaction polishing
- `onMouseLeave` এ lens hide + state reset (প্রয়োজনে)।
- image change (thumbnail switch) হলে lens inactive করা হবে যাতে stale position না থাকে।
- current “click to zoom” fullscreen dialog behavior অপরিবর্তিত থাকবে।

5) Regression safety
- product image না থাকলে existing fallback UI untouched।
- mobile/touch-এ hover lens না দেখালেও desktop hover unaffected থাকবে।

টেকনিক্যাল নোট (সংক্ষেপে)
- Key fix: “lens-local percent movement” → “container/image geometry aware pixel translation”
- এটাই cursor-to-zoom mapping 1:1 করার মূল সমাধান।
- এই approach `object-cover` crop mismatch-ও ঠিক করবে, যা বর্তমান bug-এর বড় কারণ।

টেস্ট প্ল্যান (এন্ড-টু-এন্ড)
1) ডেস্কটপে `/product/:id` খুলে main image-এর
- center, চার কোণা, চার edge—সব জায়গায় hover করে দেখব lens ঠিক ওই জায়গা magnify করছে কিনা।
2) landscape/portrait ভিন্ন ratio-এর image দিয়ে cross-check।
3) gallery thumbnail বদলে আবার hover টেস্ট (old position leak হচ্ছে কিনা)।
4) click করে fullscreen zoom dialog আগের মতো খোলে কিনা যাচাই।
5) দ্রুত mouse move করলে jitter/lag/blank area আছে কিনা চেক।

সম্ভাব্য ঝুঁকি ও প্রতিকার
- ঝুঁকি: natural size initial load-এর আগে null হলে প্রথম hover mismatch হতে পারে।
- প্রতিকার: natural size না পাওয়া পর্যন্ত lens render না করা বা safe fallback geometry ব্যবহার।
- ঝুঁকি: edge clamp ভুল হলে lens-এ blank strip আসতে পারে।
- প্রতিকার: strict clamp ranges + corner-case testing (চার কোণা বাধ্যতামূলক)।

Approve করলে আমি এই প্ল্যান অনুযায়ী `ProductDetails.tsx`-এ targeted fix implement করব।
