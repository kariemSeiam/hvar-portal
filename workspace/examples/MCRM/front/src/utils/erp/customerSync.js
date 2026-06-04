/**
 * ERP Customer Sync Utility
 * 
 * Helper functions to sync customers from ERP draft orders
 */

import { syncCustomersFromERP } from '../../api/callCenterAPI';

/**
 * Sync customers from ERP with date range
 * 
 * @param {Object} options - Sync options
 * @param {string} options.startDate - Start date (YYYY-MM-DD)
 * @param {string} options.endDate - End date (YYYY-MM-DD)
 * @param {string} options.username - ERP username (recommended - uses auto-auth)
 * @param {string} options.password - ERP password (recommended - uses auto-auth)
 * @param {string} options.csrfToken - CSRF token (optional, if not using username/password)
 * @param {string} options.sessionCookie - Session cookie (optional, if not using username/password)
 * @returns {Promise<Object>} Sync results
 * 
 * @example
 * // Method 1: Using username/password (recommended - automatic authentication)
 * const result = await syncCustomersFromERPDateRange({
 *   startDate: '2026-01-01',
 *   endDate: '2026-12-31',
 *   username: 'your_username',
 *   password: 'your_password'
 * });
 * 
 * // Method 2: Using manual tokens (get from browser DevTools)
 * const result = await syncCustomersFromERPDateRange({
 *   startDate: '2026-01-01',
 *   endDate: '2026-12-31',
 *   csrfToken: 'h1mxHiNlSaFfkcn6ASJsm7o1ZG9pJFnHpzUpBGQe',
 *   sessionCookie: 'XSRF-TOKEN=...; hvar_pos_session=...'
 * });
 * 
 * console.log(`Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`);
 */
export const syncCustomersFromERPDateRange = async (options = {}) => {
  const {
    startDate = '2026-01-01',
    endDate = '2026-12-31',
    username,
    password,
    csrfToken,
    sessionCookie
  } = options;

  // Prefer username/password (auto-auth), fallback to manual tokens
  if (!username && !password && (!csrfToken || !sessionCookie)) {
    throw new Error('Either username/password OR csrfToken/sessionCookie are required');
  }

  try {
    console.log('🔄 Starting customer sync from ERP...');
    console.log(`📅 Date range: ${startDate} to ${endDate}`);

    const result = await syncCustomersFromERP({
      start_date: startDate,
      end_date: endDate,
      username,
      password,
      csrfToken,
      sessionCookie
    });

    console.log('✅ Sync completed!');
    console.log(`📊 Results:`, {
      Total: result.total,
      Created: result.created,
      Updated: result.updated,
      Skipped: result.skipped,
      Errors: result.errors.length
    });

    if (result.errors.length > 0) {
      console.warn('⚠️ Errors encountered:', result.errors);
    }

    return result;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
};

/**
 * Quick sync for current month
 * 
 * @param {string} username - ERP username (or csrfToken if using manual auth)
 * @param {string} password - ERP password (or sessionCookie if using manual auth)
 * @param {Object} options - Additional options (csrfToken, sessionCookie if not using username/password)
 */
export const syncCustomersCurrentMonth = async (username, password, options = {}) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return syncCustomersFromERPDateRange({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    username,
    password,
    ...options
  });
};

/**
 * Quick sync for current year
 * 
 * @param {string} username - ERP username (or csrfToken if using manual auth)
 * @param {string} password - ERP password (or sessionCookie if using manual auth)
 * @param {Object} options - Additional options (csrfToken, sessionCookie if not using username/password)
 */
export const syncCustomersCurrentYear = async (username, password, options = {}) => {
  const year = new Date().getFullYear();
  return syncCustomersFromERPDateRange({
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    username,
    password,
    ...options
  });
};

export default {
  syncCustomersFromERPDateRange,
  syncCustomersCurrentMonth,
  syncCustomersCurrentYear
};
