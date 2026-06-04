# Review: Frontend Performance (Deep Full /r)

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| DNA (Laws / Genome / Patterns) | ⚠️ | Architecture: no route splitting; Design Genome: design-tokens used, some hardcoded colors in components; Pattern: deduplication only in ticketsAPI |
| Correctness | ⚠️ | ExcelJS used without import in StockMovements.jsx (runtime bug); pagination/loading edge cases present |
| Security | ✅ | No perf-impacting security issues; logger used appropriately |
| Performance | ❌ | No route-level code splitting; no list virtualization; qr-scanner eager in QRScanner.jsx; request deduplication only in ticketsAPI; ExcelJS not in manualChunks |
| Readability | ⚠️ | ServiceActionsPage.jsx ~3272 lines, UnifiedServiceActionModal.jsx ~1109 lines hinder perf refactors |
| Maintainability | ⚠️ | SRP violated in mega-components; deduplication pattern not reused across APIs |
| Consistency | ⚠️ | Inconsistent API usage (dedupe only ticketsAPI); mixed lazy vs eager imports for qr-scanner |
| Testability | ⚠️ | Only one frontend test file (buildServiceModalPrintHtml.test.js); critical paths untested |
| Completeness | ⚠️ | exceljs not in Vite manualChunks; missing types/docs where they would help safe perf work |

### Verdict: REQUEST_CHANGES

---

## ❌ Must Fix (Blocking)

### 1. ExcelJS used without import (runtime error)

**Location:** `front/src/components/stock/StockMovements.jsx:629`

**Problem:** `ExcelJS.Workbook()` is used but there is no `import` for ExcelJS anywhere in the file. In ESM this will throw at runtime when export runs.

**Suggestion:**

```javascript
// At top of StockMovements.jsx, add:
import ExcelJS from 'exceljs';
```

For better performance, load ExcelJS only when the user clicks export (dynamic import):

```javascript
// Inside the export handler, before using ExcelJS:
const ExcelJS = (await import('exceljs')).default;
const workbook = new ExcelJS.Workbook();
```

### 2. No route-level code splitting (large initial bundle)

**Location:** `front/src/App.jsx:5-12`

**Problem:** All pages (ServiceActionsPage, StockManagementPage, HubPage, CustomerServicePage, NewTicketsDemoPage, DemoLandingPage) are imported synchronously. Every route’s code loads on first visit, delaying FCP/LCP and wasting bandwidth for routes the user never opens.

**Suggestion:**

```jsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const ServiceActionsPage = lazy(() => import('./components').then(m => ({ default: m.ServiceActionsPage })));
const StockManagementPage = lazy(() => import('./pages/StockManagementPage'));
const HubPage = lazy(() => import('./pages/HubPage'));
const CustomerServicePage = lazy(() => import('./pages/CustomerServicePage'));
const NewTicketsDemoPage = lazy(() => import('./pages/NewTicketsDemoPage'));
const DemoLandingPage = lazy(() => import('./pages/DemoLandingPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ApiRedirect = lazy(() => import('./components/ApiRedirect'));

// In Routes, wrap with Suspense:
<Suspense fallback={<div className="min-h-screen flex items-center justify-center">...</div>}>
  <Routes>...</Routes>
</Suspense>
```

### 3. qr-scanner loaded eagerly in QRScanner component

**Location:** `front/src/components/order/QRScanner.jsx:2`

**Problem:** `import QrScanner from 'qr-scanner'` pulls the scanner into the main bundle for any consumer of QRScanner. HubPage and useScanningSystem use dynamic `import('qr-scanner')`; this file does not, so the scanner chunk can still be loaded eagerly when QRScanner is in the tree.

**Suggestion:** Lazy-load qr-scanner inside QRScanner (e.g. in useEffect or on first scan attempt): `const QrScanner = (await import('qr-scanner')).default`, and keep scanner UI behind a “Start camera” or similar trigger so the import runs only when needed.

---

## ⚠️ Should Fix (Recommended)

### 1. Request deduplication only in ticketsAPI

**Location:** `front/src/api/stockAPI.js`, `front/src/api/customerAPI.js`, `front/src/api/hubAPI.js`, `front/src/api/orderAPI.js`, `front/src/api/serviceActionAPI.js`

**Problem:** Only `ticketsAPI.js` uses `deduplicateRequest`. Other APIs can issue duplicate in-flight requests (e.g. multiple components calling the same endpoint), increasing server load and latency.

**Suggestion:** Introduce a small wrapper (e.g. `api.get(url, { dedupe: true })`) or use `deduplicateRequest` for idempotent GET/list calls in stockAPI, customerAPI, hubAPI, orderAPI, and serviceActionAPI where the same URL+params can be requested concurrently.

### 2. Large lists rendered without virtualization

**Location:** `front/src/components/service/ServiceActionsPage.jsx:2917`, `front/src/components/stock/StockParts.jsx:544`, `front/src/components/stock/StockMovements.jsx` (movements list)

**Problem:** `displayedTickets.map(...)` (up to pageLimit 50), `filteredAndSortedParts.map(...)`, and movements tables render every row as DOM. With many columns and cells, this increases layout/paint cost and scroll jank.

**Suggestion:** Add list virtualization (e.g. `react-window` or `@tanstack/react-virtual`) for the tickets table and for parts/movements tables when item count exceeds a threshold (e.g. 30). Keep pagination; virtualize only the visible window of the current page if needed.

### 3. ExcelJS not in Vite manualChunks

**Location:** `front/vite.config.js:85-94`

**Problem:** exceljs is a heavy dependency and is not in `manualChunks`. It can end up in a large shared or main chunk, delaying initial load even when the user never exports.

**Suggestion:** After fixing the ExcelJS import, add a chunk for it and load it dynamically on export (see Must Fix #1). If you keep a static import, add `exceljs` to manualChunks (e.g. `export: ['exceljs']`) so it is in a separate chunk and not mixed into the main bundle.

### 4. Hardcoded colors in components (Design Genome)

**Location:** `front/src/App.jsx:44-56` (toast styles), `front/src/components/service/ServiceActionsPage.jsx`, `front/src/components/service/ServiceActionsFilters.jsx`, `front/src/components/filters/FilterMultiSelectDropdown.jsx`, `front/src/components/modals/ReplacementPreparationItemsModal.jsx`, `front/src/components/modals/ServiceModalViewer/buildServiceModalPrintHtml.js`

**Problem:** Multiple files use hex/rgba values (64 matches in 5 component files). Design tokens exist in `front/src/styles/design-tokens.css`; hardcoded values bypass tokens and can complicate theming and future optimizations (e.g. critical CSS).

**Suggestion:** Replace inline hex/rgba with CSS variables from design-tokens (e.g. `var(--color-brand-red-600)`) or Tailwind classes that use the same tokens. Start with high-traffic components (App.jsx toast, ServiceActionsPage, ServiceActionsFilters).

### 5. Mega-components hinder performance work

**Location:** `front/src/components/service/ServiceActionsPage.jsx` (~3272 lines), `front/src/components/modals/UnifiedServiceActionModal.jsx` (~1109 lines)

**Problem:** Single components with huge state and many responsibilities make it hard to isolate re-renders, memoize subtrees, or lazy-load sections. Every state change can re-render large trees.

**Suggestion:** Split into smaller components (e.g. ticket table, tab strip, filter bar, modals) and wrap stable subtrees in `React.memo` where props are stable. Extract hooks (e.g. ticket loading, filters) to reduce state and effect surface in one file. This is a refactor; do it incrementally and add tests for critical paths.

---

## 💡 Consider (Optional)

- **Suspense fallback:** Use a small skeleton or branded loader (e.g. from design-tokens) for route-level Suspense so perceived performance is better than a blank or generic spinner.
- **recharts / leaflet / framer-motion:** Vite already splits them (charts, maps, ui). If a route does not use charts or maps, lazy-load that route so those chunks load only when needed; current manualChunks still help for shared usage.
- **performance.js:** Currently scanner-focused (camera, device). Consider a light app-level helper (e.g. `requestIdleCallback` for non-critical work, or a simple mark/measure for key actions) to avoid blocking main thread.
- **reportCompressedSize: false:** Left off to speed up builds. Re-enable occasionally (e.g. in CI or a weekly build) to track compressed sizes and catch regressions.
- **chunkSizeWarningLimit: 1000:** Current 1000 kB limit is high. Consider lowering (e.g. 500 kB) and splitting vendor or feature chunks so no single chunk dominates load time.

---

## ✨ Praise

- **Vite build:** Sensible manualChunks (vendor, ui, charts, maps, scanner, utils), terser with `drop_console: true` and `drop_debugger: true`, `cssCodeSplit: true`, and `target: 'esnext'` keep the build modern and lean.
- **Request deduplication:** `requestDeduplication.js` is well implemented and used in ticketsAPI; in-flight and TTL caching reduce duplicate ticket API calls.
- **Performance utilities:** `performance.js` (device info, camera constraints, scanner settings) and scanner-specific optimizations (e.g. HubPage/useScanningSystem dynamic import of qr-scanner) show awareness of mobile and scanner perf.
- **Pagination:** ServiceActionsPage and StockMovements use backend pagination (offset/limit, has_more), avoiding unbounded list growth and unnecessary DOM.
- **Design tokens:** `design-tokens.css` and design.md provide a single source of truth for colors, typography, spacing, and motion; adoption in more components will improve consistency and theming.
- **React usage:** Widespread use of useMemo/useCallback (263 matches across 34 files) and React.memo in key components (e.g. StockMovementsView) shows intent to control re-renders; audit for over-use and correctness rather than removal.

---

# Prioritized Performance Improvement List

Use this as a backlog to maximize frontend performance. Order is by impact and dependency.

1. **Fix ExcelJS import and lazy-load on export**  
   **Where:** `front/src/components/stock/StockMovements.jsx`  
   **Why:** Fixes runtime bug and avoids pulling exceljs into initial bundle.  
   **What:** Add `import ExcelJS from 'exceljs'` or, better, `const ExcelJS = (await import('exceljs')).default` inside the export handler.

2. **Add route-level code splitting (React.lazy + Suspense)**  
   **Where:** `front/src/App.jsx`  
   **Why:** Largest win for FCP/LCP; only the current route’s JS loads first.  
   **What:** Lazy-load every page and ApiRedirect; wrap Routes in Suspense with a small fallback.

3. **Lazy-load qr-scanner in QRScanner.jsx**  
   **Where:** `front/src/components/order/QRScanner.jsx`  
   **Why:** Keeps scanner code out of the main bundle until the user opens the scanner.  
   **What:** Replace top-level `import QrScanner from 'qr-scanner'` with dynamic import when the scanner is needed.

4. **Extend request deduplication to other APIs**  
   **Where:** `front/src/api/stockAPI.js`, `customerAPI.js`, `hubAPI.js`, `orderAPI.js`, `serviceActionAPI.js`  
   **Why:** Prevents duplicate in-flight requests and reduces server load and latency.  
   **What:** Wrap idempotent GET/list calls with `deduplicateRequest` (or a thin axios wrapper that uses it).

5. **Virtualize large tables (tickets, parts, movements)**  
   **Where:** ServiceActionsPage (tickets table), StockParts, StockMovements  
   **Why:** Reduces DOM nodes and layout/paint cost for 50+ rows.  
   **What:** Add `react-window` or `@tanstack/react-virtual` for the visible window; keep backend pagination.

6. **Put exceljs in manualChunks and/or load dynamically**  
   **Where:** `front/vite.config.js`, StockMovements.jsx  
   **Why:** Keeps a heavy dependency out of the main chunk.  
   **What:** If keeping static import, add `export: ['exceljs']` (or similar) to manualChunks; prefer dynamic import on export click.

7. **Replace hardcoded colors with design tokens**  
   **Where:** App.jsx (toast), ServiceActionsPage, ServiceActionsFilters, FilterMultiSelectDropdown, ReplacementPreparationItemsModal, buildServiceModalPrintHtml.js  
   **Why:** Aligns with Design Genome and simplifies theming and critical CSS.  
   **What:** Use `var(--…)` or Tailwind classes that map to design-tokens.css.

8. **Split ServiceActionsPage and UnifiedServiceActionModal**  
   **Where:** `front/src/components/service/ServiceActionsPage.jsx`, `front/src/components/modals/UnifiedServiceActionModal.jsx`  
   **Why:** Enables targeted memoization and future lazy-loading of sections; improves maintainability and perf.  
   **What:** Extract presentational components and hooks; wrap stable subtrees in React.memo.

9. **Add tests for critical paths**  
   **Where:** New or existing test files under `front/src`  
   **Why:** Enables confident perf and refactor work (e.g. deduplication, virtualization).  
   **What:** Prefer behavior-focused tests for ticket loading, filters, and export; reuse requestDeduplication in tests where relevant.

10. **Optional: Re-enable reportCompressedSize occasionally and lower chunkSizeWarningLimit**  
    **Where:** `front/vite.config.js`  
    **Why:** Surfaces bundle regressions and encourages smaller chunks.  
    **What:** e.g. `reportCompressedSize: true` in CI or weekly build; `chunkSizeWarningLimit: 500` and split chunks if needed.
