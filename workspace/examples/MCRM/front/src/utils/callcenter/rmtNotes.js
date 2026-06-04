import { itemsToDescriptionText } from '../../api/callCenterAPI';

/**
 * Auto-build ملاحظات الاتصال for استبدال / صيانة / إرجاع from selected stock lines.
 * Template:
 *   استبدال / إرجاع: «نوع — هنسلم: …» ثم «هنستلم: …»
 *   صيانة: «صيانة — هنستلم: …» ثم «هنسلم: …» (هنستلم أولاً)
 */
const TYPE_LABEL = {
  replacement: 'استبدال',
  maintenance: 'صيانة',
  return: 'إرجاع'
};

/**
 * Line is backed by stock API / session row with a resolvable id (same idea as sell confirm validation).
 * Excludes autoMatch `not_found` rows so ملاحظات الاتصال لا تُنشأ من نصوص غير مربوطة بالمخزون.
 */
export function isStockBackedRmtLine(it) {
  if (!it || typeof it !== 'object') return false;
  if (it.match_status === 'not_found') return false;
  const id = it.item_id ?? it.product_id ?? it.id;
  return id != null && String(id).trim() !== '';
}

/**
 * Collapse duplicate rows (same stock id + type + condition) into one line with summed qty.
 * Fixes Bosta/autoMatch returning repeated parsed lines for the same SKU (e.g. five × «1× …5070+4» → one × «5× …»).
 * Rows without stock id are kept at the end, unmerged.
 */
export function mergeRmtCartLinesByStockId(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  const map = new Map();
  const passthrough = [];
  for (const it of lines) {
    if (!it || typeof it !== 'object') continue;
    if (!isStockBackedRmtLine(it)) {
      if (it.match_status === 'not_found') continue;
      passthrough.push(it);
      continue;
    }
    const id = it.item_id ?? it.product_id ?? it.id;
    const type = it.type || 'product';
    const cond = it.condition || 'valid';
    const key = `${String(id)}|${type}|${cond}`;
    const q = Math.max(1, Number(it.quantity ?? it.order_quantity) || 1);
    if (map.has(key)) {
      const ex = map.get(key);
      const nq = Math.max(1, Number(ex.quantity ?? ex.order_quantity) || 1) + q;
      map.set(key, { ...ex, quantity: nq, order_quantity: nq });
    } else {
      map.set(key, { ...it, quantity: q, order_quantity: q });
    }
  }
  return [...map.values(), ...passthrough];
}

/** Sell / بيع: merge by stock id + type (no condition). */
export function mergeSellCartLinesByStockId(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  const map = new Map();
  const passthrough = [];
  for (const it of lines) {
    if (!it || typeof it !== 'object') continue;
    const id = it.item_id ?? it.product_id ?? it.id;
    if (id == null || String(id).trim() === '' || it.match_status === 'not_found') {
      if (it.match_status === 'not_found') continue;
      passthrough.push(it);
      continue;
    }
    const type = it.type || 'product';
    const key = `${String(id)}|${type}`;
    const q = Math.max(1, Number(it.quantity ?? it.order_quantity) || 1);
    if (map.has(key)) {
      const ex = map.get(key);
      const nq = Math.max(1, Number(ex.quantity ?? ex.order_quantity) || 1) + q;
      map.set(key, { ...ex, quantity: nq, order_quantity: nq });
    } else {
      map.set(key, { ...it, quantity: q, order_quantity: q });
    }
  }
  return [...map.values(), ...passthrough];
}

/** One segment: qty× name (SKU) — always include qty (incl. 1×) for parity with وصف الطلب (`qty * name`). */
function formatOneItemWithSku(it) {
  if (!it) return '';
  const rawQty = it.order_quantity ?? it.quantity ?? 1;
  const qty = Math.max(1, Number(rawQty) || 1);
  const name = (it.name || '').trim();
  const sku = (it.sku != null && it.sku !== '') ? String(it.sku).trim() : '';
  if (!name && !sku) return '';
  const label = name || sku;
  const showSkuInParens = Boolean(sku && name && sku !== name);
  let segment = `${qty}× ${label}`;
  if (showSkuInParens) {
    segment += ` (${sku})`;
  }
  return segment;
}

function formatDirectionLine(items) {
  const merged = mergeRmtCartLinesByStockId(items || []);
  const parts = merged
    .filter(isStockBackedRmtLine)
    .map((it) => formatOneItemWithSku(it))
    .filter(Boolean);
  return parts.join(' + ');
}

/**
 * Body only (no السبب line). Empty if no items on either side.
 *
 * Example (replacement):
 * استبدال — هنسلم: خلاط … (5069) + مضرب … (1101)
 * هنستلم: مضرب … (1101)
 *
 * Example (maintenance — هنستلم first):
 * صيانة — هنستلم: …
 * هنسلم: …
 */
export function buildRmtCallAutoBlock(itemsToSend, itemsToReceive, callType) {
  const send = formatDirectionLine(itemsToSend);
  const recv = formatDirectionLine(itemsToReceive);
  if (!send && !recv) return '';

  const typeTag = TYPE_LABEL[callType] || '';
  const lines = [];

  if (callType === 'maintenance') {
    if (recv) {
      lines.push(typeTag ? `${typeTag} — هنستلم: ${recv}` : `هنستلم: ${recv}`);
    }
    if (send) {
      if (recv) {
        lines.push(`هنسلم: ${send}`);
      } else {
        lines.push(typeTag ? `${typeTag} — هنسلم: ${send}` : `هنسلم: ${send}`);
      }
    }
  } else {
    if (send) {
      lines.push(typeTag ? `${typeTag} — هنسلم: ${send}` : `هنسلم: ${send}`);
    }
    if (recv) {
      if (!send && typeTag) {
        lines.push(`${typeTag} — هنستلم: ${recv}`);
      } else {
        lines.push(`هنستلم: ${recv}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Split existing notes at first السبب: (start or after newline).
 * Returns { before, afterColon } — afterColon includes text user typed after the marker.
 */
export function splitNotesAtSabab(prevNotes) {
  const prev = prevNotes ?? '';
  const nl = '\nالسبب:';
  const idx = prev.indexOf(nl);
  if (idx !== -1) {
    return {
      before: prev.slice(0, idx).trimEnd(),
      afterColon: prev.slice(idx + nl.length)
    };
  }
  if (prev.startsWith('السبب:')) {
    return { before: '', afterColon: prev.slice('السبب:'.length) };
  }
  return { before: prev.trimEnd(), afterColon: null };
}

/**
 * Split for read-only UI (call history, etc.): same as splitNotesAtSabab, plus inline «... السبب:» on one line.
 * @returns {{ before: string, afterReason: string | null }} — afterReason is null if no «السبب:» marker; else full text after first marker.
 */
export function splitCallNotesForDisplay(prevNotes) {
  const { before, afterColon } = splitNotesAtSabab(prevNotes);
  if (afterColon !== null) {
    return { before, afterReason: afterColon };
  }
  const prev = String(prevNotes ?? '').trimEnd();
  const marker = 'السبب:';
  const idx = prev.indexOf(marker);
  if (idx !== -1) {
    return {
      before: prev.slice(0, idx).trimEnd(),
      afterReason: prev.slice(idx + marker.length)
    };
  }
  return { before: prev, afterReason: null };
}

const looksLikeRmtTemplate = (text) => {
  if (!text || !text.trim()) return false;
  return /هنسلم\s*:/.test(text) || /هنستلم\s*:/.test(text);
};

const looksLikeSellTemplate = (text) => {
  if (!text || !text.trim()) return false;
  return /بيع\s*—\s*المنتجات\s*:/.test(text);
};

/**
 * بيع: auto block «بيع — المنتجات: …» from cart (same ERP format as وصف الطلب), مع الحفاظ على «السبب:» كما في RMT.
 */
export function mergeSellSessionNotes(prevNotes, items, options = {}) {
  const discardLegacyCallNotes = options.discardLegacyCallNotes === true;
  const productLine = itemsToDescriptionText(items || []).trim();
  const auto = productLine ? `بيع — المنتجات: ${productLine}` : '';

  if (!auto) {
    const rawCount = (items || []).length;
    if (rawCount > 0) {
      const prevEmpty = (prevNotes ?? '').trimEnd();
      const { afterColon } = splitNotesAtSabab(prevEmpty);
      if (afterColon !== null) {
        return `السبب:${afterColon}`.trimEnd();
      }
      if (discardLegacyCallNotes || looksLikeSellTemplate(prevEmpty)) {
        return 'السبب: ';
      }
      return prevEmpty;
    }
    return (prevNotes ?? '').trimEnd();
  }

  const prev = (prevNotes ?? '').trimEnd();
  const { afterColon } = splitNotesAtSabab(prev);

  if (afterColon !== null) {
    return `${auto}\nالسبب:${afterColon}`;
  }

  if (!prev) {
    return `${auto}\nالسبب: `;
  }

  if (looksLikeSellTemplate(prev) || looksLikeRmtTemplate(prev) || discardLegacyCallNotes) {
    return `${auto}\nالسبب: `;
  }

  return `${auto}\nالسبب:\n${prev}`;
}

/**
 * Merge auto block from items with previous notes, preserving السبب: suffix when present.
 *
 * @param {object} [options]
 * @param {boolean} [options.discardLegacyCallNotes] — When true (e.g. no Bosta shipment note), do not keep old
 *   snapshot/call/body text under السبب; only هنسلم/هنستلم + fresh السبب line (still keep text user already typed after «السبب:»).
 */
export function mergeRmtCallNotes(prevNotes, itemsToSend, itemsToReceive, callType, options = {}) {
  const discardLegacyCallNotes = options.discardLegacyCallNotes === true;

  const rawRowCount = (itemsToSend?.length || 0) + (itemsToReceive?.length || 0);
  const auto = buildRmtCallAutoBlock(itemsToSend, itemsToReceive, callType).trimEnd();

  /** Cart has rows but none are stock-backed → strip هنسلم/هنستلم block; keep السبب: suffix only when present. */
  if (!auto) {
    if (rawRowCount > 0) {
      const prevEmpty = (prevNotes ?? '').trimEnd();
      const { afterColon } = splitNotesAtSabab(prevEmpty);
      if (afterColon !== null) {
        return `السبب:${afterColon}`.trimEnd();
      }
      if (discardLegacyCallNotes || looksLikeRmtTemplate(prevEmpty)) {
        return 'السبب: ';
      }
      return prevEmpty;
    }
    return (prevNotes ?? '').trimEnd();
  }

  const prev = (prevNotes ?? '').trimEnd();
  const { afterColon } = splitNotesAtSabab(prev);

  if (afterColon !== null) {
    return `${auto}\nالسبب:${afterColon}`;
  }

  if (!prev) {
    return `${auto}\nالسبب: `;
  }

  if (looksLikeRmtTemplate(prev) || discardLegacyCallNotes) {
    return `${auto}\nالسبب: `;
  }

  return `${auto}\nالسبب:\n${prev}`;
}
