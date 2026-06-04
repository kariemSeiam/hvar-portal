# Architecture

> System architecture for the Hvar Service CRM — React 18 frontend + Flask 3 backend + MySQL.

---

## System Overview

MCRM is the **operational service layer** between the Ultimate POS backend (`live/`) and the customer-facing hvarstore.com. It handles:

- **Call center** — ERP sell confirmations + inbound service calls
- **Hub** — technician workflow (replacement, maintenance, return, sell tickets)
- **Stock** — parts + products inventory management
- **Customer 360°** — unified orders, tickets, call history

## Architecture Stack

| Layer | Technology | Directory |
|-------|-----------|-----------|
| Frontend | React 18 + Vite 6 + Tailwind CSS 3 | `front/` |
| Backend | Flask 3 + Python 3.8+ | `app/` |
| Database | MySQL 8 (hvar_erp) | `migrations/` |
| Shipping API | Bosta.co | `app/api/bosta_api.py` |
| Auth | JWT (PyJWT + bcrypt) | `app/api/auth_api.py` |
| Container | Docker Compose | `docker-compose.yml` |

## Data Flow

```
┌───────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  hvarstore.com    │     │   MCRM Backend    │     │   ERP Database   │
│  (Dukan/pos-clone)│────▶│   Flask :5050     │────▶│   hvar_erp       │
│                   │     │                   │     │   (MySQL)        │
│  Orders via       │     │  API modules:     │     │                  │
│  webhook          │     │  auth, bosta,     │     │  transactions    │
│                   │     │  call_center,     │     │  contacts        │
│                   │     │  customer, erp,   │     │  products        │
│                   │     │  hub, service,    │     │  variations      │
│                   │     │  stock            │     │  service_tickets │
│                   │     │                   │     │  calls           │
└───────────────────┘     └────────┬──────────┘     └──────────────────┘
                                   │
                                   ▼
                            ┌──────────────────┐
                            │  Bosta API        │
                            │  (shipping)       │
                            └──────────────────┘
                                   │
                                   ▼
                            ┌──────────────────┐
                            │  MCRM Frontend    │
                            │  React :5173      │
                            │  mcrm.hvarstore.com│
                            └──────────────────┘
```

## Route Mapping

| Path | Page | Module |
|------|------|--------|
| `/login` | LoginPage | Auth |
| `/` | HubPage | Hub (scan, queues) |
| `/hub` | HubPage | Hub |
| `/services` | ServiceActionsPage | Service |
| `/stock` | StockManagementPage | Stock |
| `/customer-service` | CustomerServicePage | Call Center |
| `/users` | UsersPage | Admin |
| `/api/*` | ApiRedirect | API passthrough |
| `*` | NotFoundPage | Error |

## Provider Hierarchy

```jsx
<ThemeProvider>
  <AuthProvider>
    <CallSessionProvider>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route element={<AuthGuard />}>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<HubPage />} />
                <Route path="/services" element={<ServiceActionsPage />} />
                <Route path="/stock" element={<StockManagementPage />} />
                <Route path="/customer-service" element={<CustomerServicePage />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>
            <Route path="/api/*" element={<ApiRedirect />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </CallSessionProvider>
  </AuthProvider>
</ThemeProvider>
```

## Backend API Modules

| Module | File | Purpose |
|--------|------|---------|
| Auth | `auth_api.py` | Login, JWT tokens, `/api/auth/me` |
| Bosta | `bosta_api.py` | Shipping integration, tracking |
| Call Center | `call_center_api.py` | Queue, calls, agent operations |
| Customer | `customer_api.py` | Customer 360°, service history |
| ERP | `erp_api.py` | ERP order sync, sell operations |
| Hub | `hub_api.py` | Ticket workflows (R/M/T/S) |
| Service | `service_api.py` | Service actions, ticket management |
| Stock | `stock_api.py` | Products, parts, BOM, movements |

## Key Patterns

### Call Session Context
- Global `CallSessionContext` wraps the entire app
- Active call session persists across route changes
- `CallSessionFAB` renders at root level, survives navigation
- Session states: idle → active (order/customer context) → ending → ended

### Service Ticket State Machines
4 distinct state machines for hub workflows:
- **Replacement (HVR)**: PENDING → HUB_RECEIVED → DISPATCHED → READY → CLOSED
- **Maintenance (HVM)**: PENDING → HUB_RECEIVED → IN_WORKSHOP → READY → CLOSED
- **Return (HVT)**: PENDING → HUB_RECEIVED → INSPECTED → REFUNDED → CLOSED
- **Sell (HVS)**: PENDING → HUB_RECEIVED → DISPATCHED → CLOSED

### Loading & Error Boundaries
- `LoadingScreen` — full-page spinner during auth check
- `ErrorBoundary` — per-module error catching with retry
- `LoadingSpinner` — inline loading for async operations

### Dark Mode
- `class`-based dark mode via Tailwind `dark:`
- System preference auto-detect
- Manual toggle persisted in localStorage
