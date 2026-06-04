import { getBostaOrderDisplayNote, getBostaOrderNoteText } from '../bosta/cod';

/**
 * Text used to parse lines into stock-backed rows (autoMatchItems).
 * Prefer Bosta package / parcel fields; then display note (may include ticket copy); then ERP order line.
 */
export function getShipmentTextForItemMatch(bostaOrder, linkedServices = [], orderDescriptionFallback = '') {
  const fromPkg = (getBostaOrderNoteText(bostaOrder) || '').trim();
  if (fromPkg) return fromPkg;
  const fromDisplay = (getBostaOrderDisplayNote(bostaOrder, linkedServices || []) || '').trim();
  if (fromDisplay) return fromDisplay;
  return String(orderDescriptionFallback || '').trim();
}
