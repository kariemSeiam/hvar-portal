/**
 * Signed money parsing/formatting for ticket cost_adjustment, COD, etc.
 * Aligns with call-center session semantics: negative = استرداد, positive = تحصيل.
 */

export function parseMoneyValue(raw) {
  if (raw == null || raw === '') return 0;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const s = String(raw).replace(/,/g, '').trim();
  if (s === '') return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Eastern Arabic numerals + ج.م; magnitude only (no sign). */
export function formatMoneyArEGP(magnitude) {
  const m = Math.abs(parseMoneyValue(magnitude));
  return m.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
