// Base Types
export const BaseEntity = {
  id: 'number',
  created_at: 'string',
  updated_at: 'string',
};

// User Types
export const User = {
  ...BaseEntity,
  username: 'string',
  email: 'string',
  full_name: 'string',
  role: 'string',
  permissions: 'array',
  is_active: 'boolean',
  last_login: 'string',
};

// Customer Types
export const Customer = {
  ...BaseEntity,
  phone: 'string',
  name: 'string',
  email: 'string',
  segment: 'string',
  total_orders: 'number',
  total_value: 'number',
  return_rate: 'number',
  satisfaction_score: 'number',
  churn_risk: 'number',
  customer_health: 'number',
  last_order_date: 'string',
  first_order_date: 'string',
  order_frequency: 'number',
  addresses: 'array',
  interactions: 'array',
};

export const CustomerAddress = {
  ...BaseEntity,
  customer_id: 'number',
  address_type: 'string',
  address_line1: 'string',
  address_line2: 'string',
  city: 'string',
  governorate: 'string',
  postal_code: 'string',
  is_primary: 'boolean',
};

export const CustomerInteraction = {
  ...BaseEntity,
  customer_id: 'number',
  interaction_type: 'string',
  description: 'string',
  outcome: 'string',
  agent_id: 'number',
  duration: 'number',
  notes: 'string',
};

// Order Types
export const Order = {
  ...BaseEntity,
  tracking_number: 'string',
  order_id: 'string',
  customer_phone: 'string',
  customer_name: 'string',
  customer_address: 'string',
  city: 'string',
  governorate: 'string',
  cod: 'number',
  bosta_fees: 'number',
  order_type: 'number',
  order_type_value: 'string',
  state_code: 'number',
  state_value: 'string',
  masked_state: 'string',
  business_category: 'string',
  risk_level: 'string',
  created_at: 'string',
  updated_at: 'string',
  timeline: 'array',
  analytics: 'object',
};

export const OrderTimeline = {
  ...BaseEntity,
  order_id: 'string',
  event_code: 'number',
  event_value: 'string',
  event_date: 'string',
  location: 'string',
  notes: 'string',
};

export const OrderAnalytics = {
  delivery_time: 'number',
  success_rate: 'number',
  revenue_impact: 'string',
  operational_priority: 'string',
  requires_attention: 'boolean',
  confidence_score: 'number',
  risk_factors: 'array',
  recommendations: 'array',
};

// Product Types
export const Product = {
  ...BaseEntity,
  name_ar: 'string',
  name_en: 'string',
  description_ar: 'string',
  description_en: 'string',
  sku: 'string',
  category: 'string',
  brand: 'string',
  selling_price: 'number',
  purchase_price: 'number',
  alert_quantity: 'number',
  is_active: 'boolean',
  specifications: 'object',
  parts: 'array',
  inventory: 'array',
};

export const ProductPart = {
  ...BaseEntity,
  product_id: 'number',
  part_name_ar: 'string',
  part_name_en: 'string',
  part_sku: 'string',
  quantity: 'number',
  unit_cost: 'number',
  is_required: 'boolean',
};

export const ProductInventory = {
  ...BaseEntity,
  product_id: 'number',
  location: 'string',
  quantity: 'number',
  reserved_quantity: 'number',
  available_quantity: 'number',
  unit_cost: 'number',
  total_value: 'number',
  last_updated: 'string',
};

// Stock Types
export const StockMovement = {
  ...BaseEntity,
  product_id: 'number',
  sku: 'string',
  movement_type: 'string',
  quantity: 'number',
  location_from: 'string',
  location_to: 'string',
  reference_type: 'string',
  reference_id: 'string',
  unit_cost: 'number',
  total_cost: 'number',
  notes: 'string',
  user_id: 'number',
};

export const StockForecast = {
  ...BaseEntity,
  product_id: 'number',
  sku: 'string',
  forecast_period: 'string',
  forecast_date: 'string',
  predicted_demand: 'number',
  current_stock: 'number',
  recommended_order: 'number',
  confidence_level: 'number',
  factors: 'array',
};

// Service Action Types
export const ServiceAction = {
  ...BaseEntity,
  action_type: 'string',
  priority: 'string',
  status: 'string',
  order_id: 'string',
  customer_phone: 'string',
  customer_name: 'string',
  product_sku: 'string',
  product_name: 'string',
  reason: 'string',
  description: 'string',
  assigned_to: 'string',
  scheduled_date: 'string',
  completed_date: 'string',
  parts_required: 'array',
  parts_used: 'array',
  cost: 'number',
  notes: 'string',
  timeline: 'array',
};

export const ServiceActionPart = {
  ...BaseEntity,
  action_id: 'number',
  part_sku: 'string',
  part_name: 'string',
  quantity_required: 'number',
  quantity_used: 'number',
  unit_cost: 'number',
  total_cost: 'number',
  status: 'string',
  notes: 'string',
};

// Customer Service Types
export const ServiceTicket = {
  ...BaseEntity,
  ticket_number: 'string',
  customer_phone: 'string',
  customer_name: 'string',
  issue_type: 'string',
  priority: 'string',
  status: 'string',
  subject: 'string',
  description: 'string',
  assigned_to: 'string',
  created_by: 'string',
  resolved_at: 'string',
  resolution: 'string',
  satisfaction_rating: 'number',
  tags: 'array',
  attachments: 'array',
};

// TeamCall type removed - functionality integrated into follow-ups system

// Maintenance Types
export const MaintenanceCycle = {
  ...BaseEntity,
  cycle_id: 'string',
  cycle_type: 'string',
  priority: 'string',
  status: 'string',
  customer_phone: 'string',
  customer_name: 'string',
  product_sku: 'string',
  product_name: 'string',
  scheduled_date: 'string',
  start_date: 'string',
  completed_date: 'string',
  technician_id: 'string',
  technician_name: 'string',
  description: 'string',
  parts_required: 'array',
  parts_used: 'array',
  total_cost: 'number',
  sla_hours: 'number',
  sla_status: 'string',
  quality_score: 'number',
  customer_feedback: 'string',
  notes: 'string',
};

// Analytics Types
export const AnalyticsData = {
  period: 'string',
  start_date: 'string',
  end_date: 'string',
  metrics: 'object',
  trends: 'array',
  breakdowns: 'object',
  insights: 'array',
  recommendations: 'array',
};

export const AnalyticsMetrics = {
  total_orders: 'number',
  delivered_orders: 'number',
  returned_orders: 'number',
  total_revenue: 'number',
  avg_cod: 'number',
  delivery_success_rate: 'number',
  return_rate: 'number',
  customer_satisfaction: 'number',
  stock_turnover: 'number',
  maintenance_efficiency: 'number',
};

// Filter Types
export const FilterOptions = {
  date_from: 'string',
  date_to: 'string',
  status: 'array',
  priority: 'array',
  category: 'array',
  assigned_to: 'array',
  customer_segment: 'array',
  business_category: 'array',
  min_value: 'number',
  max_value: 'number',
  search: 'string',
};

// Pagination Types
export const PaginationData = {
  current_page: 'number',
  total_pages: 'number',
  total_items: 'number',
  items_per_page: 'number',
  has_next: 'boolean',
  has_prev: 'boolean',
};

// API Response Types
export const ApiResponse = {
  success: 'boolean',
  data: 'any',
  message: 'string',
  error: 'string',
  pagination: 'object',
  meta: 'object',
};

// Form Types
export const FormField = {
  name: 'string',
  label: 'string',
  type: 'string',
  required: 'boolean',
  placeholder: 'string',
  options: 'array',
  validation: 'object',
  disabled: 'boolean',
  hidden: 'boolean',
};

export const FormData = {
  [key: 'string']: 'any',
};

// Table Types
export const TableColumn = {
  key: 'string',
  label: 'string',
  sortable: 'boolean',
  filterable: 'boolean',
  width: 'string',
  align: 'string',
  render: 'function',
  formatter: 'function',
};

export const TableData = {
  columns: 'array',
  data: 'array',
  loading: 'boolean',
  pagination: 'object',
  sorting: 'object',
  filters: 'object',
  selection: 'array',
};

// Modal Types
export const ModalConfig = {
  isOpen: 'boolean',
  title: 'string',
  size: 'string',
  onClose: 'function',
  onConfirm: 'function',
  confirmText: 'string',
  cancelText: 'string',
  loading: 'boolean',
  children: 'element',
};

// Toast Types
export const ToastConfig = {
  id: 'string',
  type: 'string',
  title: 'string',
  message: 'string',
  duration: 'number',
  position: 'string',
  onClose: 'function',
  action: 'object',
};

// Chart Types
export const ChartData = {
  labels: 'array',
  datasets: 'array',
  options: 'object',
  type: 'string',
};

export const ChartDataset = {
  label: 'string',
  data: 'array',
  backgroundColor: 'string|array',
  borderColor: 'string|array',
  borderWidth: 'number',
  fill: 'boolean',
  tension: 'number',
};

// Export all types as a single object for easy access
export const Types = {
  // Base
  BaseEntity,
  
  // User
  User,
  
  // Customer
  Customer,
  CustomerAddress,
  CustomerInteraction,
  
  // Order
  Order,
  OrderTimeline,
  OrderAnalytics,
  
  // Product
  Product,
  ProductPart,
  ProductInventory,
  
  // Stock
  StockMovement,
  StockForecast,
  
  // Service Action
  ServiceAction,
  ServiceActionPart,
  
  // Customer Service
  ServiceTicket,
  // TeamCall export removed - functionality integrated into follow-ups system
  
  // Maintenance
  MaintenanceCycle,
  
  // Analytics
  AnalyticsData,
  AnalyticsMetrics,
  
  // UI
  FilterOptions,
  PaginationData,
  ApiResponse,
  FormField,
  FormData,
  TableColumn,
  TableData,
  ModalConfig,
  ToastConfig,
  ChartData,
  ChartDataset,
};

// Type validation helpers
export const validateType = (data, typeDefinition) => {
  const errors = [];
  
  for (const [key, expectedType] of Object.entries(typeDefinition)) {
    if (data[key] === undefined) {
      errors.push(`Missing required field: ${key}`);
      continue;
    }
    
    const actualType = typeof data[key];
    if (expectedType === 'array' && !Array.isArray(data[key])) {
      errors.push(`Field ${key} should be an array`);
    } else if (expectedType === 'object' && (actualType !== 'object' || Array.isArray(data[key]))) {
      errors.push(`Field ${key} should be an object`);
    } else if (expectedType !== 'array' && expectedType !== 'object' && actualType !== expectedType) {
      errors.push(`Field ${key} should be of type ${expectedType}, got ${actualType}`);
    }
  }
  
  return errors;
};

export const isValidType = (data, typeDefinition) => {
  return validateType(data, typeDefinition).length === 0;
};

// Type transformation helpers
export const transformToType = (data, typeDefinition) => {
  const transformed = {};
  
  for (const [key, expectedType] of Object.entries(typeDefinition)) {
    if (data[key] !== undefined) {
      if (expectedType === 'number') {
        transformed[key] = Number(data[key]) || 0;
      } else if (expectedType === 'boolean') {
        transformed[key] = Boolean(data[key]);
      } else if (expectedType === 'string') {
        transformed[key] = String(data[key]);
      } else {
        transformed[key] = data[key];
      }
    } else {
      // Set default values
      if (expectedType === 'number') {
        transformed[key] = 0;
      } else if (expectedType === 'boolean') {
        transformed[key] = false;
      } else if (expectedType === 'string') {
        transformed[key] = '';
      } else if (expectedType === 'array') {
        transformed[key] = [];
      } else if (expectedType === 'object') {
        transformed[key] = {};
      }
    }
  }
  
  return transformed;
}; 