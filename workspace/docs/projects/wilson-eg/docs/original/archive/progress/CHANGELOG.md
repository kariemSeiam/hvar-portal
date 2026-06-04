# Wilson Egypt - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.2.0] - 2025-02-15

### Added

#### UI Component Library (18 new components)
- **Dialog** - Modal with overlay, gold accent, RTL close button
- **Select** - Radix Select, RTL support
- **RadioGroup** - Radix Radio with gold checked state
- **Tabs** - Radix Tabs with gold active state
- **Toast** - Radix Toast, variants (default, destructive, success, warning)
- **Toaster** - Global toast container
- **useToast** - Imperative toast API
- **Tooltip** - Radix Tooltip
- **Separator** - Radix Separator (horizontal/vertical)
- **DropdownMenu** - Full dropdown with submenus, RTL ChevronRight
- **Skeleton** - Pulse loading placeholder
- **Table** - Header, Body, Footer, Row, Head, Cell, Caption
- **Pagination** - Prev/Next, page links, ellipsis
- **Alert** - Variants: default, destructive, success, warning, info
- **Progress** - Value/max bar with gold fill
- **Avatar** - Image + Fallback
- **Sheet** - Drawer (top, right, bottom, left sides)
- **Popover** - Radix Popover
- **Breadcrumb** - With separator, RTL
- **EmptyState** - Icon, title, description, action slot

#### Admin Panel
- AdminLayout with sidebar, header, protected routes
- DashboardPage - Stats, revenue chart, recent orders
- ProductsPage - CRUD, image upload
- OrdersPage - List, status updates
- CustomersPage - List, detail view
- CouponsPage - Create, edit, analytics
- SlidesPage - Banner management
- SettingsPage - Free shipping threshold, config

#### Infrastructure
- TooltipProvider in main.tsx
- Toaster in main.tsx
- Slide keyframes (slideInFromTop, slideInFromBottom, slideInFromLeft, slideInFromRight)
- @radix-ui/react-popover dependency
- UI component index barrel export

### Changed
- PROGRESS.md - Updated to 100% components, admin
- SPRINTS.md - Sprint 2/3 complete, velocity updated
- ProductsPage - Debounced search, price filters, Select/Input/Skeleton
- LanguageContext - service.warranty.title, service.process.title, service.centers
- CheckoutPage - addAddress isDefault, removed unused vars

---

## [0.1.0] - 2025-02-15

### Added

#### Project Setup
- Initialized Vite + React + TypeScript project
- Configured Tailwind CSS with Egyptian Gold theme
- Set up path aliases (@/)
- Created project folder structure

#### Design System
- Egyptian Gold (#FEB636) color palette
- Warm stone neutrals, semantic colors
- Cairo + Tajawal Arabic, Inter English
- Fluid typography, animation keyframes
- Dark mode CSS variables

#### Core Components
- Button (4 variants, 4 sizes)
- Layout, Header, Footer
- Input, Card, Badge, Switch, Checkbox, Label, Textarea

#### Contexts
- LanguageContext, ThemeContext, AuthContext, CartContext

#### Pages
- HomePage, ProductsPage, ProductDetailPage, CartPage, CheckoutPage
- AboutPage, ServicePage, ContactPage, LoginPage, NotFoundPage

#### Services & Types
- API Service, Product, User, Order, Cart, Category types

---

## [0.3.0] - 2025-02-16

### Added
- **Products API** - productAdapter, ProductsPage/ProductDetailPage/HomePage use live API
- **Auth** - Phone-only login, AuthContext paths for login, addresses, profile
- **Contact** - Contact form → `/api/contact`, success/error toasts
- **Admin Dashboard** - analyticsApi.getDashboard + adminOrdersApi, period selector (today/week/month/year/all), real stats, top products, revenue chart, recent orders
- **Checkout** - Full checkout flow: auth guard, address selection/add, payment method, coupon Apply + discount preview, order creation with variant_id/size

### Changed
- Backend validate_coupon returns discountAmount for frontend discount preview
- Product detail route `/products/:slug` → `/products/:id` (UUID)
- LoginPage simplified to single-step phone input
- DashboardPage replaces mock data with API calls

### Fixed
- get_products code filter moved after query definition (app.py)
- ProductsPage JSX sibling elements wrapped in fragment

---

## [0.4.0] - 2025-02-15

### Added

#### Order & Wishlist Features
- **OrdersPage** - My orders list with status, date, total; Track and Cancel actions
- **OrderTrackingSheet** - Timeline view of order tracking steps (status, description, timestamp)
- **WishlistPage** - Favorites grid, add to cart, remove from wishlist
- **favoritesApi** - toggle, getAll, getStatus (backend: POST/GET /api/favorites)
- **ordersApi.getTrack** - Fetch order tracking steps
- **ordersApi.getAll** - Adapter for backend user orders (orders → items)

#### ProductDetailPage
- Heart button wired to favoritesApi (toggle, optimistic update, status fetch when authenticated)
- Redirect to login when favoriting while unauthenticated

#### Header
- Orders and Wishlist icon links when authenticated (desktop + mobile)
- Mobile menu: Orders and Wishlist links

#### Translations
- nav.orders, nav.wishlist, orders.*, wishlist.*

---

## [0.5.0] - 2025-02-15

### Added

#### Performance
- React.lazy for all page components (code splitting)
- Suspense with Spinner fallback
- loading="lazy" on product images (ProductsPage, HomePage, WishlistPage, CartPage, ProductDetailPage thumbs)

#### SEO
- react-helmet-async + HelmetProvider
- SeoHead component: per-route title, description, og/twitter meta
- JSON-LD Organization structured data

#### ServicePage
- Warranty registration form (name, phone, product code, serial → contact API)
- Service request form (name, phone, product, issue → contact API)
- Fix: Icon component rendering (feature.icon → const Icon)

#### ProductDetailPage
- Reviews section with rating display + "No reviews yet" empty state

---

## [0.6.0] - 2025-02-15

### Added

#### Analytics
- **analytics.ts** - GA4-ready module: pageView, event, productView, addToCart, beginCheckout, purchase
- **usePageView** hook - fires page_view on route change
- Integrated in App.tsx

#### Testing
- **utils.test.ts** - formatDate, debounce tests (+4)
- **Button.test.tsx** - render, click, variant, disabled
- Total: 32 unit tests

---

## [0.7.0] - 2025-02-15

### Added

#### ProductDetailPage
- **Related products** - productsApi.getRelated(id) fetches popular products excluding current, displays 4-card grid
- **Recently viewed** - useRecentlyViewed hook (localStorage, max 8), 4 product cards excluding current
- Translations: products.related, products.recentlyViewed

#### SEO & Testing
- **Sitemap** - public/sitemap.xml with homepage, products, about, service, contact, cart
- **Playwright E2E** - @playwright/test, e2e/smoke.spec.ts (home, products, about), test:e2e script
- playwright.config.ts - webServer dev, baseURL /wilson-egypt

### Changed
- productsApi.getRelated - filters out current product before slicing

---

## [0.8.0] - 2025-02-15

### Added

#### ProductDetailPage
- **Image gallery lightbox** - Click main image to open full-screen view, prev/next navigation, ZoomIn hover cue
- ChevronLeft, ChevronRight, ZoomIn icons; Dialog-based lightbox
- aria-label for lightbox trigger and nav buttons

#### Caching
- React Query: staleTime 2 min (was 1), gcTime 10 min
- Comment documenting caching strategy

#### Testing
- **vitest-axe** - Accessibility test on Button component
- **Integration tests** - ProductsPage.integration.test.tsx (mocked productsApi, load + display)
- 35 tests total (was 32)

### Changed
- main.tsx - Extended query defaults

---

## [Unreleased]

### Planned

- Phase 7: Security audit, performance testing, UAT, launch

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2025-02-15 | Initial scaffold |
| 0.2.0 | 2025-02-15 | Full UI library + Admin panel |
| 0.3.0 | 2025-02-16 | Products, Auth, Contact, Admin Dashboard API integration |
| 0.4.0 | 2025-02-15 | Orders, Wishlist, Order tracking UI |
| 0.5.0 | 2025-02-15 | Performance, SEO, Service forms, Reviews placeholder |
| 0.6.0 | 2025-02-15 | Analytics, Unit tests |
| 0.7.0 | 2025-02-15 | Related products, Recently viewed, Sitemap, E2E |
| 0.8.0 | 2025-02-15 | Image gallery lightbox, Caching, vitest-axe |
| 1.0.0 | - | Production release |
