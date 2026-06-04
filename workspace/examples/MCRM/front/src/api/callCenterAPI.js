/**
 * Call Center API - Real backend + mock fallbacks
 *
 * Real endpoints: /api/call-center/* (Phase 4)
 * Mock fallbacks: getOrderCallContext, lock/unlock, processOrderToHub, items/autoMatch
 */

import { deduplicateRequest } from '../utils/core/request';
import { toLocalDateKey } from '../utils/core/date';
import { parseCustomerJSONFields } from '../utils/callcenter/customerParsers';
import { stockAPI } from './stockAPI';
import { filterAndRankStockItems } from '../utils/stock/search';

// Real API base
const getAxios = () => import('./axios').then((m) => m.default);

/** Coerce user/agent id to valid int for backend. Default 1. */
function toAgentId(val) {
  if (val == null || val === '') return 1;
  const n = Number(val);
  return Number.isInteger(n) && n >= 1 && n <= 2147483647 ? n : 1;
}

/** Parse confirmation_snapshot from backend (JSON string or object). */
function parseConfirmationSnapshot(snap) {
  if (!snap) return {};
  if (typeof snap === 'object') return snap;
  try {
    return typeof snap === 'string' && snap.trim() ? JSON.parse(snap) : {};
  } catch {
    return {};
  }
}

/** Map backend order → frontend order shape */
function mapOrderFromBackend(row) {
  if (!row) return null;
  const snap = parseConfirmationSnapshot(row.confirmation_snapshot);
  const normalizedStatus = row.status === 'cancelled' ? 'canceled' : row.status;
  const snapshotItemsCount = Array.isArray(snap?.items) ? snap.items.length : 0;
  // Fall back to parsing description text for unconfirmed orders (no snapshot yet)
  const descItemsCount = snapshotItemsCount === 0 && row.order_description
    ? parseDescriptionText(row.order_description).length
    : 0;
  return {
    id: row.id,
    order_number: row.erp_order_id || String(row.id),
    order_date: row.created_at,
    customer_id: row.customer_id,
    cod_amount: parseFloat(row.cod_amount) || 0,
    // ERP shipping_details (items text) — never use delivery_address here; وصف الطلب = items only
    order_description: row.order_description || '',
    items_count: snapshotItemsCount || descItemsCount || 0,
    order_branch: '',
    order_user: '',
    order_sales_rep: '',
    status: normalizedStatus === 'converted' ? 'completed' : normalizedStatus,
    attempt_count: row.attempt_count || 0,
    last_call_at: row.last_attempt_at,
    next_action_at: row.next_action_at,
    confirmed_delivery_date: null,
    scheduled_callback_date: row.scheduled_callback_at,
    cancellation_reason: row.cancellation_reason,
    address_governorate: row.governorate || 'غير محدد',
    address_city: row.city || 'غير محدد',
    address_district: null,
    address_full: row.delivery_address || 'غير محدد',
    shipping_details: row.order_description || '', // same as order_description; address is in address_full
    bosta_tracking_number: row.bosta_tracking,
    bosta_status: null,
    bosta_fees: 0,
    // Prefer DB service_type; fall back to snapshot call_type; ERP orders default to sell
    service_type: row.service_type || snap?.call_type || (row.source === 'erp' ? 'sell' : null),
    source: row.source,
    in_erp: row.in_erp ?? null,
    locked_by: row.locked_by ?? null,
    locked_at: row.locked_at ?? null,
    confirmation_snapshot: snap,
    customer: {
      name: row.customer_name || 'غير محدد',
      phone: row.customer_phone || ''
    }
  };
}

/** Map backend call → frontend call shape */
function mapCallFromBackend(c) {
  if (!c) return null;
  const callStatus = (c.status || c.call_status) === 'cancelled' ? 'canceled' : (c.status || c.call_status);
  const safeAgentName = (
    c.agent_name
    || c.agent_name_text
    || c.user_name
    || c.name
    || ''
  );
  return {
    id: c.id,
    status: callStatus,
    call_status: callStatus,
    call_datetime: c.created_at,
    delivery_date: null,
    history: c.notes || '',
    gap_time_hours: null,
    attempt_number: c.attempt_number ?? 1,
    agent_name: safeAgentName,
    agent_id: c.agent_id ?? null,
    call_type: c.call_type || c.service_type || 'ask',
    service_type: c.service_type || c.call_type
  };
}

// Mock delay (for mock paths)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Import customerAPI at top level to avoid circular dependency issues
let customerAPI = null;
const getCustomerAPI = async () => {
  if (!customerAPI) {
    const module = await import('./customerAPI');
    customerAPI = module.customerAPI;
  }
  return customerAPI;
};

// ============================================================================
// ERP API RESPONSE CONVERTER
// ============================================================================

/**
 * Extract numeric value from HTML string (e.g., from ERP final_total field)
 * Handles formats like: "<span class=\"final-total\" data-orig-value=\"1650.0000\">EGP 1,650.00</span>"
 * @param {string} htmlString - HTML string containing the value
 * @returns {number} Extracted numeric value, or 0 if not found
 */
const extractNumericValueFromHTML = (htmlString) => {
  if (!htmlString) return 0;

  // If it's already a number, return it
  if (typeof htmlString === 'number') return htmlString;

  // Try to extract from data-orig-value attribute first (most reliable)
  const dataOrigMatch = htmlString.match(/data-orig-value=["']?([\d.]+)/i);
  if (dataOrigMatch && dataOrigMatch[1]) {
    return parseFloat(dataOrigMatch[1]) || 0;
  }

  // Fallback: try to parse the HTML text content (remove HTML tags and extract number)
  const textContent = htmlString.replace(/<[^>]*>/g, '').trim();
  // Remove currency symbols and commas, then parse
  const numericString = textContent.replace(/[^\d.]/g, '');
  const parsed = parseFloat(numericString);

  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Convert ERP API response to order format
 * Only uses specified fields: contact_name_text, mobile, shipping_state,
 * shipping_city, shipping_address, shipping_details, total_quantity
 *
 * IMPORTANT: This function creates a NEW order. Use convertERPResponseToOrderWithPreservation
 * if you want to preserve existing order status, attempt_count, and call history.
 */
const convertERPResponseToOrder = (erpOrder) => {
  // Parse transaction_date to ISO format
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString();
    // Format: "02/01/2026 02:04 PM"
    try {
      const parts = dateStr.split(' ');
      if (parts.length < 2) return new Date().toISOString();
      const [datePart, timePart, ampm] = parts;
      const [day, month, year] = datePart.split('/');
      const [hour, minute] = timePart.split(':');
      let hour24 = parseInt(hour);
      if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
      if (ampm === 'AM' && hour24 === 12) hour24 = 0;
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${String(hour24).padStart(2, '0')}:${minute}:00`).toISOString();
    } catch (e) {
      console.warn('Error parsing date:', dateStr, e);
      return new Date().toISOString();
    }
  };

  // Generate unique order ID from order_number (hash it to a number)
  const invoiceNo = erpOrder.invoice_no || 'DR2026/00000';
  const generateOrderId = (orderNumber) => {
    // Create a hash from order_number to get a unique numeric ID
    let hash = 0;
    for (let i = 0; i < orderNumber.length; i++) {
      const char = orderNumber.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) || Math.floor(Math.random() * 1000000);
  };

  return {
    id: generateOrderId(invoiceNo),
    order_number: invoiceNo,
    order_date: parseDate(erpOrder.transaction_date),
    customer_id: erpOrder.contact_id || null,
    cod_amount: extractNumericValueFromHTML(erpOrder.final_total || erpOrder.total || erpOrder.amount || '0'), // Total price from ERP (handles HTML format)
    order_description: erpOrder.shipping_details || '',
    items_count: parseFloat(erpOrder.total_quantity || '0'),
    order_branch: erpOrder.business_location || 'غير محدد',
    order_user: erpOrder.added_by || '',
    order_sales_rep: erpOrder.commission_agent || '',
    status: 'new', // Default status for NEW orders
    attempt_count: 0,
    last_call_at: null,
    next_action_at: null,
    confirmed_delivery_date: null,
    scheduled_callback_date: null,
    cancellation_reason: null,
    address_governorate: erpOrder.shipping_state || 'غير محدد',
    address_city: erpOrder.shipping_city || 'غير محدد',
    address_district: null,
    address_full: erpOrder.shipping_address || 'غير محدد',
    shipping_details: erpOrder.shipping_details || '', // Notes after items chip
    locked_by: null,
    locked_at: null,
    postponed_from: null,
    postponed_to: null,
    postponement_days: null,
    bosta_tracking_number: null,
    bosta_status: null,
    bosta_fees: 0,
    source_data: erpOrder,
    // Customer data (for display)
    customer: {
      name: erpOrder.contact_name_text || 'غير محدد',
      phone: erpOrder.mobile || ''
    }
  };
};

/**
 * Convert ERP API response to order format, preserving existing order data
 *
 * This function checks if an order already exists (by order_number) and preserves:
 * - status (new, scheduled, confirmed, etc.)
 * - attempt_count
 * - last_call_at
 * - next_action_at
 * - scheduled_callback_date
 * - confirmed_delivery_date
 * - cancellation_reason
 * - call history
 *
 * Only updates fields that might have changed from ERP:
 * - customer info (name, phone)
 * - address (governorate, city, address)
 * - order details (description, items_count, cod_amount)
 * - branch, user, sales_rep
 *
 * @param {Object} erpOrder - Order data from ERP API
 * @param {Array} existingOrders - Array of existing orders to check against
 * @returns {Object} Order object with preserved status/history if exists, or new order
 */
const convertERPResponseToOrderWithPreservation = (erpOrder, existingOrders = []) => {
  const invoiceNo = erpOrder.invoice_no || 'DR2026/00000';

  // Check if order already exists
  const existingOrder = existingOrders.find(o => o.order_number === invoiceNo);

  if (existingOrder) {
    // Order exists - preserve status and call history, update other fields
    // Order exists - preserve status and call history

    // Create base order from ERP data
    const baseOrder = convertERPResponseToOrder(erpOrder);

    // Preserve existing order's status and call-related fields
    return {
      ...baseOrder,
      id: existingOrder.id, // Keep same ID
      // PRESERVE status and call history
      status: existingOrder.status,
      attempt_count: existingOrder.attempt_count || 0,
      last_call_at: existingOrder.last_call_at,
      next_action_at: existingOrder.next_action_at,
      confirmed_delivery_date: existingOrder.confirmed_delivery_date,
      scheduled_callback_date: existingOrder.scheduled_callback_date,
      cancellation_reason: existingOrder.cancellation_reason,
      // PRESERVE lock state (will be cleared on next action)
      locked_by: existingOrder.locked_by,
      locked_at: existingOrder.locked_at,
      // PRESERVE postponement
      postponed_from: existingOrder.postponed_from,
      postponed_to: existingOrder.postponed_to,
      postponement_days: existingOrder.postponement_days,
      // PRESERVE Bosta tracking if exists
      bosta_tracking_number: existingOrder.bosta_tracking_number || baseOrder.bosta_tracking_number,
      bosta_status: existingOrder.bosta_status || baseOrder.bosta_status,
      bosta_fees: existingOrder.bosta_fees || baseOrder.bosta_fees,
      // UPDATE customer and address info (might have changed in ERP)
      // (baseOrder already has updated values)
    };
  } else {
    // New order - create fresh with status='new'
    // New order - create fresh with status='new'
    return convertERPResponseToOrder(erpOrder);
  }
};

// ============================================================================
// ORDERS STORAGE - Populated from Real ERP API
// ============================================================================

// Orders storage - starts empty, populated by syncOrders() from real ERP API
// All orders come from ERP API via syncOrders() function
// No mock data - use syncOrders() to fetch real data from ERP
let mockOrders = [];

// ============================================================================
// NOTE: No mock data enrichment needed
// ============================================================================
// Orders come from real ERP API via syncOrders() function
// Status, attempt_count, and call history are preserved when syncing
// All order states are managed through real API calls (confirm, schedule, no-answer, etc.)

// Mock Customers - Linked to orders
const mockCustomers = {
  123: {
    id: 123,
    name: 'سناء السيد معروف احمد',
    phone: '01096627148',
    phone_secondary: null,
    governorate: 'الشرقية',
    city: 'فاقوس',
    address_details: 'العنوان :محافظه الشرقيه فاقوس قريه البيروم بجوار جامع الحساينه ومكتب البيريد',
    bosta_orders: [
      {
        trackingNumber: 'TRACK123',
        status: 'delivered',
        cod: 1500.00,
        createdAt: '2025-01-01T10:00:00Z'
      }
    ],
    customer_services: [
      {
        ticket_number: 'HVR-20250115-0001',
        service_type: 'replacement',
        status: 'completed',
        created_at: '2025-01-15T10:00:00Z'
      }
    ]
  },
  124: {
    id: 124,
    name: 'ام حمزه',
    phone: '01002170594',
    phone_secondary: '01123456789',
    governorate: 'الفيوم',
    city: 'الفيوم',
    address_details: 'العنوان :محافظه الفيوم المسله',
    bosta_orders: [
      {
        trackingNumber: 'TRACK124',
        status: 'in_transit',
        cod: 2000.00,
        createdAt: '2025-01-12T08:00:00Z'
      }
    ],
    customer_services: [
      {
        ticket_number: 'HVR-20250110-0005',
        service_type: 'maintenance',
        status: 'in_process',
        created_at: '2025-01-10T14:00:00Z'
      }
    ]
  },
  125: {
    id: 125,
    name: 'أحمد محمود',
    phone: '01012345678',
    phone_secondary: null,
    governorate: 'القاهرة',
    city: 'المعادي',
    address_details: 'شارع النصر، المعادي',
    bosta_orders: [],
    customer_services: []
  },
  126: {
    id: 126,
    name: 'فاطمة حسن',
    phone: '01098765432',
    phone_secondary: null,
    governorate: 'الجيزة',
    city: 'الدقي',
    address_details: 'شارع الجامعة، الدقي',
    bosta_orders: [],
    customer_services: []
  },
  127: {
    id: 127,
    name: 'محمد عبدالله',
    phone: '01055555555',
    phone_secondary: null,
    governorate: 'الشرقية',
    city: 'الزقازيق',
    address_details: 'عنوان مؤكد',
    bosta_orders: [],
    customer_services: []
  },
  128: {
    id: 128,
    name: 'علي أحمد',
    phone: '01011111111',
    phone_secondary: null,
    governorate: 'الإسكندرية',
    city: 'سيدي بشر',
    address_details: 'كورنيش الإسكندرية',
    bosta_orders: [],
    customer_services: []
  },
  129: {
    id: 129,
    name: 'سارة محمد',
    phone: '01022222222',
    phone_secondary: null,
    governorate: 'القاهرة',
    city: 'المعادي',
    address_details: 'شارع النصر',
    bosta_orders: [],
    customer_services: []
  },
  130: {
    id: 130,
    name: 'خالد علي',
    phone: '01033333333',
    phone_secondary: null,
    governorate: 'الجيزة',
    city: 'الدقي',
    address_details: 'شارع الجامعة',
    bosta_orders: [],
    customer_services: []
  },
  131: {
    id: 131,
    name: 'مريم سعيد',
    phone: '01044444444',
    phone_secondary: null,
    governorate: 'القاهرة',
    city: 'المعادي',
    address_details: 'شارع النصر',
    bosta_orders: [],
    customer_services: []
  },
  132: {
    id: 132,
    name: 'محمد احمد ابراهيم',
    phone: '01552766601',
    phone_secondary: null,
    governorate: 'القليوبية',
    city: 'الخانكه',
    address_details: 'مزرعه الجبل الاصفر',
    bosta_orders: [
      {
        trackingNumber: 'BOSTA-20260104-001',
        status: 'delivered',
        cod: 2450.00,
        createdAt: '2026-01-04T10:00:00Z'
      },
      {
        trackingNumber: 'BOSTA-20251220-045',
        status: 'in_transit',
        cod: 3200.00,
        createdAt: '2025-12-20T14:30:00Z'
      },
      {
        trackingNumber: 'BOSTA-20251115-089',
        status: 'delivered',
        cod: 1800.00,
        createdAt: '2025-11-15T09:15:00Z'
      }
    ],
    customer_services: [
      {
        id: 1001,
        ticket_number: 'HVR-20251210-0015',
        service_type: 'replacement',
        status: 'completed',
        created_at: '2025-12-10T11:00:00Z',
        notes: 'استبدال خلاط معطل بخلاط جديد',
        items: [
          {
            id: 1,
            name: 'خلاط هفار 8000 وات 7*1',
            sku: '5069',
            type: 'product',
            quantity: 1,
            direction: 'send'
          },
          {
            id: 2,
            name: 'خلاط هفار 8000 وات 7*1',
            sku: '5069',
            type: 'product',
            quantity: 1,
            direction: 'receive'
          }
        ]
      },
      {
        id: 1002,
        ticket_number: 'HVR-20251125-0032',
        service_type: 'maintenance',
        status: 'in_process',
        created_at: '2025-11-25T15:30:00Z',
        notes: 'صيانة خلاط - تغيير قطع غيار',
        items: [
          {
            id: 3,
            name: 'خلاط هفار 8000 وات 7*1',
            sku: '5069',
            type: 'product',
            quantity: 1,
            direction: 'receive'
          },
          {
            id: 4,
            name: 'قطع غيار خلاط',
            sku: 'PART-001',
            type: 'part',
            quantity: 2,
            direction: 'send'
          }
        ]
      },
      {
        id: 1003,
        ticket_number: 'HVR-20251015-0048',
        service_type: 'replacement',
        status: 'sent',
        created_at: '2025-10-15T09:00:00Z',
        notes: 'استبدال منتج معطل',
        items: [
          {
            id: 5,
            name: 'خلاط هفار 6000 وات',
            sku: '5068',
            type: 'product',
            quantity: 1,
            direction: 'send'
          },
          {
            id: 6,
            name: 'خلاط هفار 6000 وات',
            sku: '5068',
            type: 'product',
            quantity: 1,
            direction: 'receive'
          }
        ]
      },
      {
        id: 1004,
        ticket_number: 'HVR-20250920-0021',
        service_type: 'return',
        status: 'completed',
        created_at: '2025-09-20T13:45:00Z',
        notes: 'استرجاع منتج - طلب العميل',
        items: [
          {
            id: 7,
            name: 'خلاط هفار 5000 وات',
            sku: '5067',
            type: 'product',
            quantity: 1,
            direction: 'receive'
          }
        ]
      },
      {
        id: 1005,
        ticket_number: 'HVR-20250810-0055',
        service_type: 'sell',
        status: 'confirmed',
        created_at: '2025-08-10T10:20:00Z',
        notes: 'المبيعات غيار',
        items: [
          {
            id: 8,
            name: 'قطع غيار خلاط - محرك',
            sku: 'PART-002',
            type: 'part',
            quantity: 1,
            direction: 'send'
          },
          {
            id: 9,
            name: 'قطع غيار خلاط - شفرة',
            sku: 'PART-003',
            type: 'part',
            quantity: 2,
            direction: 'send'
          },
          {
            id: 10,
            name: 'خلاط هفار 8000 وات 7*1',
            sku: '5069',
            type: 'product',
            quantity: 1,
            direction: 'send'
          }
        ]
      }
    ]
  }
};

// Mock Stock Items
const mockStockItems = [
  {
    id: 101,
    sku: '5069',
    name: 'خلاط هفار 8000 وات 7*1',
    type: 'product',
    available_qty: 50,
    price_customer: 2450.00,
    price_merchant: 2200.00
  },
  {
    id: 102,
    sku: '5027',
    name: 'كبه هفار 1000 وات تربو  أبيض',
    type: 'product',
    available_qty: 30,
    price_customer: 1750.00,
    price_merchant: 1500.00
  },
  {
    id: 103,
    sku: '5068',
    name: 'خلاط هفار 5000 وات',
    type: 'product',
    available_qty: 25,
    price_customer: 1450.00,
    price_merchant: 1300.00
  },
  {
    id: 104,
    sku: '5070',
    name: 'خلاط هفار 10000 وات',
    type: 'product',
    available_qty: 15,
    price_customer: 3200.00,
    price_merchant: 2900.00
  },
  {
    id: 201,
    sku: 'PART001',
    name: 'جزء إصلاح خلاط',
    type: 'part',
    available_qty: 100,
    price_customer: 50.00,
    price_merchant: 40.00
  }
];

// Mock Calls History - maps order_id to array of calls
const mockCalls = {
  2: [
    {
      id: 1,
      order_id: 2,
      agent_id: 1,
      agent_name: 'أحمد محمد',
      call_date: '2025-01-17',
      call_time: '09:00:00',
      call_datetime: '2025-01-17T09:00:00Z',
      duration_seconds: 30,
      attempt_number: 1,
      is_daily_attempt: true,
      status: 'no_answer',
      delivery_date: null,
      scheduled_date: null,
      cancellation_reason: null,
      history: 'خط مشغول',
      items: null,
      total: null,
      next_action_at: '2025-01-17T13:00:00Z',
      gap_time_hours: 4
    }
  ],
  3: [
    {
      id: 2,
      order_id: 3,
      agent_id: 1,
      agent_name: 'أحمد محمد',
      call_date: '2025-01-17',
      call_time: '09:00:00',
      call_datetime: '2025-01-17T09:00:00Z',
      duration_seconds: 25,
      attempt_number: 1,
      is_daily_attempt: true,
      status: 'no_answer',
      delivery_date: null,
      scheduled_date: null,
      cancellation_reason: null,
      history: 'لم يرد العميل',
      items: null,
      total: null,
      next_action_at: '2025-01-17T13:00:00Z',
      gap_time_hours: 4
    },
    {
      id: 3,
      order_id: 3,
      agent_id: 2,
      agent_name: 'سارة علي',
      call_date: '2025-01-17',
      call_time: '13:00:00',
      call_datetime: '2025-01-17T13:00:00Z',
      duration_seconds: 20,
      attempt_number: 2,
      is_daily_attempt: true,
      status: 'no_answer',
      delivery_date: null,
      scheduled_date: null,
      cancellation_reason: null,
      history: 'خط مشغول',
      items: null,
      total: null,
      next_action_at: '2025-01-17T17:00:00Z',
      gap_time_hours: 4
    }
  ],
  4: [
    {
      id: 4,
      order_id: 4,
      agent_id: 1,
      agent_name: 'أحمد محمد',
      call_date: '2025-01-16',
      call_time: '15:30:00',
      call_datetime: '2025-01-16T15:30:00Z',
      duration_seconds: 180,
      attempt_number: 1,
      is_daily_attempt: true,
      status: 'scheduled',
      delivery_date: null,
      scheduled_date: '2025-01-20T10:00:00Z',
      cancellation_reason: null,
      history: 'العميل طلب التسليم يوم السبت',
      items: null,
      total: null,
      next_action_at: '2025-01-20T10:00:00Z',
      gap_time_hours: null
    }
  ],
  5: [
    {
      id: 5,
      order_id: 5,
      agent_id: 1,
      agent_name: 'أحمد محمد',
      call_date: '2025-01-16',
      call_time: '14:00:00',
      call_datetime: '2025-01-16T14:00:00Z',
      duration_seconds: 240,
      attempt_number: 1,
      is_daily_attempt: true,
      status: 'confirmed',
      delivery_date: '2025-01-25',
      scheduled_date: null,
      cancellation_reason: null,
      history: 'تم تأكيد الطلب، العميل يريد التسليم يوم السبت',
      items: null,
      total: null,
      next_action_at: null,
      gap_time_hours: null
    }
  ],
  6: [
    {
      id: 6,
      order_id: 6,
      agent_id: 1,
      agent_name: 'أحمد محمد',
      call_date: '2025-01-15',
      call_time: '11:00:00',
      call_datetime: '2025-01-15T11:00:00Z',
      duration_seconds: 120,
      attempt_number: 1,
      is_daily_attempt: true,
      status: 'canceled',
      delivery_date: null,
      scheduled_date: null,
      cancellation_reason: 'سعر مرتفع',
      history: 'العميل رفض الطلب بسبب السعر المرتفع',
      items: null,
      total: null,
      next_action_at: null,
      gap_time_hours: null
    }
  ],
  7: [
    {
      id: 7,
      order_id: 7,
      agent_id: 1,
      agent_name: 'أحمد محمد',
      call_date: '2025-01-14',
      call_time: '10:00:00',
      call_datetime: '2025-01-14T10:00:00Z',
      duration_seconds: 200,
      attempt_number: 1,
      is_daily_attempt: true,
      status: 'confirmed',
      delivery_date: '2025-01-20',
      scheduled_date: null,
      cancellation_reason: null,
      history: 'تم تأكيد الطلب',
      items: null,
      total: null,
      next_action_at: null,
      gap_time_hours: null
    }
  ]
};

// Mock Order Items (via service_items) - maps order_id to items
const mockOrderItems = {
  1: [
    {
      id: 1001,
      order_id: 1,
      item_id: 101,
      quantity: 1,
      sku: '5069',
      name: 'خلاط هفار 8000 وات 7*1',
      type: 'product',
      available_qty: 50,
      price_customer: 2450.00,
      price_merchant: 2200.00
    }
  ],
  2: [
    {
      id: 1002,
      order_id: 2,
      item_id: 101,
      quantity: 1,
      sku: '5069',
      name: 'خلاط هفار 8000 وات 7*1',
      type: 'product',
      available_qty: 50,
      price_customer: 2450.00,
      price_merchant: 2200.00
    },
    {
      id: 1003,
      order_id: 2,
      item_id: 102,
      quantity: 1,
      sku: '5027',
      name: 'كبه هفار 1000 وات تربو  أبيض',
      type: 'product',
      available_qty: 30,
      price_customer: 1750.00,
      price_merchant: 1500.00
    }
  ],
  3: [
    {
      id: 1004,
      order_id: 3,
      item_id: 102,
      quantity: 1,
      sku: '5027',
      name: 'كبه هفار 1000 وات تربو  أبيض',
      type: 'product',
      available_qty: 30,
      price_customer: 1750.00,
      price_merchant: 1500.00
    }
  ],
  4: [
    {
      id: 1005,
      order_id: 4,
      item_id: 101,
      quantity: 2,
      sku: '5069',
      name: 'خلاط هفار 8000 وات 7*1',
      type: 'product',
      available_qty: 50,
      price_customer: 2450.00,
      price_merchant: 2200.00
    }
  ],
  5: [
    {
      id: 1006,
      order_id: 5,
      item_id: 101,
      quantity: 2,
      sku: '5069',
      name: 'خلاط هفار 8000 وات 7*1',
      type: 'product',
      available_qty: 50,
      price_customer: 2450.00,
      price_merchant: 2200.00
    }
  ],
  6: [
    {
      id: 1007,
      order_id: 6,
      item_id: 103,
      quantity: 1,
      sku: '5068',
      name: 'خلاط هفار 5000 وات',
      type: 'product',
      available_qty: 25,
      price_customer: 1450.00,
      price_merchant: 1300.00
    }
  ],
  7: [
    {
      id: 1008,
      order_id: 7,
      item_id: 101,
      quantity: 1,
      sku: '5069',
      name: 'خلاط هفار 8000 وات 7*1',
      type: 'product',
      available_qty: 50,
      price_customer: 2450.00,
      price_merchant: 2200.00
    }
  ],
  8: [
    {
      id: 1009,
      order_id: 8,
      item_id: 102,
      quantity: 1,
      sku: '5027',
      name: 'كبه هفار 1000 وات تربو  أبيض',
      type: 'product',
      available_qty: 30,
      price_customer: 1750.00,
      price_merchant: 1500.00
    }
  ],
  9: [
    {
      id: 1010,
      order_id: 9,
      item_id: 101,
      quantity: 1,
      sku: '5069',
      name: 'خلاط هفار 8000 وات 7*1',
      type: 'product',
      available_qty: 50,
      price_customer: 2450.00,
      price_merchant: 2200.00
    }
  ]
};

// Mock current agent (in real app, get from auth context)
const getCurrentAgent = () => {
  return {
    id: 1,
    name: 'المستخدم الحالي'
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper: Get last attempt number for today
const getLastAttemptToday = (orderId) => {
  const today = new Date().toISOString().split('T')[0];
  const calls = mockCalls[orderId] || [];
  const todayCalls = calls.filter(call => {
    const callDate = new Date(call.call_datetime).toISOString().split('T')[0];
    return callDate === today;
  });

  if (todayCalls.length === 0) return null;
  return todayCalls[todayCalls.length - 1];
};

// Helper: Create call record
const createCallRecord = (orderId, status, data = {}) => {
  const agent = getCurrentAgent();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Get attempt number
  const lastAttempt = getLastAttemptToday(orderId);
  const attemptNumber = lastAttempt
    ? lastAttempt.attempt_number + 1
    : 1;

  // Calculate next_action_at for no_answer
  let nextActionAt = null;
  let gapTimeHours = null;
  if (status === 'no_answer') {
    gapTimeHours = 4; // 4 hours between attempts
    nextActionAt = new Date(now);
    nextActionAt.setHours(nextActionAt.getHours() + gapTimeHours);
  }

  const callRecord = {
    id: Date.now(), // Simple ID generation
    order_id: orderId,
    agent_id: agent.id,
    agent_name: agent.name,
    call_date: today,
    call_time: now.toTimeString().split(' ')[0],
    call_datetime: now.toISOString(),
    duration_seconds: data.duration_seconds || null,
    attempt_number: attemptNumber,
    is_daily_attempt: true,
    status: status,
    delivery_date: status === 'confirmed' ? data.delivery_date : null,
    scheduled_date: status === 'scheduled' ? data.scheduled_date : null,
    cancellation_reason: status === 'canceled' ? data.cancellation_reason : null,
    history: data.history || '',
    items: data.items || null,
    total: data.total !== undefined ? data.total : null,
    next_action_at: nextActionAt ? nextActionAt.toISOString() : null,
    gap_time_hours: gapTimeHours
  };

  // Store call record
  if (!mockCalls[orderId]) {
    mockCalls[orderId] = [];
  }
  mockCalls[orderId].push(callRecord);

  return callRecord;
};

// Helper: Parse order description text (internal). Adaptive: SKU in parens (5070+b, 5070+04),
// multi-item same line, reversed "name * qty", pipe separator. See ORDER-DESCRIPTION-TO-ITEMS-STUDY.
const parseDescriptionText = (description) => {
  if (!description || typeof description !== 'string') return [];
  const text = description.trim();
  if (!text) return [];

  const items = [];
  // Split by pipe or double newline for multi-item blocks
  const blocks = text.split(/\s*\|\s*|\n{2,}/).map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    let matched = false;
    // Pattern 1: "Qty * Name (SKU)" — SKU = [^)]+ (5070+b, 5070+04, etc). Global findall for multi-item same line.
    const pattern1 = /(\d+)\s*\*\s*(.+?)\s*\(([^)]+)\)/g;
    let m;
    while ((m = pattern1.exec(block)) !== null) {
      items.push({
        quantity: parseInt(m[1], 10),
        name: m[2].trim(),
        sku: m[3].trim()
      });
      matched = true;
    }
    if (matched) continue;

    // Pattern 2: "Name (SKU) * Qty" reversed
    const m2 = block.match(/(.+?)\s*\(([^)]+)\)\s*\*\s*(\d+)\s*$/);
    if (m2) {
      items.push({
        quantity: parseInt(m2[3], 10),
        name: m2[1].trim(),
        sku: m2[2].trim()
      });
      continue;
    }

    // Pattern 3: "Name * Qty" (no SKU) — match by name later
    const m3 = block.match(/(.+?)\s*\*\s*(\d+)\s*$/);
    if (m3) {
      items.push({
        quantity: parseInt(m3[2], 10),
        name: m3[1].trim(),
        sku: null
      });
    }
  }

  return items;
};

/**
 * Same as parseDescriptionText, but if nothing matches ERP-style lines, yield one row from the
 * first non-empty line (or full text) so RMT sessions / Bosta auto-fill still show lines and
 * confirm sends non-empty items[] (user can link stock when item_id is null).
 */
const parseDescriptionTextWithFallback = (description) => {
  const parsed = parseDescriptionText(description || '');
  if (parsed.length > 0) return parsed;
  const t = String(description || '').trim();
  if (!t) return [];
  const firstLine = t.split(/\r?\n/).map((l) => l.trim()).find(Boolean) || t;
  const p2 = parseDescriptionText(firstLine);
  if (p2.length > 0) return p2;
  const stripped = firstLine
    .replace(/^وصف\s*الطرد\s*:?\s*/i, '')
    .replace(/^وصف\s*الطلب\s*:?\s*/i, '')
    .trim();
  const p3 = parseDescriptionText(stripped);
  if (p3.length > 0) return p3;
  const compact = stripped.slice(0, 500);
  if (!compact) return [];
  return [{ quantity: 1, name: compact, sku: null }];
};

// Normalize for name matching: collapse spaces, trim
const _norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

/**
 * Convert items array to وصف الطلب text (ERP format). Same format as parseDescriptionText output.
 * Used when agent edits items → auto-update وصف الطلب until action (تأكيد/لم يرد/جدولة/إلغاء).
 */
export const itemsToDescriptionText = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) return '';
  const parts = items
    .filter((it) => {
      if (!it || typeof it !== 'object') return false;
      if (it.match_status === 'not_found') return false;
      const id = it.item_id ?? it.product_id ?? it.id;
      return id != null && String(id).trim() !== '';
    })
    .map((it) => {
      const qty = Math.max(1, Number(it.order_quantity ?? it.quantity ?? 1) || 1);
      const name = (it.name || '').trim();
      const sku = (it.sku || '').toString().trim();
      if (!name) return '';
      return sku ? `${qty} * ${name} (${sku})` : `${qty} * ${name}`;
    })
    .filter(Boolean);
  return parts.join(' ');
};

// Helper: Auto-match items with stock. SKU exact first; if no SKU, match by name (products preferred).
// `stockItems === null` → use mock list (dev / legacy). `[]` → no stock rows (do not fall back to mock).
const matchItemsWithStock = (parsedItems, stockItems = null) => {
  const list =
    stockItems === null
      ? mockStockItems
      : stockItems.length > 0
        ? stockItems
        : [];
  const matchedItems = [];
  const products = list.filter((si) => si.type === 'product');

  for (const item of parsedItems) {
    let stockItem = null;

    if (item.sku) {
      stockItem = list.find((si) => (si.sku || '').toString() === (item.sku || '').toString());
    }

    if (!stockItem && item.name) {
      const n = _norm(item.name);
      if (!n) {
        matchedItems.push({
          item_id: null,
          sku: item.sku,
          name: item.name,
          type: null,
          available_qty: 0,
          price_customer: null,
          price_merchant: null,
          order_quantity: item.quantity,
          match_status: 'not_found'
        });
        continue;
      }
      const searchIn = products.length ? products : list;
      stockItem = searchIn.find((si) => {
        const sn = _norm(si.name || '');
        return sn && (sn.includes(n) || n.includes(sn) || sn === n);
      });
    }

    if (stockItem) {
      matchedItems.push({
        item_id: stockItem.id,
        sku: stockItem.sku,
        name: stockItem.name,
        type: stockItem.type,
        available_qty: stockItem.quantity_on_hand ?? stockItem.available_qty ?? 0,
        price_customer: stockItem.price_customer,
        price_merchant: stockItem.price_merchant,
        order_quantity: item.quantity
      });
    } else {
      matchedItems.push({
        item_id: null,
        sku: item.sku,
        name: item.name,
        type: null,
        available_qty: 0,
        price_customer: null,
        price_merchant: null,
        order_quantity: item.quantity,
        match_status: 'not_found'
      });
    }
  }
  return matchedItems;
};

// Helper: Find order by ID with multiple fallback strategies
const findOrderById = (orderId) => {
  // Try multiple lookup strategies
  let order = mockOrders.find(o => o.id === parseInt(orderId));

  // Fallback 1: Try by order_number (in case orderId is actually an order_number string)
  if (!order) {
    order = mockOrders.find(o => o.order_number === orderId || o.order_number === String(orderId));
  }

  // Fallback 2: Try by customer_id (for legacy orders that might use customer_id as order id)
  if (!order) {
    const customerOrders = mockOrders.filter(o => o.customer_id === parseInt(orderId));
    if (customerOrders.length > 0) {
      // If multiple orders found with same customer_id, get the most recent one
      order = customerOrders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date))[0];
    }
  }

  // Debug logging only when mock data exists (skip when using real API)
  if (!order && mockOrders.length > 0 && (import.meta.env.DEV || import.meta.env.MODE === 'development')) {
    console.warn('🔍 Order lookup failed:', {
      orderId,
      orderIdType: typeof orderId,
      totalOrders: mockOrders.length,
      sampleOrderIds: mockOrders.slice(0, 3).map(o => ({ id: o.id, order_number: o.order_number, customer_id: o.customer_id })),
      matchingById: mockOrders.filter(o => o.id === parseInt(orderId)).length,
      matchingByNumber: mockOrders.filter(o => o.order_number === orderId || o.order_number === String(orderId)).length,
      matchingByCustomerId: mockOrders.filter(o => o.customer_id === parseInt(orderId)).length
    });
  }

  return order;
};

// Helper: Enrich order with customer data
const enrichOrderWithCustomer = (order) => {
  // If order already has customer data from ERP conversion, use it
  if (order.customer) {
    return {
      ...order,
      customer: {
        id: order.customer_id,
        name: order.customer.name,
        phone: order.customer.phone,
        phone_secondary: null,
        governorate: order.address_governorate,
        city: order.address_city,
        address_details: order.address_full
      }
    };
  }

  // Otherwise, try to get from mockCustomers
  const customer = mockCustomers[order.customer_id];
  if (!customer) {
    return {
      ...order,
      customer: null
    };
  }

  return {
    ...order,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      phone_secondary: customer.phone_secondary,
      governorate: customer.governorate,
      city: customer.city,
      address_details: customer.address_details
    }
  };
};

// ============================================================================
// API ENDPOINTS - DRAFT ORDERS
// ============================================================================

/**
 * GET /api/call-center/sync-status/{job_id}
 * Get ERP sync job status (for polling)
 *
 * @param {string} job_id - Job ID returned from syncOrders
 * @returns {Object} Job status with progress, counts, etc.
 */
export const getSyncStatus = async (job_id) => {
  const axiosInstance = await getAxios();
  const { data } = await axiosInstance.get(`/api/call-center/sync-status/${job_id}`);
  return data;
};

/**
 * GET /api/call-center/sync-status
 * Get active sync status (if any sync is currently running)
 *
 * @returns {Object} {running: boolean, job_id?: string, ...job_status}
 */
export const getActiveSyncStatus = async () => {
  const axiosInstance = await getAxios();
  const { data } = await axiosInstance.get('/api/call-center/sync-status');
  return data;
};

/**
 * POST /api/call-center/orders/sync-from-erp
 * Sync/refresh orders from ERP API (async background worker)
 *
 * IMPORTANT: This function preserves existing order status, attempt_count, and call history.
 * Only updates order data that might have changed (customer info, address, items, etc.)
 *
 * NEW: Uses background worker pattern - returns immediately, polls for status.
 * Performance: 5-7 min blocking → 200ms response + 10-15s background sync
 *
 * Authentication:
 * - If username/password provided: Uses automatic authentication (recommended)
 * - If csrfToken/sessionCookie provided: Uses manual authentication
 *
 * Cases:
 * - Success: Orders synced successfully (after polling completes)
 * - Error: Sync failed
 * - Partial: Some orders failed to sync
 *
 * @param {Object} options - Sync options
 * @param {string} options.start_date - Start date (YYYY-MM-DD)
 * @param {string} options.end_date - End date (YYYY-MM-DD)
 * @param {string} options.username - ERP username (for auto-auth)
 * @param {string} options.password - ERP password (for auto-auth)
 * @param {Function} options.onProgress - Optional callback for progress updates: (status) => {}
 * @param {string} options.csrfToken - CSRF token (optional, if not using username/password)
 * @param {string} options.sessionCookie - Session cookie (optional, if not using username/password)
 * @returns {Promise<Object>} Sync result with counts (after polling completes)
 */
export const syncOrders = async (options = {}) => {
  const {
    start_date = '2026-01-01',
    end_date = '2026-12-31',
    username = 'kariemseiam',
    password = '123123',
    onProgress = null
  } = options;

  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  const axiosInstance = await getAxios();

  // Check if sync is already running
  try {
    const activeStatus = await getActiveSyncStatus();
    if (activeStatus.running && activeStatus.job_id) {
      // Sync is already running - use existing job_id
      const job_id = activeStatus.job_id;

      // Poll for status of existing sync
      const pollInterval = 2000;
      const maxWaitTime = 300000;
      const startTime = Date.now();

      return new Promise((resolve, reject) => {
        const poll = async () => {
          try {
            if (Date.now() - startTime > maxWaitTime) {
              reject(new Error('Sync timeout: exceeded 5 minutes'));
              return;
            }

            const status = await getSyncStatus(job_id);

            if (onProgress && typeof onProgress === 'function') {
              onProgress(status);
            }

            if (status.status === 'completed') {
              resolve({
                success: true,
                message: `تم تحديث الطلبات بنجاح: ${status.created || 0} جديد، ${status.updated || 0} محدث، ${status.skipped || 0} تم تخطيه، ${status.deleted || 0} محذوف`,
                synced_count: (status.created || 0) + (status.skipped || 0),
                new_orders: status.created || 0,
                updated_orders: status.updated || 0,
                skipped_orders: status.skipped || 0,
                deleted_orders: status.deleted || 0,
                job_id: job_id,
                already_running: true
              });
            } else if (status.status === 'failed') {
              reject(new Error(`Sync failed: ${status.error || 'Unknown error'}`));
            } else {
              setTimeout(poll, pollInterval);
            }
          } catch (error) {
            if (error.response?.status === 404 && Date.now() - startTime < 5000) {
              setTimeout(poll, pollInterval);
            } else {
              reject(error);
            }
          }
        };
        poll();
      });
    }
  } catch (error) {
    // If check fails, continue with starting new sync
    console.warn('Could not check active sync status:', error);
  }

  // Start sync (non-blocking) - returns job_id immediately
  const { data: startData } = await axiosInstance.post('/api/call-center/orders/sync-from-erp', {
    username,
    password,
    start_date,
    end_date
  });

  const job_id = startData?.job_id;
  if (!job_id) {
    throw new Error('Failed to start sync: no job_id returned');
  }

  // If sync was already running, return early (handled above)
  if (startData?.already_running) {
    // This shouldn't happen due to check above, but handle it anyway
    return Promise.resolve({
      success: true,
      message: 'Sync is already running',
      job_id: job_id,
      already_running: true
    });
  }

  // Poll for status (every 2 seconds, max 5 minutes)
  const pollInterval = 2000; // 2 seconds
  const maxWaitTime = 300000; // 5 minutes
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        // Check timeout
        if (Date.now() - startTime > maxWaitTime) {
          reject(new Error('Sync timeout: exceeded 5 minutes'));
          return;
        }

        const status = await getSyncStatus(job_id);

        // Call progress callback if provided
        if (onProgress && typeof onProgress === 'function') {
          onProgress(status);
        }

        // Check status
        if (status.status === 'completed') {
          resolve({
            success: true,
            message: `تم تحديث الطلبات بنجاح: ${status.created || 0} جديد، ${status.updated || 0} محدث، ${status.skipped || 0} تم تخطيه، ${status.deleted || 0} محذوف`,
            synced_count: (status.created || 0) + (status.skipped || 0),
            new_orders: status.created || 0,
            updated_orders: status.updated || 0,
            skipped_orders: status.skipped || 0,
            deleted_orders: status.deleted || 0,
            job_id: job_id
          });
        } else if (status.status === 'failed') {
          reject(new Error(`Sync failed: ${status.error || 'Unknown error'}`));
        } else {
          // Still running or pending - continue polling
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        // If job not found, might be race condition - wait a bit and retry once
        if (error.response?.status === 404 && Date.now() - startTime < 5000) {
          setTimeout(poll, pollInterval);
        } else {
          reject(error);
        }
      }
    };

    // Start polling immediately
    poll();
  });
};

// ============================================================================
// API ENDPOINTS - ORDERS LISTING
// ============================================================================

/**
 * GET /api/call-center/orders
 * List orders with filtering (state, date range)
 *
 * Query Parameters:
 * - status: 'new' | 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'all'
 * - date: YYYY-MM-DD (single date filter)
 * - start_date: YYYY-MM-DD (date range start)
 * - end_date: YYYY-MM-DD (date range end)
 * - limit: number (pagination)
 * - offset: number (pagination)
 *
 * Cases:
 * - Success: Returns filtered orders
 * - Success: Empty result (no orders match)
 * - Error: Invalid date format
 * - Error: Invalid status
 */
export const listOrders = async (params = {}) => {
  const axiosInstance = await getAxios();
  const q = new URLSearchParams();
  if (params.status && params.status !== 'all') q.set('status', params.status);
  const todayStr = params.today || toLocalDateKey(new Date());
  q.set('today', todayStr);
  if (params.all_dates) {
    q.set('all_dates', '1');
  } else if (params.date_from != null && params.date_to != null) {
    q.set('date_from', params.date_from);
    q.set('date_to', params.date_to);
  } else {
    const date = params.date || params.start_date || todayStr;
    q.set('date_from', date);
    q.set('date_to', date);
  }
  if (params.search) q.set('search', params.search);
  if (params.statuses) q.set('statuses', params.statuses);
  if (params.min_attempts != null) q.set('min_attempts', String(params.min_attempts));
  if (params.attempts) q.set('attempts', Array.isArray(params.attempts) ? params.attempts.join(',') : String(params.attempts));
  q.set('page', params.page ?? 1);
  q.set('per_page', params.limit ?? 25);
  const { data } = await axiosInstance.get(`/api/call-center/orders?${q}`);
  const orders = (data.data || []).map(mapOrderFromBackend);
  const p = data.pagination || {};
  const page = p.page || 1;
  const limit = p.per_page || 25;
  const total = p.total ?? orders.length;
  const pages = p.pages ?? (Math.ceil(total / limit) || 1);
  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      has_more: page < pages
    }
  };
};

/**
 * GET /api/call-center/orders/:id
 * Get single order details
 *
 * Cases:
 * - Success: Returns order with items
 * - Error: Order not found (404)
 */
export const getOrder = async (orderId) => {
  const axiosInstance = await getAxios();
  const { data } = await axiosInstance.get(`/api/call-center/orders/${orderId}`);
  const order = mapOrderFromBackend(data.order);
  if (!order) throw new Error('Order not found');
  return {
    order,
    items: [] // Backend doesn't store order items yet; use autoMatchItems for parse-from-description
  };
};

// ============================================================================
// API ENDPOINTS - CALL SESSION
// ============================================================================

/**
 * GET /api/call-center/orders/:id/call-context
 * Load customer context for call session
 *
 * Returns:
 * - Customer data (by phone)
 * - Bosta orders (from customer.bosta_orders JSON)
 * - Services (from customer.customer_services JSON)
 * - Order description
 *
 * Cases:
 * - Success: Returns full customer context
 * - Error: Order not found
 * - Error: Customer not found
 */
export const getOrderCallContext = async (orderId) => {
  const axiosInstance = await getAxios();
  const { data } = await axiosInstance.get(`/api/call-center/orders/${orderId}`);
  const order = mapOrderFromBackend(data.order);
  if (!order) throw new Error('Order not found');

  const phone = order.customer?.phone || order.customer_phone;
  let customer = null;
  let orders = [];
  let services = [];

  if (phone) {
    const searchCustomer = async (p) => {
      try {
        const custModule = await getCustomerAPI();
        const cust = custModule?.default ?? custModule;
        const searchRes = await cust?.searchCustomers?.(p, { type: 'phone' });
        const list = Array.isArray(searchRes) ? searchRes : searchRes?.data ?? [];
        return list?.length ? list[0] : null;
      } catch (_) {
        return null;
      }
    };
    customer = await searchCustomer(phone);
    const phonesToFetch = [phone];
    if (customer?.phone_secondary && String(customer.phone_secondary).trim() !== String(phone).trim()) {
      phonesToFetch.push(String(customer.phone_secondary).trim());
    }
    const seenTracking = new Set();
    // Fetch Bosta for all phones in parallel (not sequential) — saves 6-8s when secondary phone is slow
    const bostaResults = await Promise.all(
      phonesToFetch.map(p =>
        axiosInstance
          .get(`/api/bosta/customer/${encodeURIComponent(p)}/orders?enrich=0`)
          .catch(() => ({ data: null })) // Don't fail if one phone fails
      )
    );
    for (const bostaResult of bostaResults) {
      if (!bostaResult.data) continue;
      const d = bostaResult.data?.data ?? bostaResult.data;
      const list = d?.orders ?? (Array.isArray(d) ? d : []);
      for (const o of list) {
        const tr = o?.trackingNumber || o?.tracking_number;
        const key = tr ? String(tr).trim() : `idx-${orders.length}`;
        if (!seenTracking.has(key)) {
          seenTracking.add(key);
          orders.push(o);
        }
      }
    }
    if (customer) {
      const parsed = parseCustomerJSONFields(customer);
      services = Array.isArray(parsed.customer_services) ? parsed.customer_services : [];
    }
  }

  return {
    customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone, phone_secondary: customer.phone_secondary, governorate: customer.governorate, city: customer.city, address_details: customer.address_details } : (order.customer ? { id: null, name: order.customer.name, phone: order.customer.phone } : null),
    orders,
    services,
    order
  };
};

/**
 * Get customer context by phone (Phase B: direct call, no order).
 * Tries primary phone first; if no customer found and phoneSecondary provided, tries secondary.
 * Bosta orders fetched for both phones and merged (deduped by tracking number).
 */
export const getCustomerContextByPhone = async (phone, phoneSecondary = null) => {
  if (!phone || !String(phone).trim()) {
    return { customer: null, orders: [], services: [] };
  }
  const axiosInstance = await getAxios();
  const primaryPhone = String(phone).trim();
  const secondaryPhone = phoneSecondary && String(phoneSecondary).trim() ? String(phoneSecondary).trim() : null;
  let customer = null;
  let orders = [];
  let services = [];

  const searchCustomer = async (p) => {
    try {
      const custModule = await getCustomerAPI();
      const cust = custModule?.default ?? custModule;
      const searchRes = await cust?.searchCustomers?.(p, { type: 'phone' });
      const list = Array.isArray(searchRes) ? searchRes : searchRes?.data ?? [];
      return list?.length ? list[0] : null;
    } catch (_) {
      return null;
    }
  };

  customer = await searchCustomer(primaryPhone);
  if (!customer && secondaryPhone) {
    customer = await searchCustomer(secondaryPhone);
  }

  const phonesToFetch = [primaryPhone];
  if (secondaryPhone && secondaryPhone !== primaryPhone) phonesToFetch.push(secondaryPhone);

  const seenTracking = new Set();
  // Same as getOrderCallContext: parallel Bosta — sequential was ~2× wall time with two phones.
  const bostaResults = await Promise.all(
    phonesToFetch.map((p) =>
      axiosInstance
        .get(`/api/bosta/customer/${encodeURIComponent(p)}/orders?enrich=0`)
        .catch(() => ({ data: null }))
    )
  );
  for (const bostaRes of bostaResults) {
    if (!bostaRes?.data) continue;
    const d = bostaRes.data?.data ?? bostaRes.data;
    const list = d?.orders ?? (Array.isArray(d) ? d : []);
    for (const o of list) {
      const tr = o?.trackingNumber || o?.tracking_number;
      const key = tr ? String(tr).trim() : `idx-${orders.length}`;
      if (!seenTracking.has(key)) {
        seenTracking.add(key);
        orders.push(o);
      }
    }
  }

  if (customer) {
    const parsed = parseCustomerJSONFields(customer);
    services = Array.isArray(parsed.customer_services) ? parsed.customer_services : [];
    customer = { id: parsed.id, name: parsed.name, phone: parsed.phone, phone_secondary: parsed.phone_secondary, governorate: parsed.governorate, city: parsed.city, address_details: parsed.address_details };
  }

  return {
    customer: customer || { id: null, name: '', phone: primaryPhone },
    orders,
    services
  };
};

/**
 * POST /api/call-center/calls/ask-only
 * Log ASK call with no order (Phase B: direct inquiry).
 */
export const askOnly = async ({ customer_phone, notes = '', agent_id, agent_name = '' }) => {
  if (!customer_phone || !String(customer_phone).trim()) {
    throw new Error('customer_phone required');
  }
  const axiosInstance = await getAxios();
  const { data } = await axiosInstance.post('/api/call-center/calls/ask-only', {
    customer_phone: String(customer_phone).trim(),
    call_type: 'ask',
    notes: notes || 'استفسار',
    agent_id: toAgentId(agent_id),
    agent_name: agent_name || ''
  });
  return { success: true, ...data };
};

/**
 * POST /api/call-center/orders
 * Create direct order (Phase B: Journey B).
 */
export const createDirectOrder = async ({ customer_phone, customer_name = '', source = 'direct', service_type, delivery_address, governorate, city, cod_amount }) => {
  if (!customer_phone || !String(customer_phone).trim()) {
    throw new Error('customer_phone required');
  }
  const axiosInstance = await getAxios();
  const { data } = await axiosInstance.post('/api/call-center/orders', {
    source,
    customer_phone: String(customer_phone).trim(),
    customer_name: customer_name || '',
    service_type: service_type || null,
    delivery_address: delivery_address || null,
    governorate: governorate || null,
    city: city || null,
    cod_amount: cod_amount ?? null
  });
  const order = data.order;
  return {
    success: true,
    order: order ? mapOrderFromBackend(order) : null,
    order_id: order?.id
  };
};

/**
 * POST /api/call-center/orders/:id/auto-match-items
 * Auto-match items from description
 *
 * Request Body:
 * { description?: string } (optional, uses order description if not provided)
 *
 * Returns:
 * - Matched items with prices from stock
 *
 * Cases:
 * - Success: All items matched
 * - Success: Partial match (some items not found)
 * - Success: No items matched
 * - Error: Order not found
 */
/**
 * @param {object} [opts]
 * @param {string} [opts.callType] — When `'sell'`, uses strict {@link parseDescriptionText} only (no free-text blob
 *   fallback). R/M/T and unspecified type keep {@link parseDescriptionTextWithFallback} (Bosta / وصف sessions need the blob line).
 *   For every call type, only rows that resolve to a real stock id are returned — no auto-drafted «ghost» lines from
 *   unmatched ERP text (same rule as sell). Dev-only: if the stock GET fails, mock stock is still used for matching.
 */
export const autoMatchItems = async (orderId, description = null, opts = {}) => {
  let desc = description;
  if (desc == null) {
    const { order } = await getOrder(orderId);
    desc = order?.order_description ?? '';
  }
  const callType = String(opts.callType || opts.serviceType || '').toLowerCase();
  const isSell = callType === 'sell';
  const parsed = isSell ? parseDescriptionText(desc || '') : parseDescriptionTextWithFallback(desc || '');
  let stockItemsForMatch = null;
  try {
    const axiosInstance = await getAxios();
    const res = await axiosInstance.get('/api/stock/items');
    const raw = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    stockItemsForMatch = Array.isArray(raw) ? raw : [];
  } catch (_) {
    stockItemsForMatch = import.meta.env.DEV ? null : [];
  }
  const rawMatched = matchItemsWithStock(parsed, stockItemsForMatch);
  const matched = rawMatched.filter((it) => {
    const id = it?.item_id ?? it?.product_id ?? it?.id;
    return id != null && String(id).trim() !== '' && it.match_status !== 'not_found';
  });
  return {
    items: matched,
    match_summary: {
      total: rawMatched.length,
      matched: matched.length,
      not_found: rawMatched.length - matched.length
    }
  };
};

/**
 * GET order items — uses confirmation_snapshot when present (confirmed orders), else autoMatchItems.
 * So items appear in session, in OrderItemsModal, and table count is correct.
 */
export const getOrderItems = async (orderId) => {
  try {
    const { order } = await getOrder(orderId);
    if (order?.confirmation_snapshot?.items?.length) {
      return await getOrderItemsFromSnapshot(order);
    }
    const st = String(order?.service_type || order?.confirmation_snapshot?.call_type || '').toLowerCase();
    const res = await autoMatchItems(orderId, order?.order_description ?? null, {
      callType: ['sell', 'replacement', 'maintenance', 'return'].includes(st) ? st : undefined
    });
    const rawItems = res.items || [];
    const items = rawItems.map((it, i) => ({
      ...it,
      quantity: it.order_quantity ?? it.quantity ?? 1,
      price_customer: it.price_customer ?? 0,
      _uid: it._uid ?? `auto-${i}`
    }));
    const total = items.reduce((sum, item) => sum + (item.price_customer || 0) * (item.quantity || 0), 0);
    return { items, total };
  } catch (_) {
    return { items: [], total: 0 };
  }
};

/**
 * Build order items + total from order.confirmation_snapshot (saved when agent confirmed).
 * Used when re-opening a confirmed order so items and notes appear in the session.
 * For sell: returns items (flat), total.
 * For R/M/T with direction in snapshot: returns itemsToSend, itemsToReceive, total.
 * For legacy flat items: returns items (flat), total.
 */
export const getOrderItemsFromSnapshot = async (order) => {
  const snap = order?.confirmation_snapshot;
  const snapItems = snap?.items;
  const callType = snap?.call_type || order?.service_type || 'sell';
  if (!snapItems || !Array.isArray(snapItems) || snapItems.length === 0) {
    return { items: [], itemsToSend: [], itemsToReceive: [], total: 0 };
  }
  // Try to enrich with live stock data (prices, availability). If this fails, fall back to snapshot data.
  let stockItems = [];
  try {
    const axiosInstance = await getAxios();
    const res = await axiosInstance.get('/api/stock/items');
    stockItems = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  } catch (_) {
    // Stock fetch failed — proceed with snapshot data only (name/sku saved in snapshot)
  }
  const byId = {};
  stockItems.forEach((s) => {
    const id = s.id ?? s.item_id;
    if (id != null) {
      byId[id] = s;
      byId[String(id)] = s;   // also index as string to handle type coercion
    }
  });

  const toItem = (row, extra = {}) => {
    const itemId = row.item_id ?? row.product_id;
    const qty = row.quantity ?? row.order_quantity ?? 1;
    const stock = byId[itemId];
    // Price: prefer live stock, fall back to snapshot price_customer
    const price = stock ? (parseFloat(stock.price_customer) || 0) : (parseFloat(row.price_customer) || 0);
    // Name/SKU/type: prefer live stock, fall back to what was saved in snapshot
    return {
      item_id: itemId,
      id: itemId,
      order_quantity: qty,
      quantity: qty,
      price_customer: price,
      name: stock?.name ?? row.name ?? '',
      sku: stock?.sku ?? row.sku ?? '',
      type: stock?.type ?? row.type ?? 'product',
      ...extra
    };
  };

  const addUid = (item, i) => ({ ...item, _uid: item._uid ?? `snap-${i}` });

  const hasDirection = snapItems.some((r) => r.direction != null);
  const isRMT = ['replacement', 'maintenance', 'return'].includes(callType);

  const codFromSnapshot = parseFloat(snap?.cod_amount) || parseFloat(order?.cod_amount) || 0;

  if (isRMT && hasDirection) {
    const itemsToSend = [];
    const itemsToReceive = [];
    let total = 0;
    snapItems.forEach((row, i) => {
      const item = addUid(toItem(row, { direction: row.direction, condition: row.condition }), i);
      const price = item.price_customer ?? 0;
      const qty = item.quantity ?? 1;
      total += price * qty;
      if (row.direction === 'send') {
        itemsToSend.push(item);
      } else {
        itemsToReceive.push(item);
      }
    });
    const finalTotal = total > 0 ? total : codFromSnapshot;
    return { items: [], itemsToSend, itemsToReceive, total: finalTotal };
  }

  const items = [];
  let total = 0;
  snapItems.forEach((row, i) => {
    const item = addUid(toItem(row), i);
    items.push(item);
    total += (item.price_customer ?? 0) * (item.quantity ?? 1);
  });
  const finalTotal = total > 0 ? total : codFromSnapshot;
  return { items, itemsToSend: [], itemsToReceive: [], total: finalTotal };
};

/**
 * POST /api/call-center/orders/:id/items
 * Add/update order items
 *
 * Request Body:
 * { items: [{ item_id, quantity, price_customer?, price_merchant? }] }
 *
 * Cases:
 * - Success: Items added/updated
 * - Error: Order not found
 * - Error: Item not found
 * - Error: Invalid quantity
 * - Error: Insufficient stock
 */
export const updateOrderItems = async (orderId, items) => {
  await delay(400);

  const order = findOrderById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  // Validate items
  for (const item of items) {
    const stockItem = mockStockItems.find(si => si.id === item.item_id);
    if (!stockItem) {
      throw new Error(`Item ${item.item_id} not found in stock`);
    }
    if (item.quantity > stockItem.available_qty) {
      throw new Error(`Insufficient stock for item ${stockItem.sku}. Available: ${stockItem.available_qty}, Requested: ${item.quantity}`);
    }
  }

  // Update order items
  mockOrderItems[orderId] = items.map(item => {
    const stockItem = mockStockItems.find(si => si.id === item.item_id);
    return {
      id: Date.now() + Math.random(), // Simple ID
      order_id: orderId,
      item_id: item.item_id,
      quantity: item.quantity,
      sku: stockItem.sku,
      name: stockItem.name,
      type: stockItem.type,
      available_qty: stockItem.available_qty,
      price_customer: item.price_customer || stockItem.price_customer,
      price_merchant: item.price_merchant || stockItem.price_merchant
    };
  });

  // Update order items_count
  order.items_count = items.length;

  return {
    success: true,
    items: mockOrderItems[orderId],
    total: mockOrderItems[orderId].reduce((sum, item) => sum + (item.price_customer * item.quantity), 0)
  };
};

/**
 * DELETE /api/call-center/orders/:id/items/:item_id
 * Remove order item
 *
 * Cases:
 * - Success: Item removed
 * - Error: Order not found
 * - Error: Item not found
 */
export const removeOrderItem = async (orderId, itemId) => {
  await delay(200);

  const order = findOrderById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  const items = mockOrderItems[orderId] || [];
  const itemIndex = items.findIndex(i => i.id === parseInt(itemId));

  if (itemIndex === -1) {
    throw new Error('Item not found in order');
  }

  items.splice(itemIndex, 1);
  mockOrderItems[orderId] = items;

  // Update order items_count
  order.items_count = items.length;

  return {
    success: true,
    items: items
  };
};

// ============================================================================
// API ENDPOINTS - ORDER ACTIONS
// ============================================================================

/**
 * POST /api/call-center/orders/:id/confirm
 * Confirm order
 *
 * Request Body:
 * {
 *   delivery_date: YYYY-MM-DD,
 *   history?: string,
 *   items?: array (if modified),
 *   total?: number (if modified)
 * }
 *
 * Creates call record with status='confirmed' and updates order
 *
 * Cases:
 * - Success: Order confirmed
 * - Error: Order not found
 * - Error: Order already confirmed/canceled
 * - Error: Invalid delivery date
 * - Error: Order locked by another agent
 */
export const confirmOrder = async (orderId, data) => {
  const callType = data.call_type || 'sell';
  let items;

  /** Do NOT use `(arrA || arrB)` — [] is truthy in JS; empty send/receive skipped unified `data.items` and posted [] to confirm-by-customer. */
  const rmtHasSplitLines =
    (data.itemsToSend?.length ?? 0) > 0 || (data.itemsToReceive?.length ?? 0) > 0;

  const mapRmtUnifiedFromDataItems = () =>
    (data.items || [])
      .map((it) => {
        const id = it.item_id ?? it.product_id ?? it.id;
        return {
          item_id: id,
          product_id: id,
          quantity: it.order_quantity ?? it.quantity ?? 1,
          direction: it.direction,
          condition: it.condition,
          name: it.name || '',
          sku: it.sku || '',
          type: it.type || 'product'
        };
      })
      .filter((it) => it.item_id != null && String(it.item_id).trim() !== '');

  if (callType === 'sell') {
    /** Same id resolution as R/M/T — stock rows may expose only `id` or `product_id` */
    items = (data.items || [])
      .map((it) => {
        const id = it.item_id ?? it.product_id ?? it.id;
        return {
          item_id: id,
          product_id: id,
          quantity: it.order_quantity ?? it.quantity ?? 1,
          name: it.name || '',
          sku: it.sku || '',
          type: it.type || 'product'
        };
      })
      .filter((it) => it.item_id != null && String(it.item_id).trim() !== '');
  } else if (['replacement', 'maintenance', 'return'].includes(callType)) {
    /**
     * CallSessionFAB sends both unified `items` (finalItems) and `itemsToSend`/`itemsToReceive`.
     * Prefer unified list — split arrays can be stale/shorter than the merged cart (same item_id on send+receive, etc.).
     */
    const fromUnified = mapRmtUnifiedFromDataItems();
    if (fromUnified.length > 0) {
      items = fromUnified;
    } else if (rmtHasSplitLines) {
      const send = (data.itemsToSend || []).map((it) => ({
        item_id: it.item_id ?? it.product_id ?? it.id,
        product_id: it.item_id ?? it.product_id ?? it.id,
        quantity: it.order_quantity ?? it.quantity ?? 1,
        direction: 'send',
        condition: it.condition || 'valid',
        name: it.name || '',
        sku: it.sku || '',
        type: it.type || 'product'
      })).filter((it) => it.item_id != null && String(it.item_id).trim() !== '');
      const receive = (data.itemsToReceive || []).map((it) => ({
        item_id: it.item_id ?? it.product_id ?? it.id,
        product_id: it.item_id ?? it.product_id ?? it.id,
        quantity: it.order_quantity ?? it.quantity ?? 1,
        direction: 'receive',
        condition: it.condition || 'damaged',
        name: it.name || '',
        sku: it.sku || '',
        type: it.type || 'product'
      })).filter((it) => it.item_id != null && String(it.item_id).trim() !== '');
      items = [...send, ...receive];
    } else {
      items = [];
    }
  } else {
    items = mapRmtUnifiedFromDataItems();
  }

  if (callType === 'sell' && !items.length) {
    throw new Error('items (with item_id and quantity) required for sell');
  }
  if (callType === 'replacement' && !items.length) {
    throw new Error('items (with item_id and quantity) required for replacement');
  }
  if (callType === 'replacement' && items.length) {
    const hasSend = items.some((it) => it.direction === 'send');
    const hasReceive = items.some((it) => it.direction === 'receive');
    if (!hasSend || !hasReceive) {
      throw new Error('replacement requires at least one item to send and one item to receive');
    }
  }

  const axiosInstance = await getAxios();
  const rawCodAmount = data.cod_amount ?? data.total ?? 0;
  const codAmount =
    typeof rawCodAmount === 'number'
      ? rawCodAmount
      : (parseFloat(String(rawCodAmount).replace(/,/g, '')) || 0);
  const userInfo = data._userInfo;
  const payload = {
    call_type: data.call_type || 'sell',
    items,
    notes: data.history || 'تم تأكيد الطلب',
    cod_amount: codAmount,
    total: codAmount,
    user_id: toAgentId(userInfo?.id ?? data.user_id),
    agent_name: userInfo?.name || userInfo?.phone || data.agent_name || ''
  };
  if (data.order_description != null) payload.order_description = data.order_description;
  if (data.customer_phone) payload.customer_phone = String(data.customer_phone).trim();
  if (data.cost_adjustment != null && !Number.isNaN(parseFloat(data.cost_adjustment))) payload.cost_adjustment = parseFloat(data.cost_adjustment);
  if (data.original_tracking && String(data.original_tracking).trim()) payload.original_tracking = String(data.original_tracking).trim();
  const { data: res } = await axiosInstance.post(`/api/call-center/orders/${orderId}/confirm-by-customer`, payload);
  return { success: true, ...res };
};

/**
 * POST /api/call-center/orders/:id/cancel
 * Cancel order
 *
 * Request Body:
 * {
 *   cancellation_reason: string,
 *   history?: string
 * }
 *
 * Creates call record with status='canceled' and updates order
 *
 * Cases:
 * - Success: Order canceled
 * - Error: Order not found
 * - Error: Order already confirmed/canceled
 * - Error: Cancellation reason required
 * - Error: Order locked by another agent
 */
export const cancelOrder = async (orderId, reason, history = '', callType = 'sell', userInfo = null) => {
  const axiosInstance = await getAxios();
  const { data } = await axiosInstance.post(`/api/call-center/orders/${orderId}/cancel`, {
    call_type: callType,
    cancellation_reason: reason,
    notes: history,
    user_id: toAgentId(userInfo?.id),
    agent_name: userInfo?.name || userInfo?.phone || ''
  });
  return { success: true, ...data };
};

/**
 * POST /api/call-center/orders/:id/schedule
 * Schedule order
 *
 * Request Body:
 * {
 *   scheduled_date: YYYY-MM-DDTHH:mm:ssZ (ISO datetime),
 *   history?: string
 * }
 *
 * Creates call record with status='scheduled' and updates order
 *
 * Cases:
 * - Success: Order scheduled
 * - Error: Order not found
 * - Error: Order already confirmed/canceled
 * - Error: Scheduled date required
 * - Error: Order locked by another agent
 */
export const scheduleOrder = async (orderId, scheduledDate, history = '', callType = 'sell', userInfo = null) => {
  if (!scheduledDate) throw new Error('Scheduled date is required');
  const cbAt = scheduledDate.includes('T') ? scheduledDate : `${scheduledDate}T12:00:00`;
  const axiosInstance = await getAxios();
  const { data } = await axiosInstance.post(`/api/call-center/orders/${orderId}/schedule`, {
    call_type: callType,
    callback_at: cbAt,
    notes: history || 'تم جدولة الطلب',
    user_id: toAgentId(userInfo?.id),
    agent_name: userInfo?.name || userInfo?.phone || ''
  });
  return { success: true, ...data };
};

/**
 * POST /api/call-center/orders/:id/no-answer
 * Log no answer
 *
 * Request Body:
 * { history?: string }
 *
 * Creates call record with status='no_answer' and updates order
 * IMPORTANT: Order status stays 'new' per calls-model.md
 *
 * Cases:
 * - Success: No answer logged (attempt 1)
 * - Success: No answer logged (attempt 2)
 * - Success: No answer logged (attempt 3 - final)
 * - Error: Order not found
 * - Error: Already 3 attempts today
 * - Error: Order locked by another agent
 */
export const noAnswerOrder = async (orderId, history = '', callType = 'sell', userInfo = null) => {
  const axiosInstance = await getAxios();
  const { data } = await axiosInstance.post(`/api/call-center/orders/${orderId}/no-answer`, {
    call_type: callType,
    notes: history || 'لم يرد العميل',
    user_id: toAgentId(userInfo?.id),
    agent_name: userInfo?.name || userInfo?.phone || ''
  });
  return { success: true, ...data };
};

/**
 * POST /api/call-center/orders/:id/lock
 * Lock order for agent
 *
 * Cases:
 * - Success: Order locked
 * - Error: Order not found
 * - Error: Order already locked by another agent
 */
export const lockOrder = async (orderId) => {
  await delay(200);

  const order = findOrderById(orderId);
  // Real API: orders come from backend, not mockOrders — no-op when not in mock
  if (!order) {
    return { success: true, order: null, locked_by: null, locked_at: null };
  }

  // Lock is view-only: allow opening even if another agent has it (don't throw)
  if (order.locked_by && order.locked_by !== getCurrentAgent().id) {
    return { success: true, order: enrichOrderWithCustomer(order), locked_by: order.locked_by, locked_at: order.locked_at };
  }

  const agent = getCurrentAgent();
  order.locked_by = agent.id;
  order.locked_at = new Date().toISOString();

  return {
    success: true,
    order: enrichOrderWithCustomer(order),
    locked_by: agent.name,
    locked_at: order.locked_at
  };
};

/**
 * POST /api/call-center/orders/:id/unlock
 * Unlock order
 *
 * Cases:
 * - Success: Order unlocked
 * - Error: Order not found
 * - Error: Order not locked
 * - Error: Order locked by another agent (cannot unlock)
 */
export const unlockOrder = async (orderId) => {
  await delay(200);

  const order = findOrderById(orderId);
  // Real API: no-op when order not in mock (backend has no lock yet)
  if (!order) return { success: true, order: null };

  if (!order.locked_by) return { success: true, order: enrichOrderWithCustomer(order) };
  // Lock is view-only: allow closing session without owning the lock (no-op, don't throw)
  if (order.locked_by !== getCurrentAgent().id) {
    return { success: true, order: enrichOrderWithCustomer(order) };
  }

  order.locked_by = null;
  order.locked_at = null;

  return {
    success: true,
    order: enrichOrderWithCustomer(order)
  };
};

// ============================================================================
// API ENDPOINTS - PROCESS TO HUB
// ============================================================================

/**
 * POST /api/call-center/orders/:id/leader-approve
 * Leader approves order → creates ticket, status=converted
 */
export const leaderApprove = async (orderId, data = {}) => {
  const axiosInstance = await getAxios();
  const { data: res } = await axiosInstance.post(`/api/call-center/orders/${orderId}/leader-approve`, data);
  return { success: true, ...res };
};

/**
 * POST /api/call-center/orders/:id/reject
 * Leader rejects order → returns to agent (status=new)
 */
export const leaderReject = async (orderId, data = {}, userInfo = null) => {
  const axiosInstance = await getAxios();
  const payload = { ...data };
  if (userInfo?.id != null) payload.user_id = toAgentId(userInfo.id);
  const { data: res } = await axiosInstance.post(`/api/call-center/orders/${orderId}/reject`, payload);
  return { success: true, ...res };
};

/**
 * POST /api/call-center/orders/:id/request-info
 * Leader requests more info → status=new (order returns to agent queue; message in snapshot)
 */
export const leaderRequestInfo = async (orderId, data = {}, userInfo = null) => {
  const axiosInstance = await getAxios();
  const payload = { ...data };
  if (userInfo?.id != null) payload.user_id = toAgentId(userInfo.id);
  const { data: res } = await axiosInstance.post(`/api/call-center/orders/${orderId}/request-info`, payload);
  return { success: true, ...res };
};

/**
 * Process confirmed order to Hub — leader approval creates ticket
 * Replaces mock: calls leaderApprove for orders with status=confirmed
 *
 * @param {object} [opts] — optional; `notes`: final «ملاحظات الاتصال» from session FAB (merged into confirmation_snapshot before ticket)
 */
export const processOrderToHub = async (orderId, order = null, userInfo = null, opts = {}) => {
  const axiosInstance = await getAxios();
  const body = { 
    user_id: toAgentId(userInfo?.id),
    ...opts // Merge all fields from LeaderApprovalModal payload
  };
  const { data } = await axiosInstance.post(`/api/call-center/orders/${orderId}/leader-approve`, body);
  return {
    success: true,
    order: order ? { ...order, status: 'converted' } : null,
    ticket_id: data.ticket_id,
    ticket_number: data.ticket_number,
    message: 'تمت الموافقة وإنشاء التذكرة بنجاح'
  };
};

// ============================================================================
// API ENDPOINTS - STATISTICS & COUNTS
// ============================================================================

/**
 * GET /api/call-center/orders/dates-with-data
 * Get list of dates (YYYY-MM-DD) that have at least one order.
 */
export const getOrderDatesWithData = async () => {
  return deduplicateRequest(
    async () => {
      const axiosInstance = await getAxios();
      const { data } = await axiosInstance.get('/api/call-center/orders/dates-with-data');
      return Array.isArray(data.dates) ? data.dates : [];
    },
    '/api/call-center/orders/dates-with-data',
    {},
    { ttl: 30000 }
  );
};

/**
 * GET /api/call-center/orders/counts
 * Get order counts per state for a given date (single date or today totals).
 *
 * Query Parameters:
 * - date: YYYY-MM-DD (optional, defaults to today)
 *
 * Cases:
 * - Success: Returns counts for all states
 * - Success: Returns 0 for all states if no orders
 */
export const getOrderCounts = async (date = null, today = null) => {
  const dateStr = date ? toLocalDateKey(date) : null;
  const todayStr = today ? toLocalDateKey(today) : toLocalDateKey(new Date());
  const params = dateStr ? { date: dateStr, today: todayStr } : {};
  const options = { ttl: 15000 };
  return deduplicateRequest(
    async () => {
      const axiosInstance = await getAxios();
      const { data } = await axiosInstance.get('/api/call-center/orders/counts', { params });
      return data;
    },
    '/api/call-center/orders/counts',
    params,
    options
  );
};

/**
 * GET /api/call-center/orders/counts?dates=YYYY-MM-DD,YYYY-MM-DD,...
 * Get counts for multiple dates in one request (QueueStatusBar day chips).
 * Returns { "dateKey": { new, scheduled, confirmed, ... }, ... }.
 */
export const getOrderCountsBatch = async (dateKeys = []) => {
  const keys = [...new Set(dateKeys)].filter((d) => d && String(d).length >= 10).slice(0, 31);
  if (keys.length === 0) return { dates: {} };
  const params = { dates: keys.join(','), today: toLocalDateKey(new Date()) };
  return deduplicateRequest(
    async () => {
      const axiosInstance = await getAxios();
      const { data } = await axiosInstance.get('/api/call-center/orders/counts', { params });
      return data?.dates ?? {};
    },
    '/api/call-center/orders/counts',
    params,
    { ttl: 15000 }
  );
};

/**
 * GET /api/call-center/orders/:id/calls
 * Get calls history for an order
 *
 * Cases:
 * - Success: Returns call history
 * - Success: Empty array (no calls yet)
 * - Error: Order not found
 */
export const getOrderCalls = async (orderId) => {
  const axiosInstance = await getAxios();
  const { data } = await axiosInstance.get(`/api/call-center/orders/${orderId}`);
  const calls = (data.calls || []).map(mapCallFromBackend);
  return calls.sort((a, b) => new Date(b.call_datetime) - new Date(a.call_datetime));
};

/**
 * GET /api/call-center/calls?call_type=ask&date_from=&date_to=
 * List ask-only calls (inquiries with no order).
 */
export const getAskCalls = async (params = {}) => {
  const axiosInstance = await getAxios();
  const q = new URLSearchParams();
  q.set('call_type', 'ask');
  if (params.date_from) q.set('date_from', params.date_from);
  if (params.date_to) q.set('date_to', params.date_to);
  if (params.limit) q.set('limit', String(params.limit));
  const { data } = await axiosInstance.get(`/api/call-center/calls?${q.toString()}`);
  return (data.calls || []).map((c) => ({
    id: c.id,
    customer_phone: c.customer_phone,
    notes: c.notes || '',
    created_at: c.created_at,
    status: c.status,
    agent_id: c.agent_id
  }));
};

/**
 * GET /api/call-center/calls?customer_phone=XXX&customer_id=NN
 * Get call history by phone and/or customer id (id includes calls linked via orders/tickets).
 */
export const getCallsByPhone = async (phone, options = {}) => {
  const customerId = options?.customerId ?? options?.customer_id;
  const hasPhone = phone && String(phone).trim();
  if (!hasPhone && (customerId == null || customerId === '')) return [];
  const normalizedPhone = hasPhone ? String(phone).trim() : '';
  const params = {};
  if (normalizedPhone) params.customer_phone = normalizedPhone;
  if (customerId != null && customerId !== '') params.customer_id = String(customerId);
  const qs = new URLSearchParams(params).toString();
  return deduplicateRequest(
    async () => {
      const axiosInstance = await getAxios();
      const { data } = await axiosInstance.get(`/api/call-center/calls?${qs}`);
      return (data.calls || []).map(mapCallFromBackend);
    },
    '/api/call-center/calls',
    params,
    { useCache: true, ttl: 30000 } // Cache for 30 seconds
  );
};

// ============================================================================
// API ENDPOINTS - STOCK ACCESS
// ============================================================================

/**
 * Search stock items from real /api/stock/items
 * Fetches all items (cached), filters by query (name/SKU) and type client-side.
 *
 * Query: multi-word AND (any order), Arabic normalization (أ/إ/آ، ى/ي، ة/ه، …)، Eastern digits → Latin.
 * Results ranked: SKU / prefix / earlier matches first (see utils/stockSearch.js).
 *
 * - query: string
 * - type: 'product' | 'part' | 'all'
 *
 * Returns array in OrderItemsEditor format: { id, sku, name, type, available_qty, price_customer, price_merchant }
 */
export const searchStockItems = async (query = '', type = 'all') => {
  try {
    const result = await stockAPI.getItems();
    if (!result?.success) return [];
    const items = Array.isArray(result.data) ? result.data : result.data?.items ?? [];

    let filtered;
    if (query && query.trim()) {
      filtered = filterAndRankStockItems(items, query, type);
    } else {
      filtered = items;
      if (type !== 'all') {
        filtered = filtered.filter((item) => item.type === type);
      }
    }

    return filtered.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      type: item.type,
      available_qty:
        item.available_stock ??
        item.availableStock ??
        (item.quantity_on_hand ?? 0) - (item.quantity_reserved ?? 0) ??
        0,
      price_customer: item.price_customer ?? 0,
      price_merchant: item.price_merchant ?? 0
    }));
  } catch (error) {
    console.error('searchStockItems error:', error);
    return [];
  }
};

/**
 * GET /api/call-center/stock/items/:id
 * Get single stock item by ID
 *
 * Cases:
 * - Success: Returns stock item
 * - Error: Item not found
 */
export const getStockItem = async (itemId) => {
  await delay(100);

  const item = mockStockItems.find(i => i.id === parseInt(itemId));
  if (!item) {
    throw new Error('Stock item not found');
  }

  return item;
};

// ============================================================================
// ERP CUSTOMER SYNC
// ============================================================================

/**
 * Fetch draft orders from ERP and create customers from the data
 *
 * @param {Object} options - Fetch options
 * @param {string} options.start_date - Start date (YYYY-MM-DD)
 * @param {string} options.end_date - End date (YYYY-MM-DD)
 * @param {string} options.username - ERP username (for auto-auth)
 * @param {string} options.password - ERP password (for auto-auth)
 * @param {string} options.csrfToken - CSRF token (optional, if not using username/password)
 * @param {string} options.sessionCookie - Session cookie (optional, if not using username/password)
 * @returns {Promise<Object>} Result with created/updated/skipped counts
 *
 * Cases:
 * - Success: Returns sync result with counts
 * - Error: Network or API error
 *
 * Authentication:
 * - If username/password provided: Uses automatic authentication (recommended)
 * - If csrfToken/sessionCookie provided: Uses manual authentication
 * - Auto-retries on auth failure
 */
export const syncCustomersFromERP = async (options = {}) => {
  const {
    start_date = '2026-01-01',
    end_date = '2026-12-31',
    username = 'kariemseiam',
    password = '123123',
    csrfToken,
    sessionCookie
  } = options;

  // Use backend proxy to avoid CORS issues
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  try {
    // Use simplified backend proxy endpoint
    const axiosInstance = (await import('./axios')).default;

    // Simple params - backend handles all DataTables complexity internally
    const params = {
      start_date,
      end_date,
      username,
      password
    };

    // Fetch data from simplified backend proxy endpoint (deduplicated)
    // Fetching orders from ERP via backend proxy
    const data = await deduplicateRequest(
      () => axiosInstance.get('/api/erp/drafts', { params }).then((r) => r.data),
      '/api/erp/drafts',
      params,
      { useCache: true, ttl: 30000 }
    );

    // Parse DataTables response
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid ERP API response format');
    }

    const erpOrders = data.data;
    const results = {
      total: erpOrders.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Get customerAPI (lazy loaded to avoid circular dependency)
    const customerAPI = await getCustomerAPI();

    // Process each order to extract customer data
    for (const order of erpOrders) {
      try {
        // Extract customer data from ERP order
        const customerName = order.contact_name || order.contact_name_text || '';
        const customerPhone = order.mobile || '';
        const whatsapp = order.whatsapp || '';
        const governorate = order.shipping_state || '';
        const city = order.shipping_city || '';
        const addressDetails = order.shipping_address || '';

        // Skip if missing required fields
        if (!customerName || !customerPhone) {
          results.skipped++;
          results.errors.push({
            order: order.invoice_no || 'Unknown',
            reason: 'Missing name or phone'
          });
          continue;
        }

        // Check if customer already exists by phone
        try {
          const existingCustomers = await customerAPI.searchCustomers(customerPhone, { limit: 1 });

          if (existingCustomers.data && existingCustomers.data.length > 0) {
            // Customer exists - update if needed
            const existingCustomer = existingCustomers.data[0];
            const needsUpdate =
              existingCustomer.name !== customerName ||
              existingCustomer.governorate !== governorate ||
              existingCustomer.city !== city ||
              existingCustomer.address_details !== addressDetails;

            if (needsUpdate) {
              await customerAPI.updateCustomer(existingCustomer.id, {
                name: customerName,
                governorate: governorate || undefined,
                city: city || undefined,
                address_details: addressDetails || undefined,
                phone_secondary: whatsapp || undefined
              });
              results.updated++;
            } else {
              results.skipped++;
            }
          } else {
            // Create new customer
            const createResult = await customerAPI.createOrGetCustomer({
              name: customerName,
              phone: customerPhone,
              phone_secondary: whatsapp || undefined,
              governorate: governorate || undefined,
              city: city || undefined,
              address_details: addressDetails || undefined,
              created_by: 'erp_sync'
            });
            if (createResult?.deduplicated) {
              results.skipped++;
            } else {
              results.created++;
            }
          }
        } catch (apiError) {
          // Handle duplicate phone error (409) - customer already exists
          if (apiError.response && apiError.response.status === 409) {
            results.skipped++;
            results.errors.push({
              order: order.invoice_no || 'Unknown',
              reason: 'Customer already exists (duplicate phone)'
            });
          } else {
            throw apiError;
          }
        }
      } catch (error) {
        results.errors.push({
          order: order.invoice_no || 'Unknown',
          reason: error.message || 'Unknown error'
        });
        console.error('Error processing customer from order:', order.invoice_no, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error syncing customers from ERP:', error);
    throw error;
  }
};

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export default {
  // Draft Orders
  syncOrders,
  getSyncStatus,
  getActiveSyncStatus,

  // Orders Listing
  listOrders,
  getOrder,

  // Call Session
  getOrderCallContext,
  autoMatchItems,
  getOrderItems,
  getOrderItemsFromSnapshot,
  updateOrderItems,
  removeOrderItem,

  // Order Actions
  confirmOrder,
  cancelOrder,
  scheduleOrder,
  noAnswerOrder,
  lockOrder,
  unlockOrder,

  // Process to Hub / Leader
  processOrderToHub,
  leaderApprove,
  leaderReject,
  leaderRequestInfo,

  // Statistics
  getOrderCounts,
  getOrderCountsBatch,
  getOrderDatesWithData,
  getOrderCalls,

  // Stock Access
  searchStockItems,
  getStockItem,

  // ERP Customer Sync
  syncCustomersFromERP
};
