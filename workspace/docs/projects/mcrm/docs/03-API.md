# API Reference

> All API endpoints for the MCRM Flask backend — 8 modules.

---

## Base URL

Development: `http://localhost:5050/api`  
Production: `https://mcrm.hvarstore.com/api`

Authentication: JWT Bearer token via `/api/auth/login`.

---

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login — returns JWT token |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/logout` | Invalidate session |

---

## Call Center

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/call-center/queue` | Call queue with state tabs |
| GET | `/api/call-center/queue/:id` | Queue item detail |
| POST | `/api/call-center/call/start` | Start call session |
| POST | `/api/call-center/call/end` | End call session |
| POST | `/api/call-center/call/confirm` | Confirm order (Path A) |
| POST | `/api/call-center/call/create-ticket` | Create service ticket (Path B) |
| GET | `/api/call-center/calls/:phone` | Call history by phone |

### Call Types
| Type | Description | Behavior |
|------|-------------|----------|
| ERP sell | Order from hvarstore.com → Bosta enrich → confirm | Path A |
| Direct/inbound (ASK) | Customer calls in → log only → reclassify | Path B → R/M/T/S |

### Service Types
| Type | Label | Action |
|------|-------|--------|
| R | Replacement | استبدال |
| M | Maintenance | صيانة |
| T | Return | مرتجع |
| S | Sell | بيع |
| ASK | General inquiry | استفسار (log only, no ticket) |

---

## Bosta

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bosta/tracking/:trackingNumber` | Track shipment |
| POST | `/api/bosta/shipment/create` | Create Bosta shipment |
| POST | `/api/bosta/shipment/cancel` | Cancel Bosta shipment |
| GET | `/api/bosta/cities` | Available Bosta cities |
| GET | `/api/bosta/districts/:cityId` | Districts by city |

---

## Customer

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers/:phone` | Customer 360° — orders, tickets, calls |
| GET | `/api/customers/search` | Search customers |
| POST | `/api/customers/create` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| GET | `/api/customers/:phone/service-history` | Service history |

---

## ERP

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/erp/orders` | List ERP orders with filters |
| GET | `/api/erp/orders/:id` | Order detail |
| GET | `/api/erp/orders/:id/sell-lines` | Order line items |
| POST | `/api/erp/orders/sync` | Sync orders from ERP |
| GET | `/api/erp/orders/states` | Available order states |
| GET | `/api/erp/products` | Product catalog |
| GET | `/api/erp/customers` | Customer list |

---

## Hub

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hub/tickets` | List service tickets |
| GET | `/api/hub/tickets/:id` | Ticket detail |
| POST | `/api/hub/tickets` | Create ticket |
| PUT | `/api/hub/tickets/:id/status` | Update ticket status |
| POST | `/api/hub/tickets/:id/receive` | Receive at hub |
| POST | `/api/hub/tickets/:id/dispatch` | Dispatch from hub |
| POST | `/api/hub/tickets/:id/complete` | Complete ticket |
| POST | `/api/hub/tickets/:id/inspect` | Quality inspection |
| POST | `/api/hub/tickets/:id/assign` | Assign technician |
| GET | `/api/hub/queue` | Hub queue by state |
| POST | `/api/hub/scan` | Barcode scan |

### Ticket State Machines
| Type | States |
|------|--------|
| Replacement (HVR) | PENDING → HUB_RECEIVED → DISPATCHED → READY → CLOSED |
| Maintenance (HVM) | PENDING → HUB_RECEIVED → IN_WORKSHOP → READY → CLOSED |
| Return (HVT) | PENDING → HUB_RECEIVED → INSPECTED → REFUNDED → CLOSED |
| Sell (HVS) | PENDING → HUB_RECEIVED → DISPATCHED → CLOSED |

---

## Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/service/actions` | List service actions |
| GET | `/api/service/actions/:id` | Service action detail |
| POST | `/api/service/actions` | Create service action |
| PUT | `/api/service/actions/:id` | Update service action |
| POST | `/api/service/actions/:id/parts` | Allocate parts |
| POST | `/api/service/actions/:id/execute` | Execute action |

---

## Stock

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock/products` | List products/parts |
| GET | `/api/stock/products/:id` | Product detail with stock levels |
| POST | `/api/stock/movement` | Record stock movement |
| GET | `/api/stock/movements` | Stock movement history |
| GET | `/api/stock/alerts` | Low stock alerts |
| POST | `/api/stock/adjust` | Manual stock adjustment |
| GET | `/api/stock/analytics` | Stock analytics |
| GET | `/api/stock/bom/:productId` | Bill of materials |
