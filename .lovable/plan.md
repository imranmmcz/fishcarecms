## Phase 3 — Production readiness for hybrid routing

তিনটে ডেলিভারেবল, একসাথে ডেলিভার করা হবে, প্রতিটার নিজস্ব verification আছে।

---

### 1. Data migration tool (Supabase → MySQL)

**উদ্দেশ্য**: টগল ফ্লিপ করার আগে যেন প্রতি মডিউলের ডাটা MySQL-এ নিরাপদে কপি হয়ে যায়।

**Backend** (`hostinger-backend/routes/migration.js`):
- `POST /api/migration/import/:module` — body `{ rows: [...] }`, transactional insert into MySQL। Idempotent: `INSERT ... ON DUPLICATE KEY UPDATE` UUID PK-এ। Batch size 500।
- `GET /api/migration/count/:module` — শুধু row count রিটার্ন, verification-এর জন্য।
- Supports: `products`, `product_variations`, `categories`, `brands`, `customers`, `orders`+`order_items`, `pos_sales`+`pos_sale_items`, `pos_shifts`, `pos_expenses`, `stock_adjustments`, `purchase_orders`+`purchase_order_items`।

**Frontend** (`src/pages/AdminDataMigration.tsx` + route `/admin/data-migration`):
- প্রতি মডিউলের জন্য একটা কার্ড: Supabase count, MySQL count, "Migrate" button, progress bar।
- Client Supabase থেকে paginated (500/batch) pull করে → backend `/import`-এ POST → progress আপডেট।
- Dry-run mode: শুধু counts দেখায়, actual copy skip।
- Migration log toast + audit entry।

**Admin nav**: `AdminDatabaseConfig`-এর top-এ একটা link — "First migrate data, then flip toggle"।

---

### 2. MySQL health / observability dashboard

**Backend** (`hostinger-backend/routes/health.js`):
- `GET /api/health/summary` — returns:
  - Server uptime, Node version, memory usage
  - MySQL connection pool stats (active, idle, waiting)
  - Per-module row counts (products, orders, customers, pos_sales ইত্যাদি)
  - Last query latency (running `SELECT 1` timed)
- `GET /api/health/recent-errors` — বাফারড শেষ 50 request errors (in-memory ring buffer, `middleware/errorLogger.js` থেকে)।
- `GET /api/health/latency` — শেষ 100 requests-এর p50/p95/p99, per-route।

**Middleware** (`hostinger-backend/middleware/metrics.js`):
- সব request-এ latency + status track করে ring buffer-এ push।
- Error middleware সব 4xx/5xx-কে recent-errors buffer-এ রাখে।

**Frontend** (`src/pages/AdminSystemHealth.tsx` + route `/admin/system-health`):
- Auto-refresh every 10s।
- Cards: Backend status (uptime/memory), Pool health, Row counts (Supabase বনাম MySQL side-by-side), Latency chart (Recharts), Recent errors table।
- `AdminDatabaseConfig`-এ "System Health" পাশে link।

---

### 3. Backend hardening

**Input validation** (`hostinger-backend/middleware/validate.js`):
- Zod-স্টাইল লাইটওয়েট validator (already zero-dep বজায় রাখতে হাতে লেখা `validateBody(schema)` helper — টাইপ চেক + required + max length)।
- Wire করা হবে: `purchases.js`, `pos.js`, `stock.js`, `catalog.js`, `orders.js`-এর POST/PATCH endpoints-এ।

**Auth middleware audit** (`hostinger-backend/middleware/auth.js`):
- `requireAdmin` কে সব admin-write routes-এ enforce (currently mixed)। প্রতিটা mutating route review + fix।
- JWT expiry check strict + malformed token clear error।

**Structured errors** (`hostinger-backend/middleware/errorHandler.js`):
- একটা centralized error middleware: `{ error, code, requestId, timestamp }` shape।
- `requestId` (`nanoid`-স্টাইল crypto.randomUUID) সব request-এ inject, response header-এ ফেরত — health dashboard-এর error log-এর সাথে ম্যাচ করে।

**Security headers**: `helmet`-এর replacement হিসেবে manual middleware — CSP, HSTS, X-Frame-Options, no-sniff (already partly present, gap fill)।

*Note*: Rate limiting আপাতত স্কিপ — Lovable directive অনুযায়ী standard primitive না থাকা পর্যন্ত ad-hoc যোগ করা হবে না। User চাইলে আলাদা কথা বলবে।

---

### Verification checklist

- Migration: dev DB থেকে `products` মাইগ্রেট → MySQL count == Supabase count, তারপর `/admin/database-config`-এ toggle flip → product list MySQL থেকে লোড হয়।
- Health: `/admin/system-health` লাইভ metrics দেখাচ্ছে, backend intentionally kill করলে "offline" badge, error inject করলে recent-errors-এ দেখায়।
- Hardening: invalid POST body → 400 with structured error; missing JWT → 401; response header-এ `X-Request-Id` আসছে, health dashboard-এ same ID-তে error resolve করা যায়।
- `tsgo` clean, backend `node -c` clean।

---

### Out of scope

- Automated bi-directional sync (still manual migrate-then-toggle)
- Rate limiting (deferred)
- Log persistence to disk/DB (in-memory ring buffer এখন যথেষ্ট)
- Migrating `partners`, `security_audit_logs`, `profiles` (Supabase-এ থাকবে)
