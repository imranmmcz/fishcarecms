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
  const digits = String(raw).replace(/\D+/g, '');
  if (!digits) return null;
  if (digits.length === 13 && digits.startsWith('88')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

module.exports = { normalizePhone };