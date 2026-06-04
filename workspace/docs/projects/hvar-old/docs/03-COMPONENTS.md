# Component Reference

> 24 reusable UI components from the design system.

---

## Layout Components

### Sidebar

**File:** `src/components/layout/Sidebar.jsx`

Collapsible navigation sidebar with 7 categories × 16 items.

**Props:** `isMobileMenuOpen`, `setIsMobileMenuOpen`, `onCollapsedChange`

**Navigation categories:**
| Category | Items | Badge Source |
|----------|-------|-------------|
| الرئيسية | لوحة التحكم | — |
| إدارة العملاء | العملاء | 2.5K hardcoded |
| إدارة الطلبات | الطلبات, إجراءات الخدمة, إدارة الخدمات | OrdersContext.totalOrders |
| إدارة المخزون | لوحة تحكم المخزون, المنتجات, حركات المخزون, تحليلات المخزون | 156 hardcoded |
| خدمة العملاء | مركز الخدمة, طلبات الخدمة | businessCounts.service |
| مركز الاتصال | مركز الاتصال | businessCounts.problems |
| التقارير والتحليلات | التقارير | — |

**Behavior:**
- Collapsed by default (w-20)
- Auto-collapse on screens < 1280px
- Dynamic nav height calculation (header + footer subtracted)
- Mobile overlay with backdrop-blur
- Badges from `OrdersContext` (auto-refreshed every 5 min)
- Active item detection with path matching (supports `:param` routes)

### Header

**File:** `src/components/layout/Header.jsx`

Sticky top header with glass-morphism backdrop.

**Props:** `title`, `subtitle`, `setIsMobileMenuOpen`, `breadcrumbs`, `actions`

**Sections:**
| Section | Content |
|---------|---------|
| Left | Hamburger (mobile) + breadcrumbs + page title + subtitle |
| Right | Custom actions (slot) + notification bell (red dot) + profile dropdown |

**Profile dropdown:**
- Avatar (brand gradient bg, initials)
- Name, email, role badge
- Settings, theme toggle, logout actions

### Layout

**File:** `src/components/layout/Layout.jsx`

Main shell: combines Sidebar + Header + main content area.

**Props:** `title`, `subtitle`, `breadcrumbs`, `headerActions`, `floatingAction`, `maxWidth`, `padding`

**Behavior:**
- Dynamic page title from route map (20 routes mapped)
- Content padding adjusts: `ps-16` (collapsed) or `ps-64` (expanded)
- FAB injection slot for floating action buttons

### Logo

**File:** `src/components/layout/Logo.jsx`

HVAR shield SVG + "هفار" text, links to `/`.

**Props:** `size` (sm/md/lg/xl), `showText`, `className`

---

## UI Components

### Button

**File:** `src/components/ui/Button.jsx`

6 variants × 5 sizes.

**Props:** `variant`, `size`, `fullWidth`, `disabled`, `isLoading`, `leftIcon`, `rightIcon`

| Variant | Style | Use |
|---------|-------|-----|
| `primary` | bg-brand-red-600, text-white | Primary actions |
| `secondary` | bg-brand-blue-500, text-white | Secondary/info actions |
| `outline` | transparent, gray border | Contextual actions |
| `ghost` | transparent, gray text | Subtle actions |
| `danger` | bg-red-500, text-white | Destructive |
| `success` | bg-green-500, text-white | Confirm/completion |

**States:** default, hover, active (scale-98), disabled (opacity-50), loading (spinner)

### Card

**File:** `src/components/ui/Card.jsx`

Flexible container with default/elevated/flat/transparent variants.

**Classes (from tailwind.js):**
```js
default: 'bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700'
elevated: 'shadow-md'
flat: 'no shadow'
transparent: 'bg-transparent border-none'
```

### Input

**File:** `src/components/ui/Input.jsx`

Form input with RTL support, error state, focus ring brand-red.

**Classes from tailwind.js:**
```js
default: 'block w-full border-gray-300 rounded-md focus:ring-brand-red-500'
error: 'border-red-500 focus:ring-red-500'
```

### Badges

**6 badge components:**

| Component | Purpose | Props |
|-----------|---------|-------|
| `Badge` | Generic status badge | variant, size |
| `StatusBadge` | Solution status | status string |
| `OrderStatusBadge` | Order state code | stateCode (number) |
| `BusinessCategoryBadge` | Value category | value (amount) |
| `FinancialBadge` | Financial indicator | amount, type |
| `DynamicStateBadges` | Dynamic states | (computed) |

**Badge variant colors:**
| Variant | Light BG | Light Text | Dark BG | Dark Text |
|---------|----------|------------|---------|-----------|
| success | green-100 | green-800 | green-900 | green-300 |
| warning | amber-100 | amber-800 | amber-900 | amber-300 |
| danger | red-100 | red-800 | red-900 | red-300 |
| info | blue-100 | blue-800 | blue-900 | blue-300 |
| primary | brand-red-100 | brand-red-800 | brand-red-900 | brand-red-300 |

### CollapsibleFilterBar

**File:** `src/components/ui/CollapsibleFilterBar.jsx`

Expandable filter section with:
- Collapsed: button showing active filter count badge
- Expanded: filter groups (date, state, type, range, search)
- Brand-rose collapse/expand icon

### FloatingActionButton

**File:** `src/components/ui/FloatingActionButton.jsx`

Fixed-position FAB with brand-rose gradient, shadow-lg, hover-scale effect.

### EmptyState

**File:** `src/components/ui/EmptyState.jsx`

Centered placeholder: icon + title + description + optional CTA.

### Loading

**File:** `src/components/ui/Loading.jsx`

`PageLoading` component: full-screen or inline spinner with text.

### LoginForm

**File:** `src/components/ui/LoginForm.jsx`

Auth form with role selector, identifier/password fields, submit with loading.

### TeamMemberCard / TeamMemberCardHorizontal

Team member display: avatar (brand gradient), name, role, stats, actions.

---

## Design System Exports (DesignSystem.jsx)

The massive `DesignSystem.jsx` (~1,200 lines) provides:

| Export | Description |
|--------|-------------|
| `Typography` | Heading/body components with variants |
| `Container` | Centered container |
| `Alert` | Status alert with icon |
| `Avatar` | User avatar with fallback initials |
| `Skeleton` | Loading skeleton |
| `Spinner` | Inline spinner |
| `Divider` | Section divider |
| `useTheme` | Theme hook |
| `cn` | Class merger |
| `getColorClasses` | Color utility |

The file also defines the full `HVAR_THEME` object with color scales, spacing,
typography, breakpoints, and animation durations used as the single source of
design truth.
