# Pages Reference

> All 11 page modules with their route, props, states, and features.

---

## Auth

### LoginPage (`/login`)

**File:** `src/pages/auth/LoginPage.jsx`

Full-screen login with brand gradient background, animated loading spinner.

**Features:**
- Role selector (call-center, operator, manager) with Arabic labels
- Flexible identifier (email, phone, or username)
- Demo credentials hardcoded per role
- Stores auth data in localStorage
- Redirects to dashboard on success

**State:**
| State | Behavior |
|-------|----------|
| Loading | Full-page spinner while checking auth |
| Error | Red error message ('بيانات الاعتماد غير صالحة') |
| Success | Redirects to `/` |
| Demo | 3 roles × 3 users each = 9 login identities |

---

## Dashboard

### DashboardPage (`/`)

**File:** `src/pages/DashboardPage.jsx`

Welcome message with user name, 4 stat cards, recent requests table, quick actions grid.

**Stat Cards:**
| Card | Icon Color | Link |
|------|-----------|------|
| طلبات الخدمة المعلقة | brand-red | `/customer-service/requests` |
| المكالمات المعلقة | brand-blue | `/call-center` |
| العملاء النشطين | green | `/customers` |
| التقارير الجديدة | purple | `/analytics` |

**Quick Actions:** 5 shortcut cards (إنشاء طلب خدمة, تسجيل مكالمة, عميل جديد, قائمة الاتصال, تقرير جديد)

**Data:** Uses mock data (API ready — commented out real calls)

---

## Customers

### CustomersPage (`/customers`)

**File:** `src/pages/CustomersPage.jsx`

Customer database with search, filtering, and analytics.

### CustomerDetailPage (`/customers/:phone`)

**File:** `src/pages/CustomerDetailPage.jsx`

Single customer view with order history, interactions, segments.

### AICustomersPage (`/ai-customers/:phone`)

**File:** `src/pages/AICustomersPage.jsx`

AI-powered customer analytics and insights page.

---

## Orders

### OrdersPage (`/orders`)

**File:** `src/pages/orders/OrdersPage.jsx`

Full order management with:
- **Collapsible filter bar** — date range, state codes, order types, business categories, COD range, city, phone, search
- **Order cards** — tracking number, customer, status badge, COD amount, business category, risk level
- **Expand details** — shipping address, timeline, service actions
- **Batch processing** — sync, export, bulk update
- **Pagination** — page-based with page size options

**Sub-components:** `OrderCard.jsx`, `OrderRow.jsx`, `OrderExpandDetails.jsx`

### OrdersAnalyticsPage (`/orders/analytics`)

**File:** `src/pages/orders/OrdersAnalyticsPage.jsx`

Charts and metrics for order performance:
- State distribution (bar chart)
- Revenue over time (line chart)
- Business category breakdown
- Performance metrics (delivery rate, avg COD, avg delivery time)

---

## Stock / Products

### StockDashboard (`/stock`)

**File:** `src/pages/stock/StockDashboard.jsx`

Overview of stock levels, low stock alerts, recent movements.

### StockPage (`/stock/products`)

**File:** `src/pages/stock/StockPage.jsx`

Full product and inventory management with `ProductModal.jsx`.

### StockAnalyticsPage (`/stock/analytics`)

**File:** `src/pages/stock/StockAnalyticsPage.jsx`

Stock value, turnover rate, slow-moving items analysis.

### StockMovementsPage (`/stock/movements`)

**File:** `src/pages/stock/StockMovementsPage.jsx`

Chronological movement log with type filtering (allocation, usage, return, transfer, adjustment).

### ProductsPage (`/products`)

**File:** `src/pages/products/ProductsPage.jsx`

Product catalog with categories, parts, inventory status.

---

## Customer Service

### CustomerServicePage (`/customer-service`)

**File:** `src/pages/customer-service/CustomerServicePage.jsx`

Service ticket management hub.

### ServiceRequestsPage (`/customer-service/requests`)

**File:** `src/pages/customer-service/ServiceRequestsPage.jsx`

All service requests in table layout with status tracking.

### ServiceRequestForm (`/customer-service/requests/new`, `/customer-service/requests/:id/edit`)

**File:** `src/pages/customer-service/ServiceRequestForm.jsx`

Create/edit service request form with:
- Customer lookup (phone)
- Product/issue categorization
- Priority level
- Assignment

### RequestDetailPage (`/customer-service/requests/:id`)

**File:** `src/pages/customer-service/RequestDetailPage.jsx`

Full service request detail with timeline, notes, actions.

---

## Call Center

### CallCenterPage (`/call-center`)

**File:** `src/pages/call-center/CallCenterPage.jsx`

Queue-based phone operations:

**Features:**
- **State tabs** — tabs for different queue states (pending, active, completed)
- **Queue status bar** — call counts, wait times
- **Orders table** — sortable, filterable order queue
- **Inline filters** — state, date, search
- **Call session FAB** — floating action button to start/end calls
- **Order row** — each row = customer + tracking + status + action buttons
- **Demo data** — `demoData.js` with sample queue

**Sub-components (~file feature):**
- `QueueStatusBar.jsx`
- `StateTabs.jsx`
- `OrdersTable.jsx`
- `OrderRow.jsx`
- `InlineFilters.jsx`
- `CallSessionFab.jsx`

**Hook:** `useCallCenterQueue.js` — queue state management

---

## Hub Scanning

### HubScanningPage (`/hub-scanning`)

**File:** `src/pages/hub-scanning/HubScanningPage.jsx`

Barcode/inspection station for processing returns at the hub:

**Components:**
- `Scanner.jsx` — barcode scanning input
- `ScanResult.jsx` — displays scanned order info
- `InspectionForm.jsx` — quality inspection form (damage, missing parts, photos)
- `HubQueue.jsx` — pending inspection queue

**Flow:** Scan tracking → Display order → Inspect item → Log outcome

---

## Service Actions

### ServiceActionsPage (`/service-actions`)

**File:** `src/pages/service-actions/ServiceActionsPage.jsx`

Field service actions management:
- **ServiceActionCard.jsx** — card layout for mobile
- **ServiceActionRow.jsx** — table row for desktop
- **ServiceActionExpandDetails.jsx** — expandable detail section

**Features:** Status filtering, technician assignment, parts tracking.

---

## Service Management

### ServiceManagementPage (`/service-management`)

**File:** `src/pages/service-management/ServiceManagementPage.jsx`

Service lifecycle management.

### NewServiceActionForm (`inside ServiceManagementPage`)

**File:** `src/pages/service-management/components/NewServiceActionForm.jsx`

Create new service action with follow-up scheduling (calls `unifiedCustomerService.createFollowUp`).

---

## Maintenance

### MaintenancePage (`/maintenance`)

**File:** `src/pages/maintenance/MaintenancePage.jsx`

Maintenance cycle management:
- Cycle creation, start, complete
- Stock allocation/usage/returns
- SLA monitoring (start/stop, violations, escalations)
- Technician management (registration, workload)
- Quality inspections
- Analytics (performance, SLA reports)

**API integration:** 18 maintenance endpoints

---

## Analytics

### AnalyticsPage (`/analytics`)

**File:** `src/pages/analytics/AnalyticsPage.jsx`

Charts and reports using recharts + chart.js:
- Revenue analysis
- Performance metrics
- State distribution
- Comparison periods

---

## NotFoundPage (`*`)

**File:** `src/pages/NotFoundPage.jsx`

404 with Arabic message and navigation back to dashboard.
