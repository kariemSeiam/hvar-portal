# Component Reference

> UI components from the MCRM design system — 22 components across layout, UI, and feature modules.

---

## Layout Components

### GlobalNavigation
**File:** `components/layout/GlobalNavigation.jsx`

Top navigation bar with hub, services, stock, customer service tabs. Supports nested sub-tabs via `NestedTabs`.

**Props:** `items` (array), `activeTab` (string)

### TabNavigation / NestedTabs / Tabs
**Files:** `components/layout/TabNavigation.jsx`, `NestedTabs.jsx`, `Tabs.jsx`

Tab system for module-level navigation. NestedTabs supports 2-level depth for service ticket type switching.

### PageHeader
**File:** `components/layout/PageHeader.jsx`

Page title + breadcrumbs + action buttons. Used by all pages.

**Props:** `title`, `subtitle`, `actions` (slot), `breadcrumbs`

### RefreshButton
**File:** `components/layout/RefreshButton.jsx`

Manual data refresh button with spinning animation during load.

---

## UI Components

### Button
**File:** `components/ui/Button.jsx`

6 variants × 5 sizes. Micro-interactions: hover translateY(-1px), active scale(98).

| Variant | Style | Usage |
|---------|-------|-------|
| primary | brand-red-600 bg, white text | Primary actions |
| secondary | brand-blue-500 bg, white text | Info/secondary |
| outline | transparent, gray border | Contextual |
| ghost | transparent, gray text | Subtle |
| danger | red-500 bg, white text | Destructive |
| success | green-500 bg, white text | Confirm/completion |

### Badge
**File:** `components/ui/Badge.jsx`

6 variants: success (green), warning (amber), danger (red), info (blue), primary (brand-red), secondary (gray).

### StatusChip
**File:** `components/ui/StatusChip.jsx`

Colored dot + Arabic label for call center agent states: active, busy, offline.

### StatusIndicator
**File:** `components/ui/StatusIndicator.jsx`

Pulsing status dot for live call sessions and scanning states. Animates with CSS custom keyframes.

### ServiceStatusBadge
**File:** `components/ui/ServiceStatusBadge.jsx`

Maps service ticket types (replacement/maintenance/return/sell) to colors and Arabic labels.

### SessionStyleMoneyBadge
**File:** `components/ui/SessionStyleMoneyBadge.jsx`

Financial amount badge — COD, fees, refunds with color-coded text for Arabic numbers.

### Input
**File:** `components/ui/Input.jsx`

Arabic-optimized text input with Cairo font, RTL padding, focus ring brand-blue.

### Textarea
**File:** `components/ui/Textarea.jsx`

Multi-line input matching the Input design.

### Select
**File:** `components/ui/Select.jsx`

Styled select dropdown with Arabic label support.

### GovernorateSearchSelect
**File:** `components/ui/GovernorateSearchSelect.jsx`

Searchable governorate + district selector with Arabic name matching and ERP city/district ID resolution.

### Modal
**File:** `components/ui/Modal.jsx`

Overlay modal with backdrop blur, fade-in animation, close on Escape and backdrop click.

### DropdownPanel
**File:** `components/ui/DropdownPanel.jsx`

Floating dropdown panel with slide animation.

### EmptyState
**File:** `components/ui/EmptyState.jsx`

Centered placeholder — icon, title, description, optional CTA button.

### LoadingScreen / LoadingSpinner
**Files:** `components/ui/LoadingScreen.jsx`, `LoadingSpinner.jsx`

Full-screen or inline loading indicators.

### ModalLoadingFallback
**File:** `components/ui/ModalLoadingFallback.jsx`

Loading state specifically for modal content that is lazy-loaded.

### PaginationControls
**File:** `components/ui/PaginationControls.jsx`

Page-based pagination with Arabic labels (السابق, التالي) and page size options.

### ThemeToggle
**File:** `components/ui/ThemeToggle.jsx`

Dark/light mode toggle — sun/moon icon, persists preference.

### UserProfile
**File:** `components/ui/UserProfile.jsx`

User avatar + name + role dropdown in the header.

### Tooltip
**File:** `components/ui/Tooltip.jsx`

Hover tooltip with configurable position.

### ErrorBoundary
**File:** `components/ui/ErrorBoundary.jsx`

React error boundary with fallback UI, error message, and retry button.

### ManualChangeFAB
**File:** `components/ui/ManualChangeFAB.jsx`

Floating action button for manual stock/state adjustments.

---

## Feature Components

### Call Center

| File | Purpose |
|------|---------|
| `call-center/CallSessionFAB.jsx` | Global floating call FAB — rendered at App root |
| `call-center/CallSessionPanel.jsx` | Active call panel — customer info, timer, actions |
| `call-center/QueueList.jsx` | Call queue list with state tabs |
| `call-center/CallHistory.jsx` | Call history for a customer |

### Hub

| File | Purpose |
|------|---------|
| `hub/ScanPanel.jsx` | QR/barcode scanning interface |
| `hub/TicketList.jsx` | Service ticket list with state filters |
| `hub/TicketDetail.jsx` | Single ticket detail with action buttons |
| `hub/WorkshopQueue.jsx` | Workshop queue for maintenance |

### Service

| File | Purpose |
|------|---------|
| `service/ServiceActionsPage.jsx` | Main service actions view |
| `service/ServiceActionCard.jsx` | Card layout for service actions |
| `service/ServiceActionRow.jsx` | Table row layout |

### Stock

| File | Purpose |
|------|---------|
| `stock/ProductList.jsx` | Products + parts listing |
| `stock/StockMovementForm.jsx` | Stock movement form (allocate/usage/return) |
| `stock/LowStockAlerts.jsx` | Low stock alert panel |

### Filters & Forms

| File | Purpose |
|------|---------|
| `filters/DateRangeFilter.jsx` | Date range picker filter |
| `filters/StateFilter.jsx` | Multi-select state filter |
| `filters/SearchFilter.jsx` | Text search with debounce |
| `forms/CreateTicketForm.jsx` | Service ticket creation form |
| `forms/AssignTechnicianForm.jsx` | Technician assignment |
| `forms/InspectionForm.jsx` | Quality inspection form |
