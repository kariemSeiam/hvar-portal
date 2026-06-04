/**
 * Production-safe logger utility
 * Automatically disables all logging in production builds
 */

// Use function to get env values to avoid TDZ issues
const getIsProduction = () => {
  try {
    return import.meta.env.PROD === true;
  } catch {
    return process.env.NODE_ENV === 'production';
  }
};

const getIsDevelopment = () => {
  try {
    return import.meta.env.DEV === true;
  } catch {
    return process.env.NODE_ENV !== 'production';
  }
};

/**
 * Logger utility that respects production mode
 * All logs are automatically disabled in production builds
 */
export const logger = {
  log: (...args) => {
    if (!getIsProduction()) {
      console.log(...args);
    }
  },

  error: (...args) => {
    // Always log errors, even in production (for debugging)
    console.error(...args);
  },

  warn: (...args) => {
    if (!getIsProduction()) {
      console.warn(...args);
    }
  },

  info: (...args) => {
    if (!getIsProduction()) {
      console.info(...args);
    }
  },

  debug: (...args) => {
    if (!getIsProduction()) {
      console.debug(...args);
    }
  },

  // Grouped logging
  group: (label) => {
    if (!getIsProduction()) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (!getIsProduction()) {
      console.groupEnd();
    }
  },

  // Table logging
  table: (data) => {
    if (!getIsProduction()) {
      console.table(data);
    }
  },
};

// Export default logger
export default logger;
