/**
 * Customer data parsing utilities
 * Handles JSON field parsing with error tolerance
 */

import { logger } from '../core/logger';

/**
 * Parses JSON fields in customer objects (bosta_orders, customer_services)
 * Ensures arrays are properly initialized even if parsing fails
 *
 * @param {Object} customer - Customer object with potentially stringified JSON fields
 * @returns {Object} - Customer object with parsed JSON fields as arrays
 */
export function parseCustomerJSONFields(customer) {
  if (!customer) return customer;

  const parsed = { ...customer };

  // JSON fields that need parsing
  const jsonFields = ['bosta_orders', 'customer_services'];

  jsonFields.forEach(field => {
    // Parse if string
    if (typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        if (import.meta.env.DEV) logger.debug(`parseCustomerJSONFields: parse ${field}`, e);
        parsed[field] = [];
      }
    }

    // Ensure array
    if (!Array.isArray(parsed[field])) {
      parsed[field] = [];
    }
  });

  return parsed;
}

/**
 * Safely parses a JSON string with fallback
 *
 * @param {string} jsonString - String to parse
 * @param {*} fallback - Default value if parsing fails
 * @returns {*} - Parsed value or fallback
 */
export function safeJSONParse(jsonString, fallback = null) {
  if (typeof jsonString !== 'string') return jsonString;

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    if (import.meta.env.DEV) logger.debug('safeJSONParse: failed', e);
    return fallback;
  }
}
