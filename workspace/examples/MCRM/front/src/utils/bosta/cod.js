/** Tolerance for comparing entered amount to Bosta COD (ج.م). */
export const BOSTA_COD_EPS = 0.01;

function toNumberOrNull(raw) {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Extract signed COD from a Bosta order object (unified / enriched shape). */
export function getBostaCodValue(bostaOrder) {
  if (!bostaOrder || typeof bostaOrder !== 'object' || Array.isArray(bostaOrder)) return null;
  const financial =
    bostaOrder.financial && typeof bostaOrder.financial === 'object' && !Array.isArray(bostaOrder.financial)
      ? bostaOrder.financial
      : null;
  return toNumberOrNull(financial?.cod ?? bostaOrder.cod);
}

/**
 * Refund / payout flow (red chip): negative COD in API, or return-pickup order types where COD is still positive.
 */
export function isBostaCodRefundFlow(bostaOrder) {
  if (!bostaOrder || typeof bostaOrder !== 'object' || Array.isArray(bostaOrder)) return false;
  const cod = getBostaCodValue(bostaOrder);
  if (cod != null && cod < 0) return true;
  const rawType = bostaOrder.type ?? bostaOrder.orderType ?? bostaOrder.order_type ?? '';
  const t = typeof rawType === 'string' ? rawType : String(rawType?.name ?? rawType?.code ?? '');
  const norm = t.trim().toLowerCase();
  if (norm === 'return to origin') return true;
  if (norm === 'customer return pickup') return true;
  if (norm.includes('customer return') && norm.includes('pickup')) return true;
  const code = bostaOrder.type?.code ?? bostaOrder.order_type_code ?? bostaOrder.orderTypeCode;
  if (code === 25 || code === '25') return true;
  return false;
}

/**
 * Extract Bosta fee breakdown (net/gross) from unified or legacy payloads.
 * Returns nulls when no fee is available.
 */
export function getBostaFeesValues(bostaOrder) {
  if (!bostaOrder || typeof bostaOrder !== 'object' || Array.isArray(bostaOrder)) {
    return { net: null, gross: null, source: null };
  }
  const financial =
    bostaOrder.financial && typeof bostaOrder.financial === 'object' && !Array.isArray(bostaOrder.financial)
      ? bostaOrder.financial
      : null;

  let net = toNumberOrNull(financial?.bostaFeesNet);
  let gross = toNumberOrNull(financial?.bostaFeesGross ?? financial?.bostaFees ?? bostaOrder.bostaFees);
  const source = typeof financial?.feesSource === 'string' ? financial.feesSource : null;

  if (net == null && gross != null) {
    // Legacy payloads often had one fee number only; preserve behavior while still showing both labels.
    net = source === 'cash_cycle' ? gross : Math.round((gross / 1.14) * 100) / 100;
  }
  if (gross == null && net != null) {
    gross = Math.round((net * 1.14) * 100) / 100;
  }

  return { net, gross, source };
}

/** True when UI should show the combined Bosta fees chip (net and/or gross > 0). */
export function bostaFeesChipVisible(fees) {
  if (!fees || typeof fees !== 'object') return false;
  const net = fees.net ?? 0;
  const gross = fees.gross ?? 0;
  return net > 0 || gross > 0;
}

/**
 * Single line of text for Bosta card "وصف الطرد" / notes (unified + legacy shapes).
 * Prefer package.description; then top-level notes / order_description / description.
 */
export function getBostaOrderNoteText(order) {
  if (!order || typeof order !== 'object' || Array.isArray(order)) return null;
  const pkg = order.package;
  const rawDesc = pkg?.description;
  const fromPkg =
    rawDesc != null && rawDesc !== '' ? String(rawDesc).trim() : '';
  if (fromPkg) return fromPkg;
  const fallbacks = [order.notes, order.order_description, order.description];
  for (const c of fallbacks) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return null;
}

/**
 * True when Bosta card tracking matches a ticket leg (numeric vs HVR-...-suffix, etc.).
 */
export function trackingMatchesLeg(orderTracking, legTracking) {
  const a = String(orderTracking ?? '').trim();
  const b = String(legTracking ?? '').trim();
  if (!a || !b) return false;
  if (a === b) return true;
  const lastA = a.split(/[-/]/).pop() || a;
  const lastB = b.split(/[-/]/).pop() || b;
  if (lastA && lastB && lastA === lastB) return true;
  const da = a.replace(/\D/g, '');
  const db = b.replace(/\D/g, '');
  if (da.length >= 8 && db.length >= 8 && da === db) return true;
  return false;
}

/**
 * Ticket notes when this tracking matches any leg (استرجاع often has empty Bosta package in DB).
 */
export function getTicketNoteForTracking(trackingNumber, services) {
  if (trackingNumber == null || trackingNumber === '') return null;
  if (!Array.isArray(services) || services.length === 0) return null;
  const t = String(trackingNumber).trim();
  for (const s of services) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) continue;
    const legs = [
      s.original_tracking,
      s.new_tracking_receive,
      s.new_tracking_send,
      s.original_tracking_number,
    ]
      .filter(Boolean)
      .map((x) => String(x).trim());
    const hit = legs.some((leg) => trackingMatchesLeg(t, leg));
    if (!hit) continue;
    const n = s.notes;
    if (typeof n === 'string' && n.trim()) return n.trim();
  }
  return null;
}

/**
 * When a new return tracking (e.g. 84768544) is not yet on ticket legs, leg match fails.
 * If there is exactly one service ticket with notes for this customer, use it for CRP cards
 * with empty Bosta description only (avoids wrong copy when multiple tickets exist).
 */
function isCustomerReturnPickupType(orderType) {
  if (typeof orderType !== 'string' || !orderType.trim()) return false;
  const x = orderType.toLowerCase();
  return x.includes('customer return') && x.includes('pickup');
}

function getUniqueTicketNoteForOrphanCrp(services, orderType) {
  if (!isCustomerReturnPickupType(orderType)) return null;
  if (!Array.isArray(services) || services.length === 0) return null;
  const withNotes = services.filter(
    (s) => s && typeof s === 'object' && typeof s.notes === 'string' && s.notes.trim()
  );
  if (withNotes.length !== 1) return null;
  return withNotes[0].notes.trim();
}

/** Text for Bosta card: Bosta unified fields first, then linked service ticket notes. */
export function getBostaOrderDisplayNote(order, linkedServices) {
  const fromBosta = getBostaOrderNoteText(order);
  if (fromBosta) return fromBosta;
  const tr = order?.trackingNumber ?? order?.tracking_number;
  const fromLeg = getTicketNoteForTracking(tr, linkedServices);
  if (fromLeg) return fromLeg;
  const ot = order?.type ?? order?.orderType;
  return getUniqueTicketNoteForOrphanCrp(linkedServices, ot);
}
