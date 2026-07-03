## Phase 2 — Next Steps

Three focused deliverables to close out hybrid routing.

### 1. Mark catalog modules as MySQL-ready
`categories`, `brands`, `product_variations` — backend routes + repo facades already exist but are still greyed-out in `AdminDatabaseConfig` because they're missing from `MYSQL_READY_MODULES`. Add them so admins can flip the toggle.

- `src/lib/dataSource.ts` → add the three keys to `MYSQL_READY_MODULES`.
- Quick smoke test each list/CRUD call after switching to MySQL.

### 2. Realtime → polling fallback for MySQL-routed modules
When a module is routed to MySQL, its Supabase realtime channels never fire. Replace them with a lightweight `useModulePolling(module, refetch, intervalMs)` hook.

- New file `src/hooks/useModulePolling.ts` — if `isMysql(module)` returns true, run `setInterval(refetch, interval)`; else no-op (Supabase realtime keeps working).
- Wire into the hot paths:
  - `useOrders` (admin orders live updates)
  - `ProductsContext` (product stock/price changes)
  - `usePosExpenses` and POS sales list
- Default interval 15s; visibilitychange pauses when tab hidden.

### 3. Remaining POS page migrations
Port the last POS pages still calling `supabase.from(...)` directly to the repo facades so the MySQL toggle actually covers all of POS.

- `POSDueCollections.tsx`, `POSCustomerDueReport.tsx` → `posRepo` + `customersRepo`
- `POSSalesReport.tsx`, `POSPurchaseReport.tsx` → `posRepo` / `purchasesRepo`
- `POSSalesReturns.tsx`, `POSPurchaseReturns.tsx` → sales/purchases facades
- `POSStockTransfers.tsx` → `stockAdjustmentsRepo` (transfers are paired adjustments)

### Verification
- `tsgo` clean build.
- Toggle each newly-ready module in `/admin/database-config` and confirm list pages load from MySQL when backend is up, fall back to Supabase when toggled off.
- With MySQL routing on, confirm orders list refreshes within 15s of a new order without a page reload (polling working).

### Out of scope (later phase)
- Bi-directional Supabase ↔ MySQL sync
- File uploads moving to Hostinger filesystem
- Migrating `partners`, `security_audit_logs`, `profiles` (stay on Supabase by design)
