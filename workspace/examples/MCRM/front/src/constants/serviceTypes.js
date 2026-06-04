/**
 * Canonical service types — must match app/utils/validators.py validate_service_type
 * and app/api/service_api.py ticket creation.
 */
export const CANONICAL_SERVICE_TYPES = Object.freeze([
  'replacement',
  'maintenance',
  'return',
  'sell',
]);

const CANONICAL_SET = new Set(CANONICAL_SERVICE_TYPES);

/**
 * Legacy keys seen on tickets, orders, or old action payloads → canonical service_type.
 * part_replace / full_replace: old action granularity → replacement ticket family.
 */
export const LEGACY_TO_CANONICAL_SERVICE_TYPE = Object.freeze({
  return_from_customer: 'return',
  maintenancing: 'maintenance',
  part_replace: 'replacement',
  full_replace: 'replacement',
});

const warnedUnknownTypes = import.meta.env.DEV ? new Set() : null;

/**
 * @param {unknown} raw
 * @returns {string | null} Canonical service_type or null if unknown/empty
 */
export function normalizeServiceType(raw) {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (CANONICAL_SET.has(s)) return s;
  const mapped = LEGACY_TO_CANONICAL_SERVICE_TYPE[s];
  if (mapped) return mapped;
  if (warnedUnknownTypes && !warnedUnknownTypes.has(s)) {
    warnedUnknownTypes.add(s);
    console.warn(`[serviceTypes] Unknown service_type "${raw}" — callers should treat as unsupported`);
  }
  return null;
}

/**
 * @param {unknown} raw
 * @param {{ fallback?: string }} [opts]
 * @returns {string} Canonical type, or opts.fallback (default replacement)
 */
export function normalizeServiceTypeOrFallback(raw, opts = {}) {
  const { fallback = 'replacement' } = opts;
  return normalizeServiceType(raw) ?? fallback;
}

/** Full Arabic labels for canonical types (tooltips, headers) */
export const SERVICE_TYPE_LABELS_AR_FULL = Object.freeze({
  replacement: 'استبدال',
  maintenance: 'صيانة',
  return: 'استرجاع',
  sell: 'المبيعات',
});

/** Short Arabic for dense UI */
export const SERVICE_TYPE_LABELS_AR_SHORT = Object.freeze({
  replacement: 'استبدال',
  maintenance: 'صيانة',
  return: 'استرجاع',
  sell: 'مبيعات',
});

/**
 * @param {unknown} raw
 * @param {{ short?: boolean }} [opts]
 * @returns {string} Arabic label; unknown raw → raw string or "—"
 */
export function getServiceTypeLabelAr(raw, opts = {}) {
  const { short = false } = opts;
  const canonical = normalizeServiceType(raw);
  const map = short ? SERVICE_TYPE_LABELS_AR_SHORT : SERVICE_TYPE_LABELS_AR_FULL;
  if (canonical) return map[canonical] ?? canonical;
  if (raw === undefined || raw === null || String(raw).trim() === '') return '—';
  return String(raw);
}
