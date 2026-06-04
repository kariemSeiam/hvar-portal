/**
 * Phone number utilities for HVAR Hub
 * Handles Egyptian phone number normalization and validation
 */

/**
 * Normalize Egyptian phone numbers to 01XXXXXXXXX format (local format)
 * Handles various input formats:
 * - +201221367172 -> 01221367172
 * - 201221367172 -> 01221367172
 * - 01221367172 -> 01221367172 (already correct)
 * - 1221367172 -> 01221367172
 *
 * @param {string} phone - Raw phone number input
 * @returns {string} - Normalized phone number in 01XXXXXXXXX format
 */
export const normalizeEgyptPhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return "";
  }

  // Remove all non-digit characters (spaces, dashes, parentheses, +, etc.)
  let cleanPhone = phone.replace(/\D/g, "");

  if (!cleanPhone) {
    return "";
  }

  // Normalization rules
  if (cleanPhone.startsWith("2001") && cleanPhone.length === 13) {
    // +2001XXXXXXXXX -> remove 2001, keep XXXXXXXXX (9 digits), add 01 -> 01XXXXXXXXX
    return "01" + cleanPhone.substring(4);
  } else if (cleanPhone.startsWith("201") && cleanPhone.length === 12) {
    // 201XXXXXXXXX -> remove 20, keep 1XXXXXXXXX, add leading 0 -> 01XXXXXXXXX
    return "0" + cleanPhone.substring(2);
  } else if (cleanPhone.startsWith("201") && cleanPhone.length === 13) {
    // 201XXXXXXXXXXX (13 digits) -> remove 201, add 01
    return "01" + cleanPhone.substring(3);
  } else if (cleanPhone.startsWith("01") && cleanPhone.length === 11) {
    // 01XXXXXXXXX -> keep as is
    return cleanPhone;
  } else if (cleanPhone.startsWith("1") && cleanPhone.length === 10) {
    // 1XXXXXXXXX -> add leading 0 -> 01XXXXXXXXX
    return "0" + cleanPhone;
  } else if (cleanPhone.length === 9) {
    // XXXXXXXXX (9 digits) -> assume missing leading 01 -> 01XXXXXXXXX
    return "01" + cleanPhone;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith("20")) {
    // 20XXXXXXXXXX -> remove 20, add 0
    return "0" + cleanPhone.substring(2);
  }

  // If we can't determine the format, return as is (for backward compatibility)
  return cleanPhone;
};

/**
 * Validate if a phone number is a valid Egyptian mobile number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid Egyptian mobile number
 */
export const isValidEgyptPhone = (phone) => {
  const normalized = normalizeEgyptPhone(phone);

  const patterns = [
    /^01[0-9]{9}$/, // Mobile: 01xxxxxxxxx
    /^02[0-9]{8}$/, // Cairo landline: 02xxxxxxxx
    /^03[0-9]{8}$/, // Alexandria landline: 03xxxxxxxx
    /^0[4-7][0-9]{8}$/, // Other governorates: 04-07xxxxxxxx
  ];

  return patterns.some((pattern) => pattern.test(normalized));
};

/**
 * Format phone number for display (with spaces for readability)
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number for display (01X XXXX XXXX)
 */
export const formatPhoneForDisplay = (phone) => {
  const normalized = normalizeEgyptPhone(phone);

  if (normalized.length === 11 && normalized.startsWith("01")) {
    // Format as 01X XXXX XXXX
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 7)} ${normalized.slice(7)}`;
  }

  return normalized;
};

/**
 * Format phone number for local display (always returns 01XXXXXXXXX format)
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number in 01XXXXXXXXX format
 */
export const formatPhoneForLocalDisplay = (phone) => {
  if (!phone || typeof phone !== "string") {
    return phone;
  }

  // Normalize to 01XXXXXXXXX format
  return normalizeEgyptPhone(phone);
};

/**
 * Detect if input is likely a phone number
 * @param {string} input - Input to analyze
 * @returns {boolean} - True if input looks like a phone number
 */
export const isPhoneNumber = (input) => {
  if (!input || typeof input !== "string") {
    return false;
  }

  const cleanInput = input.replace(/\D/g, "");

  // Check various phone number patterns (accepts any format)
  const patterns = [
    /^2001\d{9}$/, // +2001XXXXXXXXX (13 digits)
    /^\+?201\d{9}$/, // +201XXXXXXXXX or 201XXXXXXXXX (12 digits)
    /^01\d{9}$/, // 01XXXXXXXXX (11 digits)
    /^1\d{9}$/, // 1XXXXXXXXX (10 digits)
    /^\d{9}$/, // XXXXXXXXX (9 digits, might be missing leading 01)
  ];

  return patterns.some((pattern) => pattern.test(cleanInput));
};

/**
 * Auto-detect search type based on input
 * @param {string} input - Search input
 * @returns {string} - Detected search type ('phone', 'tracking', null)
 */
export const detectSearchType = (input) => {
  if (!input || typeof input !== "string") {
    return null; // Let API decide (general search)
  }

  const trimmedInput = input.trim();

  // Check if it's a phone number
  if (isPhoneNumber(trimmedInput)) {
    return "phone";
  }

  // Check if it's a tracking number (6+ characters, alphanumeric or with hyphens)
  // Examples: 6400572, BOS-123456, 17044539, HVR-20251017-214815266
  if (trimmedInput.length >= 6 && /^[A-Za-z0-9-]+$/.test(trimmedInput)) {
    return "tracking";
  }

  // Default to null (let API handle general search)
  return null;
};

/**
 * Get search placeholder based on search type
 * @param {string} searchType - Type of search
 * @returns {string} - Appropriate placeholder text
 */
export const getSearchPlaceholder = (searchType) => {
  const placeholders = {
    phone: "أدخل رقم الهاتف (مثل: 01123456789 أو +201123456789)",
    tracking: "أدخل رقم التتبع",
    name: "أدخل اسم العميل",
  };

  // For null or unknown types, use a generic placeholder
  if (!searchType) {
    return "ابحث برقم الهاتف أو رقم التتبع أو اسم العميل";
  }

  return (
    placeholders[searchType] || "ابحث برقم الهاتف أو رقم التتبع أو اسم العميل"
  );
};

export default {
  normalizeEgyptPhone,
  isValidEgyptPhone,
  formatPhoneForDisplay,
  formatPhoneForLocalDisplay,
  isPhoneNumber,
  detectSearchType,
  getSearchPlaceholder,
};
