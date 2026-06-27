/**
 * Server-side phone normalization.
 *
 * Goal: make `customer_phone` uniqueness reliable regardless of how the
 * number was typed. We store the original `customer_phone` exactly as
 * entered, and a canonical `customer_phone_normalized` that the unique
 * index is built on.
 *
 * Rules (Bangladesh-aware, but safe for any number):
 *   1. Strip every non-digit (spaces, dashes, parentheses, "+", etc).
 *   2. If the result is 13 digits and starts with "88" (BD country code),
 *      drop the leading "88"  -> "8801712345678" → "1712345678".
 *   3. Else if 11 digits and starts with "0" (BD local prefix),
 *      drop the leading "0"   -> "01712345678"   → "1712345678".
 *   4. Otherwise return the digits as-is.
 *
 * Returns `null` for empty / unusable input so the column stays nullable
 * instead of unique-colliding on empty strings.
 */
function normalizePhone(raw) {
  if (raw === null || raw === undefined) return null;
  let digits = String(raw).replace(/\D+/g, '');
  if (!digits) return null;
  // Strip BD country code "88" if present (covers "+8801...", "008801...", "8801...").
  if (digits.length >= 12 && digits.startsWith('88')) digits = digits.slice(2);
  // Strip a single leading "0" (local BD prefix) if what remains is the
  // typical 11-digit "0XXXXXXXXXX" form.
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits || null;
}

module.exports = { normalizePhone };