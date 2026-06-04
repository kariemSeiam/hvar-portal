# API Reference

> All API domains, endpoints, and data flow patterns.

---

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Component   │────▶│  services/api.js  │────▶│ Flask Backend    │
│  (useEffect) │     │  (+ orders.js)   │     │ localhost:5000   │
└──────────────┘     └──────────────────┘     └──────────────────┘
        │                    │
        ▼                    ▼
┌──────────────┐     ┌──────────────────┐
│  hooks/      │     │  useApi.hook.js  │
│  useOrder-   │     │  (cache, retry,  │
│  States.js   │     │   abort, poll)   │
└──────────────┘     └──────────────────┘
```

---

## API Service Layer

**File:** `src/services/api.js`

Two patterns coexist:

### 1. `api` object (functional, ~400+ endpoints)

Organized by domain, all using bare `fetch()` + `handleResponse()`:

```js
export const api = {
  customers: { getCustomers, getCustomer, createCustomer, ... },
  orders: { getOrders, getAnalytics, syncOrders, ... },
  products: { getProducts, createProduct, getStockLevels, ... },
  customerService: { getTickets, createTicket, ... },
  unifiedCustomerService: { hubScan, hubInspection, createServiceAction, ... },
  serviceActions: { getServiceActions, executeServiceAction, ... },
  maintenance: { getCycles, createCycle, allocateStock, ... },
  hub: { scan, inspect, getPendingTasks, ... },
  stock: { getSummary, getLowStockAlerts },
  legacyCustomerService: { getTickets, scheduleCall, ... }
}
```

### 2. `OrdersService` class (class-based, 20 methods)

**File:** `src/services/orders.js`

Typed filtering with dual camelCase/snake_case param support:

```js
ordersService.getOrders({
  page: 1,
  limit: 20,
  stateCodes: [45, 46],
  businessCategories: ['premium_high'],
  dateFrom: '2025-01-01',
  search: 'محمد'
})
```

---

## API Endpoints by Domain

### Customers (15 endpoints)

```
GET    /api/customers                          # List with filtering
POST   /api/customers/create                   # Create
GET    /api/customers/:phone                   # Get by phone
GET    /api/customers/:phone/orders            # Orders by phone
GET    /api/customers/:phone/interactions      # Interaction history
POST   /api/customers/:phone/interactions      # Log interaction
POST   /api/customers/init                     # Initialize
GET    /api/customers/stats                    # Stats
GET    /api/customers/segments                 # Segments
GET    /api/customers/analytics                # Analytics
GET    /api/customers/realtime-analytics/:phone # Real-time
POST   /api/customers/duplicates/detect         # Find dupes
POST   /api/customers/duplicates/merge          # Merge dupes
POST   /api/customers/profile/update/:phone     # Manual profile
POST   /api/customers/segments/update           # Bulk segment update
```

### Orders (40+ endpoints)

```
GET    /api/orders                              # List with 15+ filters
GET    /api/orders/:id                          # Detail
GET    /api/orders/search                       # Text search
GET    /api/orders/states/distribution          # State breakdown
GET    /api/orders/analytics                    # Comprehensive analytics
GET    /api/orders/revenue/analysis             # Revenue by category
GET    /api/orders/performance/metrics           # KPIs
GET    /api/orders/business/categories          # Category counts
GET    /api/orders/business/counts              # Business counts
GET    /api/orders/stats                        # Statistics
GET    /api/orders/states                       # Available states
GET    /api/orders/types                        # Order types
GET    /api/orders/delivery-categories          # Delivery types
POST   /api/orders/sync                         # Sync external
POST   /api/orders/process/batch                # Batch process
GET    /api/orders/export                       # CSV/Excel export
PUT    /api/orders/bulk-update                  # Bulk update
GET    /api/orders/:id/timeline                 # Event timeline
GET    /api/orders/:id/service-actions          # Linked actions
GET    /api/orders/:id/hierarchy                # Order tree
GET    /api/orders/:id/risk                     # Risk assessment
GET    /api/orders/:id/financials               # Financial breakdown
POST   /api/orders/:id/subscribe                # Real-time updates

# Unified Orders (cycle-based processing)
GET    /api/unified-orders                      # All cycles
GET    /api/unified-orders/exchange             # Exchange cycle
GET    /api/unified-orders/return-pickup        # Return pickup
GET    /api/unified-orders/maintenance          # Maintenance cycle
GET    /api/unified-orders/scanning             # Scanning stage
GET    /api/unified-orders/quality-check        # Quality stage
POST   /api/unified-orders/:id/advance-stage    # Move stage
POST   /api/unified-orders/:id/complete-cycle   # Complete
```

### Products (15 endpoints)

```
GET    /api/products                    # List
GET    /api/products/:id                # Detail
POST   /api/products/create             # Create
PUT    /api/products/:id                # Update
DELETE /api/products/:id                # Delete
GET    /api/products/categories         # Categories
POST   /api/products/categories         # Create category
GET    /api/products/:id/inventory      # Stock status
POST   /api/products/:id/inventory      # Update stock
GET    /api/products/inventory/alerts   # Low stock
GET    /api/products/parts              # Parts list
GET    /api/products/:id/parts          # Product parts
GET    /api/products/analytics           # Product analytics
POST   /api/products/import              # Bulk import
GET    /api/products/export              # Bulk export
```

### Maintenance (18 endpoints)

```
GET    /api/maintenance/cycles              # List cycles
POST   /api/maintenance/cycles              # Create cycle
GET    /api/maintenance/cycles/:id          # Cycle detail
POST   /api/maintenance/cycles/:id/start    # Start cycle
POST   /api/maintenance/cycles/:id/complete # Complete
POST   /api/maintenance/cycles/:id/stock/allocate
POST   /api/maintenance/cycles/:id/stock/usage
POST   /api/maintenance/cycles/:id/stock/returns
POST   /api/maintenance/technicians         # Register
GET    /api/maintenance/technicians/workload
POST   /api/maintenance/sla/monitor/start
POST   /api/maintenance/sla/monitor/stop
GET    /api/maintenance/analytics/performance
GET    /api/maintenance/analytics/sla
POST   /api/maintenance/cycles/:id/inspections
GET    /api/maintenance/escalation-rules
```

### Hub Scanning (7 endpoints)

```
POST   /api/unified-service/init
POST   /api/unified-service/hub/scan
POST   /api/unified-service/hub/inspection
GET    /api/unified-service/service-actions    (with action_status filter)
GET    /api/unified-service/analytics
GET    /api/unified-service/dashboard
POST   /api/service-actions/hub/scan (legacy)
```

---

## State Machine — Orders

The order state machine uses numeric state codes:

| Code | Label | Business Category |
|------|-------|-------------------|
| 10 | طلب استلام | Pickup |
| 24 | في المستودع | Warehouse |
| 30 | قيد النقل | In Transit |
| 45 | تم التوصيل | Delivered ✓ |
| 46 | مرتجع | Returned |
| 47 | استثناء | Exception ⚠ |
| 48 | ملغي | Cancelled ✕ |
| 100 | مفقود | Lost |
| 101 | تالف | Damaged |

**Business Categories** (value-based tiers):

| Category | Range | Color |
|----------|-------|-------|
| PREMIUM_HIGH | ≥ 10,000 EGP | Success |
| MAX_VALUE | ≥ 5,000 EGP | Success |
| HIGH_VALUE | 1,500–5,000 | Primary |
| STANDARD | 500–1,500 | Info |
| LOW_VALUE | 1–500 | Warning |
| ZERO_COD | 0 | Secondary |
| SMALL_REFUND | -500–0 | Warning |
| LARGE_REFUND | < -500 | Danger |

---

## Utility Hooks

### `useApi(initialData)`

Returns: `{ data, loading, error, lastUpdated, get(), post(), put(), patch(), delete(), abort(), reset(), clearCache() }`

Extended variants:
- `useApiWithRetry` — adds `requestWithRetry()`, `retryCount`
- `useOptimisticApi` — adds `optimisticUpdate()`, `optimisticData`, `displayData`
- `usePollingApi` — adds `startPolling()`, `stopPolling()`, `isPolling`
- `useInfiniteApi` — adds `loadMore()`, `hasMore`, `page`, `reset()`

### `useOrderStates(options)`

Fetches state distribution and analytics. Auto-refresh with `refreshInterval`.

Returns: `{ states, totalOrders, analytics, getStateWithMetrics(), getStatesByCount(), getStatesByRevenueImpact(), refresh() }`
