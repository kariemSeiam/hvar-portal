# Architecture

> Routes, providers, services, hooks, and the component tree.

---

## Provider Hierarchy

```jsx
<ThemeProvider defaultDirection="rtl" defaultTheme="light">
  <LoadingProvider>
    <OrdersProvider>
      <AuthProvider>
        <BrowserRouter>
          <React.Suspense fallback={<PageLoading />}>
            <Routes>
              {/* Public + Protected */}
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </AuthProvider>
    </OrdersProvider>
  </LoadingProvider>
</ThemeProvider>
```

**Order matters:**
1. `ThemeProvider` — outermost, sets `dir` and `dark` class on `<html>`
2. `LoadingProvider` — wraps everything for global loading overlay
3. `OrdersProvider` — fetches business counts for sidebar badges
4. `AuthProvider` — checks token on mount, manages user session

---

## Route Architecture

**Public routes:**
- `/login` — Role-based demo login with 3 roles

**Protected routes** (wrapped in `ProtectedRoute`):
- Checks `localStorage.getItem('token')`
- Redirects to `/login` if missing
- Nested inside `<Layout />` which provides sidebar + header

**Code splitting:**
All 20+ page imports use `React.lazy()` → code-split chunks:
```js
const OrdersPage = React.lazy(() => import('./pages/orders/OrdersPage'));
```

---

## Auth System

**File:** `src/context/AuthContext.jsx`

3 hardcoded demo roles with multiple credentials each:

| Role | Label | Demo Users |
|------|-------|------------|
| `call-center` | خدمة العملاء | callcenter@example.com, 01012345678, callcenter1 |
| `operator` | مشغل / محاسب | operator@example.com, 01011111111, operator1 |
| `manager` | مدير / قائد فريق | manager@example.com, admin@example.com, manager1 |

All passwords: `password123`

Auth state persisted in localStorage:
- `token` — demo-token string
- `hvar_user_data` — JSON user object
- `hvar_user_role` — role string
- `hvar_team` — optional team assignment

---

## API Layer

**Primary:** `src/services/api.js` — 400+ endpoints across 11 domains
**Class-based:** `src/services/orders.js` — OrdersService class with typed filtering

Both use bare `fetch()` with JWT token from localStorage. Target:
`http://localhost:5000/api` (configurable via `VITE_API_URL` env var).

### API Domains

| Domain | Endpoints | Description |
|--------|-----------|-------------|
| `customers` | 15 | CRUD, segments, duplicates, analytics, realtime |
| `orders` | 40+ | CRUD, analytics, states, hierarchy, sync, export, financials, stock integration |
| `products` | 15 | CRUD, inventory, categories, stock levels, alerts, import/export |
| `customerService` | 8 | Tickets, analytics, follow-ups |
| `unifiedCustomerService` | 18 | Service actions, hub scanning, follow-ups, dashboard |
| `serviceActions` | 8 | CRUD, parts, status, execution |
| `maintenance` | 18 | Cycles, SLA, technicians, inspections, escalation rules |
| `hub` | 7 | Scanning, inspection, pending tasks, analytics |
| `stock` | 2 | Summary, alerts |

### useApi Hook

**File:** `src/hooks/useApi.js` — Full-featured API hook:

| Feature | Description |
|---------|-------------|
| `get`/`post`/`put`/`patch`/`delete` | HTTP method wrappers |
| `request()` | Core method with options |
| `useCache` | In-memory cache with configurable timeout |
| `retry` | Configurable retry attempts with backoff |
| `abort` | AbortController-based request cancellation |
| `reset` | Clear data, error, loading |
| `withLoading` | Wraps async calls in loading state |

Extended hooks:
- `useApiWithRetry` — exponential backoff, condition-based retry
- `useOptimisticApi` — optimistic updates with rollback
- `usePollingApi` — configurable interval polling
- `useInfiniteApi` — paginated infinite scroll

---

## Component Tree (Layout)

```
<ThemeProvider>
  <LoadingProvider>
    <OrdersProvider>
      <AuthProvider>
        <Router>
          <ProtectedRoute>
            <Layout>
              <Sidebar />         ← fixed left, collapsible
              <Header />          ← sticky top, glass
              <main>
                <Outlet />        ← Code-split pages
              </main>
            </Layout>
          </ProtectedRoute>
        </Router>
      </AuthProvider>
    </OrdersProvider>
  </LoadingProvider>
</ThemeProvider>
```

---

## Key Patterns

### Loading State Machine

`LoadingContext` provides:
- **Global loading** — full-screen overlay with spinner
- **Page loading** — full-content replacement spinner
- **Key-based loading** — granular per-component loading states with counters
- **Timeout** — auto-stop loading after N ms
- **Bulk** — set multiple loading keys at once

### Sidebar Collapse

- Default: **collapsed** (w-20, icons only)
- Desktop < 1280px: auto-collapse
- Manual toggle: absolute positioned button (half-overlapping)
- Animated width: `transition-all duration-300 ease-in-out`
- Nav items: 7 categories × 16 items total

### Dark Mode

- Auto-detects `prefers-color-scheme: dark`
- Manual toggle via Header dropdown or Sidebar button
- Persisted in localStorage
- Applied via `document.documentElement.classList.toggle('dark')`
- Tailwind `dark:` variant used throughout all components
