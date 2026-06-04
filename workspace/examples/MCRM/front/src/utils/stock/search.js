/**
 * Client-side stock search: multi-word AND matching, Arabic normalization, ranking.
 * Used by searchStockItems (call center + order editor).
 */

const AR_DIACRITICS = /[\u064B-\u065F\u0670]/g;

/** Eastern / Persian digits → Latin 0–9 */
function normalizeDigits(s) {
  return String(s)
    .replace(/[\u0660-\u0669]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x0660 + 0x30))
    .replace(/[\u06f0-\u06f9]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x06f0 + 0x30));
}

/**
 * Lowercase + collapse spaces + Arabic variants + digits unified for matching.
 */
export function normalizeSearchText(str) {
  if (str == null || str === '') return '';
  let s = String(str);
  s = s.replace(AR_DIACRITICS, '');
  s = normalizeDigits(s);
  s = s.toLowerCase();
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/[أإآٱ]/g, 'ا');
  s = s.replace(/ى/g, 'ي');
  s = s.replace(/ؤ/g, 'و');
  s = s.replace(/ئ/g, 'ي');
  s = s.replace(/ة/g, 'ه');
  return s;
}

/**
 * Split query on spaces and Arabic comma; normalize each token.
 */
export function tokenizeSearchQuery(q) {
  if (!q || !String(q).trim()) return [];
  const raw = String(q).trim();
  const parts = raw.split(/[\s\u060c]+/).filter(Boolean);
  const tokens = parts.map((p) => normalizeSearchText(p)).filter(Boolean);
  return tokens.slice(0, 14);
}

function scoreTokenInField(field, token) {
  if (!field || !token) return 0;
  if (field === token) return 500;
  if (field.startsWith(token)) return 220;
  const idx = field.indexOf(token);
  if (idx === -1) return 0;
  return 120 + Math.max(0, 40 - Math.min(idx, 40));
}

function scoreItem(name, sku, tokens) {
  let score = 0;
  const fullJoin = tokens.join(' ');
  if (fullJoin.length >= 2) {
    if (name.includes(fullJoin)) score += 180;
    if (sku.includes(fullJoin)) score += 220;
  }
  for (const t of tokens) {
    const sn = scoreTokenInField(name, t);
    const ss = scoreTokenInField(sku, t);
    score += Math.max(sn, ss + 25);
  }
  return score;
}

/**
 * @param {object[]} items — raw stock rows from API
 * @param {string} query — user search string
 * @param {'product'|'part'|'all'} typeFilter
 * @returns {object[]} same items, filtered and sorted by relevance (desc)
 */
export function filterAndRankStockItems(items, query, typeFilter = 'all') {
  const list = Array.isArray(items) ? items : [];
  let working = list;
  if (typeFilter !== 'all') {
    working = working.filter((item) => item.type === typeFilter);
  }

  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) {
    return [...working];
  }

  const out = [];
  for (const item of working) {
    const name = normalizeSearchText(item.name || '');
    const sku = normalizeSearchText(String(item.sku ?? ''));
    const hay = `${name} ${sku}`;
    let ok = true;
    for (const t of tokens) {
      if (!hay.includes(t)) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    out.push({ item, score: scoreItem(name, sku, tokens) });
  }
  out.sort((a, b) => b.score - a.score);
  return out.map(({ item }) => item);
}
