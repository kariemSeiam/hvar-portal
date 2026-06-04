/**
 * Format address text for UI display (RTL/Arabic).
 * Strips redundant labels when already shown by the UI; adds line breaks for readability.
 * @param {string} raw - Raw address or order description (e.g. "التفاصيل: العنوان: المنيا ...")
 * @returns {string} Formatted for display (labels stripped, breaks after Arabic comma)
 */
export function formatAddressForDisplay(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim();
  // Strip redundant leading labels when UI already shows "التفاصيل:" / "العنوان:"
  const prefixes = [/^التفاصيل:\s*/u, /^العنوان:\s*/u];
  for (const re of prefixes) {
    s = s.replace(re, '').trim();
  }
  // Allow line breaks after Arabic comma for multi-line display (whitespace-pre-line)
  return s.replace(/\s*،\s*/g, '،\n');
}
