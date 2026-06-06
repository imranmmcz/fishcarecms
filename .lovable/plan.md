
# Partner Referral, Coupon & Commission System

Given the size (10+ tables, partner portal, admin tooling, wallet, withdrawals, reports, notifications), I'll ship this in **3 phases**. Each phase is independently usable. We start with Phase 1 now; you approve it, ship it, then say "go" for Phase 2.

## Decisions locked
- Partner login = reuse existing auth + new `partner` role (added to `app_role` enum).
- Discount reduces order total. Commission % is calculated on the **discounted subtotal** (excludes shipping).
- Single-level only. Schema includes no MLM hooks.
- Bengali-first UI, mobile responsive, dark-mode aware (uses existing design tokens).

---

## Phase 1 — Foundation (this iteration)

**Goal:** Partners can apply, admin can approve, codes work at checkout, commissions are recorded on delivery.

### Database (one migration)
- Add `'partner'` to `app_role` enum.
- `partners` — user_id (FK auth.users), status (pending/approved/rejected/suspended), full_name, father_name, mother_name, dob, nid_number, mobile, whatsapp, email, present_address, permanent_address, profile_photo_url, nid_front_url, nid_back_url, company_name, company_type, designation, company_address, trade_license, reference_person, reference_mobile, bank_name, account_name, account_number, branch_name, bkash, nagad, rocket, experience, notes, social_links jsonb, approved_at, approved_by, rejection_reason.
- `partner_referral_codes` — partner_id, code (unique, uppercase), discount_type (percentage/fixed/free_shipping), discount_value, max_discount_amount, min_order_amount, commission_type (percentage/fixed), commission_value, usage_limit, used_count, valid_from, valid_until, is_active.
- `partner_referral_clicks` — code, ip, user_agent, referrer, landing_url, clicked_at (lightweight attribution log).
- `partner_commissions` — partner_id, order_id, code_id, code_used, order_subtotal, discount_amount, commissionable_amount, commission_type, commission_value, commission_amount, status (pending/approved/paid/cancelled), approved_at, paid_at.
- Extend `orders` with: `referral_code`, `partner_id`, `referral_discount` (numeric).
- RLS: partners read/update own row (limited fields), admins manage all; partners see only their own codes/commissions; public can SELECT active codes by `code` value (needed for validation at checkout); commissions write only via trigger.
- Trigger: when `orders.status` transitions to `delivered`, mark related `partner_commissions` row `approved`. On `cancelled`/`refunded`, mark `cancelled`.
- Trigger: when an order with `referral_code` is INSERTed, create `partner_commissions` row (status=`pending`).
- All required `GRANT`s.

### Frontend
- **`/partner/apply`** — public registration form (sign in first if not authed), all required fields, document uploads to `partner-documents` storage bucket (created private with admin + owner RLS). Bengali labels.
- **Auto-attribution**: small effect in `App.tsx` reads `?ref=CODE` from URL → stores in `localStorage('referral_code')` + logs a click row.
- **Checkout integration** (`src/pages/Checkout.tsx`):
  - "Apply Coupon / Referral Code" field with validation against `partner_referral_codes` (active, within dates, under usage limit, meets min_order_amount).
  - Shows discount line; writes `referral_code`, `partner_id`, `referral_discount` on the order.
- **Admin → `/admin/partners`** — list with status filter, view application + documents, Approve / Reject / Suspend / Request docs. Approving auto-generates a code (`PARTNER` + 4-digit) if none exists and grants `partner` role.
- **Admin → `/admin/partners/codes`** — create/edit codes manually, set discount + commission rules, activate/deactivate.
- **Admin → `/admin/partners/commissions`** — table of commissions with status filter, bulk approve.

### Sidebar / routing
- Add "Partners" group to `AdminLayout` with three links above.
- Add public route for `/partner/apply`.

---

## Phase 2 — Partner Portal (next iteration)

- New `partner` layout + `ProtectedRoute requirePartner`.
- `/partner` dashboard widgets: total referral orders, total sales, total commission, pending/approved/paid, available balance.
- Charts (Recharts): monthly sales, monthly commission.
- Tables: recent referred orders, commission history.
- `/partner/profile` — edit limited fields, change docs.
- `/partner/codes` — view own code(s), copy referral link, share buttons.
- Bilingual, mobile cards on small screens.

## Phase 3 — Wallet, Withdrawals, Reports, Notifications

- `partner_wallets` (balance, pending, withdrawable — maintained via triggers).
- `partner_withdrawals` (method, amount, status, admin notes).
- Partner withdraw request UI + admin approval queue + mark paid.
- Admin reports: sales by partner, top performers, payout report, PDF/CSV/Excel export (reuses existing PDF infra with Kalpurush font).
- Notifications: partner approved, sale received, commission added, withdrawal approved/paid — via existing `notifications` table + SMS/WhatsApp/email channels already wired.
- Optional fraud guards: prevent self-referral (block when `order.user_id = partner.user_id`), one code per order, duplicate-IP detection counter.

---

## Out of scope (won't build unless asked)
- Multi-level / two-tier commissions.
- Per-product / per-category / per-brand commission rules (current model is per-code; we can extend in Phase 3 if needed — say the word).
- Coupon stacking with existing `campaigns` coupons. Referral codes are validated independently; only one code applies per order.

---

## Phase 1 deliverables (files)
- New migration: partners + codes + clicks + commissions + triggers + RLS + grants + storage bucket policies.
- New: `src/pages/PartnerApply.tsx`, `src/pages/AdminPartners.tsx`, `src/pages/AdminPartnerCodes.tsx`, `src/pages/AdminPartnerCommissions.tsx`, `src/hooks/usePartnerCode.ts`.
- Edited: `src/App.tsx` (routes + ref capture), `src/pages/Checkout.tsx` (coupon field), `src/components/AdminLayout.tsx` (sidebar links), `src/hooks/useOrders.ts` (pass referral fields).
