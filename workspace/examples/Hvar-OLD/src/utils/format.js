import { DATE_FORMATS } from '../constants';

/**
 * Format currency values
 */
export const formatCurrency = (amount, currency = 'EGP', locale = 'ar-EG') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00 EGP';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

/**
 * Format numbers with thousands separators
 */
export const formatNumber = (number, locale = 'ar-EG', options = {}) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  };

  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(number);
  } catch (error) {
    return number.toString();
  }
};

/**
 * Format percentages
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Format dates
 */
export const formatDate = (date, format = DATE_FORMATS.DISPLAY, locale = 'ar-EG') => {
  if (!date) return '--';

  try {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '--';
    }

    switch (format) {
      case DATE_FORMATS.DISPLAY:
        return dateObj.toLocaleDateString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      
      case DATE_FORMATS.DISPLAY_WITH_TIME:
        return dateObj.toLocaleDateString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      
      case DATE_FORMATS.API:
        return dateObj.toISOString().split('T')[0];
      
      case DATE_FORMATS.API_WITH_TIME:
        return dateObj.toISOString().slice(0, 19).replace('T', ' ');
      
      case DATE_FORMATS.ISO:
        return dateObj.toISOString();
      
      default:
        return dateObj.toLocaleDateString(locale);
    }
  } catch (error) {
    return '--';
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date, locale = 'ar-EG') => {
  if (!date) return '--';

  try {
    const dateObj = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    if (diffInSeconds < 60) {
      return 'الآن';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `منذ ${diffInHours} ساعة`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `منذ ${diffInDays} يوم`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `منذ ${diffInWeeks} أسبوع`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `منذ ${diffInMonths} شهر`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `منذ ${diffInYears} سنة`;
  } catch (error) {
    return '--';
  }
};

/**
 * Format phone numbers
 */
export const formatPhone = (phone, format = 'display') => {
  if (!phone) return '--';

  const cleanPhone = phone.replace(/\D/g, '');

  if (format === 'display') {
    // Format as +20 10 1234 5678
    if (cleanPhone.startsWith('20')) {
      return `+${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 4)} ${cleanPhone.slice(4, 8)} ${cleanPhone.slice(8, 12)}`;
    }
    // Format as 010 1234 5678
    if (cleanPhone.startsWith('0')) {
      return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 7)} ${cleanPhone.slice(7, 11)}`;
    }
    // Format as 10 1234 5678
    if (cleanPhone.length === 10) {
      return `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 6)} ${cleanPhone.slice(6, 10)}`;
    }
  }

  return cleanPhone;
};

/**
 * Format file sizes
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format duration in seconds to human readable format
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0 ثانية';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours} ساعة ${minutes} دقيقة`;
  } else if (minutes > 0) {
    return `${minutes} دقيقة ${remainingSeconds} ثانية`;
  } else {
    return `${remainingSeconds} ثانية`;
  }
};

/**
 * Format text with ellipsis
 */
export const formatText = (text, maxLength = 50, suffix = '...') => {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + suffix;
};

/**
 * Format order tracking number
 */
export const formatTrackingNumber = (tracking) => {
  if (!tracking) return '--';
  
  // Remove any non-alphanumeric characters
  const clean = tracking.replace(/[^a-zA-Z0-9]/g, '');
  
  // Format as XXXX-XXXX-XXXX
  if (clean.length >= 12) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
  }
  
  return clean;
};

/**
 * Format SKU codes
 */
export const formatSKU = (sku) => {
  if (!sku) return '--';
  
  // Format as CAT-CODE-XXX
  const parts = sku.split('-');
  if (parts.length >= 2) {
    return parts.join('-').toUpperCase();
  }
  
  return sku.toUpperCase();
};

/**
 * Format status labels
 */
export const formatStatus = (status, statusConfig) => {
  if (!status || !statusConfig) return 'غير محدد';
  
  const config = statusConfig[status];
  return config ? config.label : status;
};

/**
 * Format priority levels
 */
export const formatPriority = (priority) => {
  const priorities = {
    low: 'منخفض',
    medium: 'متوسط',
    high: 'عالي',
    urgent: 'عاجل',
    critical: 'حرج',
  };
  
  return priorities[priority] || priority;
};

/**
 * Format business categories
 */
export const formatBusinessCategory = (category) => {
  const categories = {
    premium_high: 'عالي الجودة',
    high_value: 'قيمة عالية',
    standard_value: 'قيمة عادية',
    low_value: 'قيمة منخفضة',
    zero_cod: 'بدون دفع',
    small_refund: 'استرداد صغير',
    large_refund: 'استرداد كبير',
    max_value: 'أعلى قيمة',
  };
  
  return categories[category] || category;
};

/**
 * Format customer segments
 */
export const formatCustomerSegment = (segment) => {
  const segments = {
    vip: 'VIP',
    champion: 'Champion',
    loyal: 'Loyal',
    regular: 'Regular',
    recent: 'Recent',
    at_risk: 'At Risk',
  };
  
  return segments[segment] || segment;
};

/**
 * Format service action types
 */
export const formatServiceActionType = (type) => {
  const types = {
    maintenance: 'صيانة',
    replacement: 'استبدال',
    refund: 'استرداد',
    inspection: 'فحص',
    pickup: 'استلام',
  };
  
  return types[type] || type;
};

/**
 * Format stock movement types
 */
export const formatStockMovementType = (type) => {
  const types = {
    allocation: 'تخصيص',
    usage: 'استخدام',
    return: 'إرجاع',
    transfer: 'نقل',
    adjustment: 'تعديل',
    damage: 'تلف',
    loss: 'فقدان',
  };
  
  return types[type] || type;
};

/**
 * Format maintenance statuses
 */
export const formatMaintenanceStatus = (status) => {
  const statuses = {
    scheduled: 'مجدول',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغي',
    overdue: 'متأخر',
  };
  
  return statuses[status] || status;
};

/**
 * Format order states
 */
export const formatOrderState = (stateCode) => {
  const states = {
    45: 'تم التوصيل',
    46: 'مرتجع',
    48: 'ملغي',
    10: 'طلب استلام',
    24: 'في المستودع',
    100: 'مفقود',
    30: 'قيد النقل',
    47: 'استثناء',
    101: 'تالف',
  };
  
  return states[stateCode] || `حالة ${stateCode}`;
};

/**
 * Format order types
 */
export const formatOrderType = (typeCode) => {
  const types = {
    10: 'إرسال',
    20: 'إرجاع للمصدر',
    30: 'تبديل',
    25: 'استلام مرتجع',
  };
  
  return types[typeCode] || `نوع ${typeCode}`;
};

/**
 * Format addresses
 */
export const formatAddress = (address) => {
  if (!address) return '--';
  
  const parts = [
    address.address_line1,
    address.address_line2,
    address.city,
    address.governorate,
  ].filter(Boolean);
  
  return parts.join('، ');
};

/**
 * Format full name
 */
export const formatFullName = (firstName, lastName) => {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '--';
};

/**
 * Format email with masking
 */
export const formatEmail = (email, mask = false) => {
  if (!email) return '--';
  
  if (!mask) return email;
  
  const [username, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedUsername = username.length > 2 
    ? username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
    : username;
  
  return `${maskedUsername}@${domain}`;
};

/**
 * Format phone with masking
 */
export const formatPhoneMasked = (phone) => {
  if (!phone) return '--';
  
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10) return phone;
  
  return clean.slice(0, 3) + '****' + clean.slice(-3);
}; 