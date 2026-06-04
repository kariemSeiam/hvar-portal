/**
 * Order Data Validation Utilities
 * Provides comprehensive validation for order data and user inputs
 */

/**
 * Validates order object structure and required fields
 */
export const validateOrder = (order) => {
  if (!order) {
    return { isValid: false, errors: ["Order data is required"] };
  }

  const errors = [];
  const warnings = [];

  // Required fields validation - handle both camelCase and snake_case
  const requiredFields = [{ field: "status", path: "status" }];

  // Check required fields
  requiredFields.forEach(({ field, path }) => {
    const value = getNestedValue(order, path);
    if (!value || (typeof value === "string" && value.trim() === "")) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Only check for trackingNumber if it's critical for functionality
  const trackingNumber = order.trackingNumber || order.tracking_number;
  if (
    !trackingNumber ||
    (typeof trackingNumber === "string" && trackingNumber.trim() === "")
  ) {
    // Only warn if this is a completed order that should have a tracking number
    if (order.status === "completed" || order.status === "returned") {
      warnings.push("Missing tracking number for completed order");
    }
  }

  // Phone number validation - very lenient, only warn for obviously invalid formats
  const phone = order.customerPhone || order.customer_phone;
  if (phone && phone.trim() !== "") {
    const cleanPhone = phone.replace(/\D/g, "");
    // Only warn if it has digits but is clearly not a phone number (too short or too long)
    if (
      cleanPhone.length > 0 &&
      (cleanPhone.length < 7 || cleanPhone.length > 15)
    ) {
      warnings.push("Invalid phone number format");
    }
  }

  // Email validation (if present)
  const email = order.customerEmail || order.customer_email;
  if (email && !isValidEmail(email)) {
    warnings.push("Invalid email format");
  }

  // Tracking number validation - only if tracking number exists
  if (trackingNumber && !isValidTrackingNumber(trackingNumber)) {
    warnings.push("Invalid tracking number format");
  }

  // Status validation
  const validStatuses = [
    "received",
    "in_maintenance",
    "under_full_replacing",
    "under_part_replacing",
    "completed",
    "returned_to_hub",
    "failed",
    "sending",
    "returned",
  ];
  if (order.status && !validStatuses.includes(order.status)) {
    errors.push(`Invalid order status: ${order.status}`);
  }

  // Financial data validation
  const codAmount = order.codAmount ?? order.cod_amount ?? order.financial?.cod;
  if (codAmount !== undefined && codAmount !== null && codAmount !== "" && isNaN(codAmount)) {
    errors.push("Invalid COD amount");
  }

  const bostaFees =
    order.bostaFees
    ?? order.bosta_fees
    ?? order.financial?.bostaFeesGross
    ?? order.financial?.bostaFees
    ?? order.financial?.bostaFeesNet;
  if (bostaFees !== undefined && bostaFees !== null && bostaFees !== "" && (isNaN(bostaFees) || Number(bostaFees) < 0)) {
    errors.push("Invalid Bosta fees");
  }

  // Items count validation
  const itemsCount = order.itemsCount || order.items_count;
  if (itemsCount !== undefined && (isNaN(itemsCount) || itemsCount < 0)) {
    errors.push("Invalid items count");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0,
  };
};

/**
 * Validates action data for order actions
 */
export const validateActionData = (actionType, actionData) => {
  const errors = [];
  const warnings = [];

  if (!actionData) {
    return { isValid: false, errors: ["Action data is required"] };
  }

  switch (actionType) {
    case "refund_or_replace":
      if (actionData.refundAmount !== undefined) {
        if (isNaN(actionData.refundAmount) || actionData.refundAmount < 0) {
          errors.push("Invalid refund amount");
        }
      }

      if (
        actionData.replacementTrackingNumber &&
        !isValidTrackingNumber(actionData.replacementTrackingNumber)
      ) {
        warnings.push("Invalid replacement tracking number format");
      }
      break;

    case "send_order":
      if (
        actionData.newTrackingNumber &&
        !isValidTrackingNumber(actionData.newTrackingNumber)
      ) {
        errors.push("Invalid new tracking number format");
      }

      break;

    case "reschedule":
      if (!actionData.newDate) {
        errors.push("New date is required for reschedule action");
      } else if (!isValidDate(actionData.newDate)) {
        errors.push("Invalid new date format");
      }
      break;

    default:
      // Generic validation for other actions
      if (actionData.notes && actionData.notes.length > 1000) {
        warnings.push("Notes are too long (max 1000 characters)");
      }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0,
  };
};

import { isValidEgyptPhone } from '../core/phone';

/**
 * Validates phone number format (Egyptian phone numbers)
 * Accepts any format (+201, 201, 01, etc.) and normalizes before validation
 */
export const isValidPhoneNumber = (phone) => {
  return isValidEgyptPhone(phone);
};

/**
 * Validates email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates tracking number format
 */
export const isValidTrackingNumber = (trackingNumber) => {
  if (!trackingNumber || typeof trackingNumber !== "string") return false;

  // Bosta tracking numbers are typically 10-15 characters alphanumeric
  const cleanTracking = trackingNumber.trim();
  return (
    cleanTracking.length >= 10 &&
    cleanTracking.length <= 15 &&
    /^[A-Z0-9]+$/i.test(cleanTracking)
  );
};

/**
 * Validates date format
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validates COD amount
 */
export const isValidCodAmount = (amount) => {
  if (amount === undefined || amount === null) return true; // Optional field
  return !isNaN(amount) && amount >= 0 && amount <= 100000; // Max 100,000 EGP
};

/**
 * Validates package weight
 */
export const isValidPackageWeight = (weight) => {
  if (weight === undefined || weight === null) return true; // Optional field
  return !isNaN(weight) && weight >= 0 && weight <= 50; // Max 50 kg
};

/**
 * Validates items count
 */
export const isValidItemsCount = (count) => {
  if (count === undefined || count === null) return true; // Optional field
  return Number.isInteger(count) && count >= 0 && count <= 100; // Max 100 items
};

/**
 * Gets nested value from object using dot notation or fallback paths
 */
const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;

  // Handle fallback paths like 'customerName || customer_name'
  const paths = path.split(" || ");

  for (const singlePath of paths) {
    const value = singlePath.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);

    if (value !== undefined) return value;
  }

  return undefined;
};

/**
 * Sanitizes user input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .replace(/[<>]/g, "") // Remove < and > characters
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
};

/**
 * Validates and sanitizes notes
 */
export const validateNotes = (notes) => {
  if (!notes) return { isValid: true, sanitized: "" };

  const sanitized = sanitizeInput(notes);

  if (sanitized.length > 1000) {
    return {
      isValid: false,
      sanitized: sanitized.substring(0, 1000),
      error: "Notes are too long (max 1000 characters)",
    };
  }

  return {
    isValid: true,
    sanitized,
    error: null,
  };
};

export default {
  validateOrder,
  validateActionData,
  isValidPhoneNumber,
  isValidEmail,
  isValidTrackingNumber,
  isValidDate,
  isValidCodAmount,
  isValidPackageWeight,
  isValidItemsCount,
  sanitizeInput,
  validateNotes,
};
