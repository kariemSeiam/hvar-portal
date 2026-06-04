import { VALIDATION_RULES } from '../constants';

/**
 * Validate required fields
 */
export const validateRequired = (value, fieldName = 'هذا الحقل') => {
  if (value === null || value === undefined) {
    return `${fieldName} مطلوب`;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} مطلوب`;
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return `${fieldName} مطلوب`;
  }
  
  return null;
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) return null;
  
  const emailRegex = VALIDATION_RULES.EMAIL.pattern;
  if (!emailRegex.test(email)) {
    return VALIDATION_RULES.EMAIL.message;
  }
  
  return null;
};

/**
 * Validate phone number format (Egyptian)
 */
export const validatePhone = (phone) => {
  if (!phone) return null;
  
  const phoneRegex = VALIDATION_RULES.PHONE.pattern;
  if (!phoneRegex.test(phone)) {
    return VALIDATION_RULES.PHONE.message;
  }
  
  return null;
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  if (!password) return null;
  
  const passwordRegex = VALIDATION_RULES.PASSWORD.pattern;
  if (!passwordRegex.test(password)) {
    return VALIDATION_RULES.PASSWORD.message;
  }
  
  return null;
};

/**
 * Validate minimum length
 */
export const validateMinLength = (value, minLength, fieldName = 'هذا الحقل') => {
  if (!value) return null;
  
  if (typeof value === 'string' && value.length < minLength) {
    return `${fieldName} يجب أن يكون على الأقل ${minLength} أحرف`;
  }
  
  if (Array.isArray(value) && value.length < minLength) {
    return `${fieldName} يجب أن يحتوي على الأقل ${minLength} عنصر`;
  }
  
  return null;
};

/**
 * Validate maximum length
 */
export const validateMaxLength = (value, maxLength, fieldName = 'هذا الحقل') => {
  if (!value) return null;
  
  if (typeof value === 'string' && value.length > maxLength) {
    return `${fieldName} يجب أن يكون على الأكثر ${maxLength} أحرف`;
  }
  
  if (Array.isArray(value) && value.length > maxLength) {
    return `${fieldName} يجب أن يحتوي على الأكثر ${maxLength} عنصر`;
  }
  
  return null;
};

/**
 * Validate numeric range
 */
export const validateNumericRange = (value, min, max, fieldName = 'القيمة') => {
  if (value === null || value === undefined) return null;
  
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return `${fieldName} يجب أن يكون رقماً`;
  }
  
  if (min !== undefined && numValue < min) {
    return `${fieldName} يجب أن يكون على الأقل ${min}`;
  }
  
  if (max !== undefined && numValue > max) {
    return `${fieldName} يجب أن يكون على الأكثر ${max}`;
  }
  
  return null;
};

/**
 * Validate date range
 */
export const validateDateRange = (date, minDate, maxDate, fieldName = 'التاريخ') => {
  if (!date) return null;
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return `${fieldName} غير صحيح`;
  }
  
  if (minDate) {
    const minDateObj = new Date(minDate);
    if (dateObj < minDateObj) {
      return `${fieldName} يجب أن يكون بعد ${formatDate(minDate)}`;
    }
  }
  
  if (maxDate) {
    const maxDateObj = new Date(maxDate);
    if (dateObj > maxDateObj) {
      return `${fieldName} يجب أن يكون قبل ${formatDate(maxDate)}`;
    }
  }
  
  return null;
};

/**
 * Validate URL format
 */
export const validateUrl = (url) => {
  if (!url) return null;
  
  try {
    new URL(url);
    return null;
  } catch {
    return 'رابط غير صحيح';
  }
};

/**
 * Validate file size
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  if (!file) return null;
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `حجم الملف يجب أن يكون أقل من ${maxSizeMB} ميجابايت`;
  }
  
  return null;
};

/**
 * Validate file type
 */
export const validateFileType = (file, allowedTypes = []) => {
  if (!file || allowedTypes.length === 0) return null;
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!allowedTypes.includes(fileExtension)) {
    return `نوع الملف غير مسموح به. الأنواع المسموحة: ${allowedTypes.join(', ')}`;
  }
  
  return null;
};

/**
 * Validate tracking number format
 */
export const validateTrackingNumber = (tracking) => {
  if (!tracking) return null;
  
  // Basic tracking number validation (alphanumeric, 8-20 characters)
  const trackingRegex = /^[A-Za-z0-9]{8,20}$/;
  if (!trackingRegex.test(tracking.replace(/[^A-Za-z0-9]/g, ''))) {
    return 'رقم التتبع غير صحيح';
  }
  
  return null;
};

/**
 * Validate SKU format
 */
export const validateSKU = (sku) => {
  if (!sku) return null;
  
  // SKU format: CAT-CODE-XXX (category-code-number)
  const skuRegex = /^[A-Z]{2,4}-[A-Z0-9]{2,6}-[0-9]{3,6}$/;
  if (!skuRegex.test(sku.toUpperCase())) {
    return 'تنسيق SKU غير صحيح (مثال: CAT-CODE-123)';
  }
  
  return null;
};

/**
 * Validate order state code
 */
export const validateOrderState = (stateCode) => {
  if (stateCode === null || stateCode === undefined) return null;
  
  const validStates = [10, 24, 30, 45, 46, 47, 48, 100, 101];
  if (!validStates.includes(Number(stateCode))) {
    return 'رمز حالة الطلب غير صحيح';
  }
  
  return null;
};

/**
 * Validate business category
 */
export const validateBusinessCategory = (category) => {
  if (!category) return null;
  
  const validCategories = [
    'premium_high', 'high_value', 'standard_value', 'low_value',
    'zero_cod', 'small_refund', 'large_refund', 'max_value'
  ];
  
  if (!validCategories.includes(category)) {
    return 'فئة العمل غير صحيحة';
  }
  
  return null;
};

/**
 * Validate customer segment
 */
export const validateCustomerSegment = (segment) => {
  if (!segment) return null;
  
  const validSegments = ['vip', 'champion', 'loyal', 'regular', 'recent', 'at_risk'];
  
  if (!validSegments.includes(segment)) {
    return 'قطاع العميل غير صحيح';
  }
  
  return null;
};

/**
 * Validate service action type
 */
export const validateServiceActionType = (type) => {
  if (!type) return null;
  
  const validTypes = ['maintenance', 'replacement', 'refund', 'inspection', 'pickup'];
  
  if (!validTypes.includes(type)) {
    return 'نوع إجراء الخدمة غير صحيح';
  }
  
  return null;
};

/**
 * Validate priority level
 */
export const validatePriority = (priority) => {
  if (!priority) return null;
  
  const validPriorities = ['low', 'medium', 'high', 'urgent', 'critical'];
  
  if (!validPriorities.includes(priority)) {
    return 'مستوى الأولوية غير صحيح';
  }
  
  return null;
};

/**
 * Validate maintenance status
 */
export const validateMaintenanceStatus = (status) => {
  if (!status) return null;
  
  const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'];
  
  if (!validStatuses.includes(status)) {
    return 'حالة الصيانة غير صحيحة';
  }
  
  return null;
};

/**
 * Validate stock movement type
 */
export const validateStockMovementType = (type) => {
  if (!type) return null;
  
  const validTypes = ['allocation', 'usage', 'return', 'transfer', 'adjustment', 'damage', 'loss'];
  
  if (!validTypes.includes(type)) {
    return 'نوع حركة المخزون غير صحيح';
  }
  
  return null;
};

/**
 * Validate form data against schema
 */
export const validateFormData = (data, schema) => {
  const errors = {};
  
  for (const [fieldName, validators] of Object.entries(schema)) {
    const fieldValue = data[fieldName];
    const fieldErrors = [];
    
    for (const validator of validators) {
      const error = validator(fieldValue, fieldName);
      if (error) {
        fieldErrors.push(error);
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors[0]; // Return first error only
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Create validation schema for common forms
 */
export const createValidationSchema = (fields) => {
  const schema = {};
  
  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    const validators = [];
    
    // Required validation
    if (fieldConfig.required) {
      validators.push((value) => validateRequired(value, fieldConfig.label));
    }
    
    // Type-specific validations
    if (fieldConfig.type === 'email') {
      validators.push(validateEmail);
    }
    
    if (fieldConfig.type === 'phone') {
      validators.push(validatePhone);
    }
    
    if (fieldConfig.type === 'password') {
      validators.push(validatePassword);
    }
    
    if (fieldConfig.type === 'url') {
      validators.push(validateUrl);
    }
    
    if (fieldConfig.type === 'tracking') {
      validators.push(validateTrackingNumber);
    }
    
    if (fieldConfig.type === 'sku') {
      validators.push(validateSKU);
    }
    
    // Length validations
    if (fieldConfig.minLength) {
      validators.push((value) => validateMinLength(value, fieldConfig.minLength, fieldConfig.label));
    }
    
    if (fieldConfig.maxLength) {
      validators.push((value) => validateMaxLength(value, fieldConfig.maxLength, fieldConfig.label));
    }
    
    // Numeric range validation
    if (fieldConfig.type === 'number' && (fieldConfig.min !== undefined || fieldConfig.max !== undefined)) {
      validators.push((value) => validateNumericRange(value, fieldConfig.min, fieldConfig.max, fieldConfig.label));
    }
    
    // Date range validation
    if (fieldConfig.type === 'date' && (fieldConfig.minDate || fieldConfig.maxDate)) {
      validators.push((value) => validateDateRange(value, fieldConfig.minDate, fieldConfig.maxDate, fieldConfig.label));
    }
    
    // Custom validation
    if (fieldConfig.customValidation) {
      validators.push(fieldConfig.customValidation);
    }
    
    schema[fieldName] = validators;
  }
  
  return schema;
};

/**
 * Validate API response structure
 */
export const validateApiResponse = (response) => {
  if (!response || typeof response !== 'object') {
    return 'استجابة API غير صحيحة';
  }
  
  if (response.success === undefined) {
    return 'استجابة API تفتقد إلى حقل النجاح';
  }
  
  if (response.success === false && !response.error) {
    return 'استجابة API تفتقد إلى رسالة الخطأ';
  }
  
  return null;
};

/**
 * Sanitize input data
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Sanitize form data
 */
export const sanitizeFormData = (data) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Helper function for date formatting (import from format.js)
const formatDate = (date) => {
  if (!date) return '--';
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('ar-EG');
  } catch {
    return '--';
  }
}; 