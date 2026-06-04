/**
 * Normalize sidebar / scanner input for GET /api/hub/scan/:token
 * Handles accidental pastes of API base URLs, full scan URLs, and stray slashes.
 */

const REJECT_HOSTISH = /^(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?\/?$/i;

/**
 * @param {string} raw
 * @returns {{ value: string, reason: null | 'empty' | 'invalid_paste' | 'host_only' }}
 */
export function normalizeHubLookupInput(raw) {
  if (raw == null || String(raw).trim() === '') {
    return { value: '', reason: 'empty' };
  }

  let s = String(raw).trim().replace(/^[\s"'«»]+|[\s"'«»]+$/g, '');
  if (!s) {
    return { value: '', reason: 'empty' };
  }

  // Full HTTP(S) URL pasted — extract token, never use host/path as tracking
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      const parts = u.pathname.split('/').filter(Boolean);
      const scanIdx = parts.findIndex((p) => p.toLowerCase() === 'scan');
      if (scanIdx >= 0 && parts[scanIdx + 1]) {
        return { value: decodeURIComponent(parts[scanIdx + 1]), reason: null };
      }
      const fromQuery =
        u.searchParams.get('tracking') ||
        u.searchParams.get('tracking_number') ||
        u.searchParams.get('tn') ||
        u.searchParams.get('q');
      if (fromQuery && fromQuery.trim()) {
        return { value: fromQuery.trim(), reason: null };
      }
      const last = parts[parts.length - 1];
      if (last && !/^(api|hub|tickets|v1|v2)$/i.test(last)) {
        return { value: decodeURIComponent(last), reason: null };
      }
    } catch {
      /* ignore */
    }
    return { value: '', reason: 'invalid_paste' };
  }

  // Path fragment without scheme: .../api/hub/scan/TOKEN or /api/hub/scan/TOKEN
  const scanInPath = s.match(/(?:^|\/)api\/hub\/scan\/([^/?#]+)/i);
  if (scanInPath && scanInPath[1]) {
    return { value: decodeURIComponent(scanInPath[1]), reason: null };
  }

  // Trailing "/api" or "/api/" from mis-paste
  s = s.replace(/\/?api\/?$/i, '').replace(/\/+$/, '').trim();
  if (REJECT_HOSTISH.test(s) || /^\/api\/?$/i.test(s)) {
    return { value: '', reason: 'host_only' };
  }

  s = s.replace(/\s+/g, '');
  return { value: s, reason: null };
}
