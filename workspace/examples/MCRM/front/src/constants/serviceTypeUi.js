/**
 * Shared UI tokens for canonical service types (icons, strip colors, tab styles).
 * Use normalizeServiceType() before lookup when input may be legacy.
 */
import { RotateCcw, Wrench, RefreshCw, Package } from 'lucide-react';
import { normalizeServiceTypeOrFallback } from './serviceTypes.js';

/** @type {Record<string, typeof RotateCcw>} */
export const SERVICE_TYPE_ICONS = {
  replacement: RotateCcw,
  maintenance: Wrench,
  return: RefreshCw,
  sell: Package,
};

export const SERVICE_TYPE_STRIP_BG = {
  replacement: 'bg-brand-blue-500',
  maintenance: 'bg-accent-amber-500',
  return: 'bg-brand-red-500',
  sell: 'bg-accent-green-500',
};

/** Header badge / icon chip classes (canonical keys only) */
export const SERVICE_TYPE_HEADER_ICON_CLASS = {
  replacement: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  maintenance: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  return: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  sell: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
};

/** First word in paired modal titles — same hue family as SERVICE_TYPE_HEADER_ICON_CLASS text */
export const SERVICE_TYPE_TITLE_TEXT_CLASS = {
  replacement: 'text-blue-600 dark:text-blue-400',
  maintenance: 'text-orange-600 dark:text-orange-400',
  return: 'text-red-600 dark:text-red-400',
  sell: 'text-green-600 dark:text-green-400',
};

/** Large modal header icon gradient (ServiceModalHeader `iconColor`) — one map for viewer + confirmations */
export const SERVICE_TYPE_MODAL_ICON_GRADIENT = {
  replacement: 'from-blue-500 to-cyan-500',
  maintenance: 'from-amber-500 to-orange-500',
  return: 'from-brand-red-500 to-pink-500',
  sell: 'from-accent-green-500 to-emerald-500',
};

export const SERVICE_TYPE_TAB_STYLES = {
  replacement: {
    active:
      'bg-brand-blue-100 dark:bg-brand-blue-900/30 text-brand-blue-700 dark:text-brand-blue-300',
    badge: 'bg-brand-blue-200 dark:bg-brand-blue-800',
  },
  maintenance: {
    active:
      'bg-accent-amber-100 dark:bg-accent-amber-900/30 text-accent-amber-700 dark:text-accent-amber-300',
    badge: 'bg-accent-amber-200 dark:bg-accent-amber-800',
  },
  return: {
    active:
      'bg-brand-red-100 dark:bg-brand-red-900/30 text-brand-red-700 dark:text-brand-red-300',
    badge: 'bg-brand-red-200 dark:bg-brand-red-800',
  },
  sell: {
    active:
      'bg-accent-green-100 dark:bg-accent-green-900/30 text-accent-green-700 dark:text-accent-green-300',
    badge: 'bg-accent-green-200 dark:bg-accent-green-800',
  },
};

/**
 * @param {unknown} raw
 * @returns {string} Tailwind classes for header icon chip
 */
export function getServiceTypeHeaderIconClass(raw) {
  const key = normalizeServiceTypeOrFallback(raw);
  return SERVICE_TYPE_HEADER_ICON_CLASS[key] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700/40 dark:text-gray-300';
}
