# Wilson Egypt - Project Roadmap

## Version History

| Version | Date | Status | Description |
|---------|------|--------|-------------|
| 0.1.0 | Feb 2025 | ✅ | Initial scaffold |
| 0.2.0 | Feb 2025 | ✅ | Full UI library + Admin panel |
| 0.3.0 | Feb 2025 | ✅ | Products, Auth, Contact, Admin, Checkout, Coupon |
| 1.0.0 | - | Planned | Production release |

---

## Phase 1: Foundation (Week 1-2) ✅

### Sprint 1.1: Project Setup ✅
- [x] Initialize Vite + React + TypeScript
- [x] Configure Tailwind CSS
- [x] Set up project structure
- [x] Configure path aliases
- [x] Set up ESLint/Prettier

### Sprint 1.2: Design System ✅
- [x] Egyptian Gold color palette
- [x] Typography system (Cairo + Inter)
- [x] CSS variables setup
- [x] Dark mode foundation
- [x] Animation keyframes
- [x] Utility classes

### Sprint 1.3: Core Components ✅
- [x] Button component with variants
- [x] Layout component
- [x] Header component
- [x] Footer component
- [x] Language context
- [x] Theme context

### Sprint 1.4: Customer Pages ✅
- [x] HomePage
- [x] ProductsPage
- [x] ProductDetailPage
- [x] CartPage
- [x] CheckoutPage
- [x] AboutPage
- [x] ServicePage
- [x] ContactPage
- [x] NotFoundPage

### Sprint 1.5: State Management ✅
- [x] AuthContext with JWT
- [x] CartContext with localStorage
- [x] API service layer
- [x] TypeScript types for appliances

---

## Phase 2: Component Library ✅

### Sprint 2.1: Form Components ✅
- [x] Input with validation
- [x] Select
- [x] Checkbox
- [x] Radio group
- [x] Textarea

### Sprint 2.2: Overlay & Feedback ✅
- [x] Dialog (Modal)
- [x] Sheet (Drawer)
- [x] Toast + useToast
- [x] Tooltip
- [x] Popover
- [x] Dropdown menu
- [x] Alert
- [x] Skeleton
- [x] Progress

### Sprint 2.3: Data & Navigation ✅
- [x] Table
- [x] Pagination
- [x] Tabs
- [x] Breadcrumb
- [x] Avatar
- [x] EmptyState

---

## Phase 3: Admin Panel ✅

### Sprint 3.1: Admin Layout ✅
- [x] Admin sidebar navigation
- [x] Admin header
- [x] Dashboard layout
- [x] Protected routes

### Sprint 3.2: Dashboard ✅
- [x] Stats cards
- [x] Revenue chart
- [x] Recent orders table
- [x] Quick actions

### Sprint 3.3: Products Management ✅
- [x] Products list with search
- [x] Add/Edit product form
- [x] Product image upload
- [x] Category assignment

### Sprint 3.4: Orders Management ✅
- [x] Orders list with filters
- [x] Order detail view
- [x] Status updates
- [x] Order tracking

### Sprint 3.5: Customers & More ✅
- [x] Customers list
- [x] Coupons management
- [x] Slides/Banners management
- [x] Settings page

---

## Phase 4: Backend Integration (Week 3-6) ✅ Complete

### Sprint 4.1: API Alignment ✅
- [x] Resolve products API shape mismatch (productAdapter)
- [x] Resolve auth API (phone-only login, no OTP)
- [x] Resolve admin API paths (analytics, orders)
- [x] Cart via localStorage (backend sync optional)

### Sprint 4.2: Live Connection ✅
- [x] Connect products fetching (ProductsPage, ProductDetailPage, HomePage)
- [x] Connect authentication flow
- [x] Connect contact form
- [x] Connect admin dashboard (analytics, recent orders)
- [x] Connect order creation (checkout → variant_id, size)
- [x] Coupon validation at checkout (Apply, discount preview)

---

## Phase 5: Enhancement (Week 7-8)

### Sprint 5.1: Search & Filtering
- [x] Product search (debounced)
- [x] Price range filter
- [x] Category filter
- [x] Sort options

### Sprint 5.2: User Experience
- [x] Product image gallery (lightbox, prev/next)
- [x] Product reviews (placeholder UI)
- [x] Related products
- [x] Recently viewed
- [x] Wishlist functionality

### Sprint 5.3: Service Features
- [x] Warranty registration (form → contact)
- [x] Service request form (→ contact)
- [x] Order tracking UI

---

## Phase 6: Optimization (Week 9-10)

### Sprint 6.1: Performance
- [x] Code splitting (React.lazy)
- [x] Image lazy loading
- [x] Caching strategy (React Query 2min stale, 10min gc)

### Sprint 6.2: SEO
- [x] Meta tags (per-route)
- [x] Structured data (JSON-LD)
- [x] Sitemap
- [x] Arabic SEO (og:locale ar_EG)

### Sprint 6.3: Testing
- [x] Unit tests (utils, Button — 33 tests)
- [x] Integration tests (ProductsPage + API mock, 35 total)
- [x] E2E tests (Playwright smoke)
- [x] Accessibility testing (vitest-axe on Button)

---

## Phase 7: Launch (Week 11-12)

### Sprint 7.1: Pre-Launch
- [ ] Security audit
- [ ] Performance testing
- [ ] UAT
- [ ] Bug fixes

### Sprint 7.2: Launch
- [ ] Production deployment
- [ ] DNS, SSL
- [ ] Monitoring

---

## Milestones

| Milestone | Status | Deliverables |
|-----------|--------|--------------|
| M1: Foundation | ✅ | Setup, design, pages |
| M2: Components | ✅ | Full UI library |
| M3: Admin | ✅ | Full admin panel |
| M4: Integration | ✅ | Live API connection |
| M5: Feature Complete | ✅ | Search, filters, wishlist, order tracking, warranty, service, reviews placeholder |
| M6: Production Ready | ✅ | Unit, integration, E2E, a11y |
| M7: Launch | 🔲 | Live in production |
