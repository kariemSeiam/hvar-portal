/**
 * Format price in Egyptian Pounds with Arabic locale
 * @param {number} price - Price in EGP
 * @param {boolean} showCurrency - Whether to show currency symbol
 * @returns {string} Formatted price string
 */
export const formatPriceEGP = (price, showCurrency = true) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return 'غير متوفر';
  }

  try {
    const options = {
      style: showCurrency ? 'currency' : 'decimal',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      numberingSystem: 'arab'
    };

    return new Intl.NumberFormat('ar-EG', options).format(price);
  } catch (error) {
    // Fallback to simple formatting
    return `${price.toFixed(2)} ج.م`;
  }
};

/**
 * Calculate discount percentage
 * @param {number} originalPrice - Original price
 * @param {number} currentPrice - Current price
 * @returns {number} Discount percentage
 */
export const calculateDiscountPercentage = (originalPrice, currentPrice) => {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) {
    return 0;
  }
  
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

/**
 * Format discount display
 * @param {number} percentage - Discount percentage
 * @returns {string} Formatted discount string
 */
export const formatDiscount = (percentage) => {
  if (!percentage || percentage <= 0) {
    return '';
  }
  
  return `خصم ${percentage}%`;
};
