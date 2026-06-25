# MySQL হাইব্রিড ইন্টিগ্রেশন প্ল্যান

লক্ষ্য: এডমিন প্যানেল থেকে MySQL কানেকশন কনফিগার ও টেস্ট করা, এবং নির্দিষ্ট মডিউল (Products, Orders, POS, Customers ইত্যাদি) Supabase-এর পরিবর্তে MySQL এ চালানো। Auth, Storage, Realtime, RLS-নির্ভর সংবেদনশীল মডিউল (user_roles, partners, security_audit_logs, profiles) Supabase-এই থাকবে।

---

## Phase 1 — Foundation (এই টার্নে ডেলিভারেবল)

### 1.1 Admin UI: MySQL Connection Manager
নতুন পেজ `/admin/database-config` —
- Connection ফর্ম: host, port, user, password, database, ssl toggle
- "Test Connection" বাটন → `hostinger-backend/routes/database.js` এর `/api/database/test` কল করে
- "Save" → encrypted আকারে সেভ (Supabase `system_settings` টেবিলে key `mysql_connection_config`, password আলাদা edge function secret এ)
- Module toggle table: ১২টি সাপোর্টেড মডিউলের জন্য `supabase | mysql` ড্রপডাউন
  - Products, Product Variations, Categories, Brands
  - Orders, Order Items, Customers
  - POS Sales, POS Sale Items, POS Shifts, POS Expenses
  - Stock Adjustments
- পরিবর্তন সেভ হলে `system_settings` এর `data_source_routing` JSON আপডেট হবে

### 1.2 Backend: MySQL Connection Layer
`hostinger-backend/` এ যোগ:
- `db/mysql.js` — `mysql2/promise` pool, connection config DB থেকে লোড
- `routes/database.js` — `POST /api/database/test`, `POST /api/database/save-config`, `POST /api/database/sync-schema`
- `db/schema-mysql.sql` — ১২টি মডিউলের MySQL CREATE TABLE (UUID → CHAR(36), JSONB → JSON, timestamps → DATETIME)
- `db/sync.js` — প্রথমবার কানেক্ট হলে schema auto-create + Supabase থেকে initial data কপি (ইনিশিয়াল মাইগ্রেশন স্ক্রিপ্ট)

### 1.3 Frontend: Data Layer Abstraction
নতুন `src/lib/dataSource/` ফোল্ডার:
- `index.ts` — `getDataSource(module: ModuleName): 'supabase' | 'mysql'` (system_settings থেকে cache-সহ পড়ে)
- `products.ts`, `orders.ts`, `pos.ts`, `customers.ts` — প্রতিটিতে একই ইন্টারফেস, ভেতরে রাউটিং
  ```ts
  export const productsRepo = {
    list: async (...) => isMysql('products') ? mysqlApi.get('/products') : supabase.from('products').select(...)
  }
  ```
- Existing component গুলো ধাপে ধাপে `supabase.from('products')` → `productsRepo.list()` এ migrate

### 1.4 Module Migration (Phase 1 এ Products + Orders + POS)
- ১২টি মডিউলের মধ্যে এই ৩টি মডিউলের পেজগুলো repo abstraction এ পোর্ট হবে
- বাকি ৯টি মডিউলের repo স্কেলিটন থাকবে, পরবর্তী ফেজে পোর্ট

---

## Phase 2 — পরবর্তী টার্ন (এই প্ল্যানে নয়, পরে এগোব)
- বাকি মডিউলগুলো পোর্ট
- Realtime polling fallback MySQL মডিউলের জন্য
- Bi-directional sync (Supabase ↔ MySQL)
- File upload Hostinger filesystem এ

---

## Technical Details

**Routing storage** — `system_settings` টেবিলে:
```json
{
  "setting_key": "data_source_routing",
  "setting_value": {"products":"mysql","orders":"mysql","pos_sales":"supabase",...}
}
```

**MySQL credentials** — admin save করলে backend `hostinger-backend/.env` এ লেখা হবে না; বরং `mysql_config` টেবিলে encrypted (AES-256-GCM, key = `MYSQL_CONFIG_ENCRYPTION_KEY` secret) সেভ হবে। Backend রিকোয়েস্টে decrypt করে pool বানাবে।

**API base URL** — frontend `VITE_API_URL` (ইতিমধ্যে আছে) ব্যবহার করে `hostinger-backend` এ কল করবে।

**Auth flow অপরিবর্তিত** — সব MySQL endpoint Supabase JWT validate করবে (`hostinger-backend/middleware/auth.js` ইতিমধ্যে আছে), user_id দিয়ে ownership check।

**Schema diff** — `POST /api/database/sync-schema` চললে: MySQL এ যেসব টেবিল নেই সেগুলো create + Supabase থেকে rows কপি (batched, idempotent, `ON DUPLICATE KEY UPDATE`)।

**ASCII flow:**
```text
Browser ──► productsRepo.list()
              │
              ├─ routing='supabase' ─► supabase.from('products')
              └─ routing='mysql' ────► fetch(VITE_API_URL+'/api/products')
                                          │
                                          └─► hostinger-backend ──► MySQL pool ──► Hostinger MySQL
```

---

## Files to Create / Edit

**New:**
- `src/pages/admin/DatabaseConfig.tsx` — connection form + module toggles
- `src/lib/dataSource/index.ts`, `products.ts`, `orders.ts`, `pos.ts`, `customers.ts`
- `src/lib/apiClient.ts` — axios wrapper with Supabase JWT
- `hostinger-backend/db/mysql.js`
- `hostinger-backend/db/schema-mysql.sql`
- `hostinger-backend/db/sync.js`
- `hostinger-backend/routes/database.js`
- `hostinger-backend/routes/products.js`, `orders.js`, `pos.js`, `customers.js`
- `hostinger-backend/lib/crypto.js` — AES encrypt/decrypt

**Edit:**
- `hostinger-backend/server.js` — নতুন routes mount
- `hostinger-backend/package.json` — `mysql2` যোগ
- `src/App.tsx` — `/admin/database-config` route
- `src/components/admin/AdminSidebar.tsx` — নতুন মেনু আইটেম
- Products/Orders/POS পেজগুলো (~১৫টা ফাইল) — `supabase.from(...)` → `repo.*`

**Migration:**
- `system_settings` এ default row insert: `data_source_routing` = সব `supabase`
- নতুন table `mysql_config` (encrypted credentials)

**Secrets:**
- `MYSQL_CONFIG_ENCRYPTION_KEY` (32-byte, auto-generate)

---

## Constraints / Risks

- **Phase 1 এ ১২ মডিউলের মধ্যে ৩টি সম্পূর্ণ পোর্ট হবে** (Products, Orders, POS)। বাকিগুলোর জন্য UI toggle থাকবে কিন্তু backend না বানানো পর্যন্ত enable করলে error দেখাবে।
- **RLS হারানোর ঝুঁকি**: MySQL এ RLS নেই, প্রতিটি route এ `req.user.id` দিয়ে manual ownership check বাধ্যতামূলক।
- **Realtime ভেঙে যাবে** যেসব মডিউল MySQL এ যাবে — Phase 1 এ এদের জন্য realtime subscription disable, polling দিয়ে replace।
- **Triggers/DB functions**: order number generation, stock auto-decrement ইত্যাদি backend route এ Node.js কোডে পোর্ট হবে।
- **প্রথম schema sync ভারী হতে পারে** — UI তে progress + chunked transfer দেখাব।

আপনি অনুমোদন দিলে Phase 1 শুরু করব।
