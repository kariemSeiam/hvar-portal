/**
 * Shared parsing for customer_services snapshots + API ticket rows
 * (ServiceModalViewer related list, CallSessionFAB, Bosta panel).
 */

export function getTicketNotesRawForDisplay(ticket) {
  if (!ticket || typeof ticket !== 'object' || Array.isArray(ticket)) return null;
  const keys = ['notes', 'description', 'issue_description', 'customer_notes', 'internal_notes', 'summary', 'reason'];
  for (const k of keys) {
    const v = ticket[k];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) return v;
  }
  return null;
}

/** Match service ticket to a cached Bosta order by tracking fields. */
export function findBostaOrderForServiceTicket(ticket, bostaOrders) {
  if (!ticket || typeof ticket !== 'object' || !Array.isArray(bostaOrders)) return null;
  const keys = ['original_tracking', 'original_tracking_number', 'new_tracking_send', 'new_tracking_receive']
    .map((k) => ticket[k])
    .filter(Boolean)
    .map((s) => String(s).trim().toLowerCase());
  if (!keys.length) return null;
  for (const o of bostaOrders) {
    if (!o || typeof o !== 'object') continue;
    const tn = String(o.trackingNumber || o.tracking_number || '').trim().toLowerCase();
    if (tn && keys.includes(tn)) return o;
  }
  return null;
}

/**
 * When customer_services snapshot has no notes (DB JSON not refreshed), use linked Bosta package / order notes.
 */
export function enrichTicketNotesFromBosta(ticket, bostaOrders) {
  const order = findBostaOrderForServiceTicket(ticket, bostaOrders);
  if (!order) return null;
  const pkg = order.package || {};
  const desc = typeof pkg.description === 'string' ? pkg.description.trim() : '';
  const orderNotes = typeof order.notes === 'string' ? order.notes.trim() : '';
  const line = desc || orderNotes;
  return line || null;
}

/**
 * When snapshot has no service_items yet (PENDING / not rebuilt), derive chip counts from linked Bosta package.
 */
export function buildSyntheticItemsFromBosta(ticket, bostaOrders) {
  const order = findBostaOrderForServiceTicket(ticket, bostaOrders);
  if (!order?.package) return [];
  const pkg = order.package;
  const n = Math.max(1, Number(pkg.itemsCount) || 1);
  const typeStr = String(order.type || '').trim();
  const desc = (typeof pkg.description === 'string' && pkg.description.trim())
    ? pkg.description.trim()
    : (typeof order.notes === 'string' && order.notes.trim() ? order.notes.trim() : 'عناصر الشحنة');

  if (/exchange/i.test(typeStr)) {
    if (n >= 2) {
      return [
        { direction: 'send', type: 'product', name: desc, quantity: 1 },
        { direction: 'receive', type: 'product', name: desc, quantity: 1 },
      ];
    }
    return [{ direction: 'receive', type: 'product', name: desc, quantity: 1 }];
  }
  if (/send/i.test(typeStr)) {
    return [{ direction: 'send', type: 'product', name: desc, quantity: n }];
  }
  if (/return|receive|pickup|customer_return/i.test(typeStr)) {
    return [{ direction: 'receive', type: 'product', name: desc, quantity: n }];
  }
  return [{ direction: 'receive', type: 'product', name: desc, quantity: n }];
}

export function getTicketItemsForDisplay(ticket, bostaOrders) {
  const fromDb = normalizeTicketItemsArray(ticket);
  if (fromDb.length > 0) return fromDb;
  return buildSyntheticItemsFromBosta(ticket, bostaOrders);
}

export function normalizeTicketItemsArray(ticket) {
  if (!ticket || typeof ticket !== 'object') return [];
  let raw = ticket.items ?? ticket.service_items ?? ticket.order_items;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  return Array.isArray(raw) ? raw : [];
}

export function ticketHasBostaTracking(t) {
  return !!(t?.original_tracking || t?.original_tracking_number || t?.new_tracking_send || t?.new_tracking_receive);
}
