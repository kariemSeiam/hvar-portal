# Component Reference

> 44 components across layout, customer, admin, and UI modules.

---

## Layout Components

### Header
**File:** `components/layout/Header.tsx`
Top navigation bar — gold brand link, category links, search toggle, cart, language switcher, user menu. Mobile: hamburger + full-height menu drawer with 3D door-swing animation.

### BottomNav
**File:** `components/layout/BottomNav.tsx`
Mobile bottom navigation bar — home, products, cart, wishlist, profile icons. Fixed bottom with safe-area support.

### Footer
**File:** `components/layout/Footer.tsx`
4-column footer: brand info, quick links, customer service, contact. WhatsApp button, social links, copyright.

### Layout
**File:** `components/layout/Layout.tsx`
Page wrapper — Header + main content + Footer. Applies doodle background, SEO head.

### WilsonLogo
**File:** `components/layout/WilsonLogo.tsx`
SVG brand logo — Wilson wordmark in gold, responsive sizing.

### SearchOverlay
**File:** `components/layout/SearchOverlay.tsx`
Full-screen search with suggestions, recent searches, product results.

### SeoHead
**File:** `components/layout/SeoHead.tsx`
SEO metadata per page — title, description, OG tags, structured data.

---

## Customer Components

### ApplianceDoodleBg
**File:** `components/customer/ApplianceDoodleBg.tsx`
**THE DESIGN INNOVATION.** Hand-drawn SVG doodle pattern background:
- 22 hand-drawn appliance illustrations (fridge, stove, kettle, blender, vacuum, TV, water cooler, stand mixer, washing machine, iron)
- Theme-aware strokes: light mode = warm brown + gold, dark mode = gold + ivory
- 0.22 opacity, pointer-events-none, preserveAspectRatio
- Optional float animation (30s infinite translate)
- Variants: gold, white, mix (theme-aware)

### HeroCarousel
**File:** `components/customer/HeroCarousel.tsx`
Full-width hero with vision image processing:
- Carousel images with blur/saturate/brightness/contrast/sepia filter
- Gradient overlay (dark vignette for legibility)
- Scroll hint with animated chevrons
- Product viewport with auto-cycling slides

### ProductCard
**File:** `components/customer/ProductCard.tsx`
Product card with gold hover glow:
- Image, badges (new/sale/bestseller), name, price, rating
- Hover: shine effect (diagonal gradient sweep), translateY(-4px)
- Added to cart check animation
- Quantity stepper bar with gold CTA

### CategoryProductSection
**File:** `components/customer/CategoryProductSection.tsx`
Category section with horizontal product row, section header, "View All" link.

### CustomerEmptyState
**File:** `components/customer/CustomerEmptyState.tsx`
Empty state for cart, wishlist, orders — icon, message, CTA.

### OrderTrackingTimeline
**File:** `components/customer/OrderTrackingTimeline.tsx`
Order status timeline with connected steps, gold accents.

### PageBreadcrumb
**File:** `components/customer/PageBreadcrumb.tsx`
Breadcrumb navigation with RTL-aware chevrons.

### Checkout Components
| File | Purpose |
|------|---------|
| `CheckoutAddressBlock.tsx` | Shipping address entry |
| `CheckoutOrderSummary.tsx` | Order summary sidebar |
| `CheckoutPaymentStrip.tsx` | Payment method selection |
| `CheckoutProgress.tsx` | Multi-step progress indicator |

---

## UI Components (shadcn/ui-style)

| Component | File | Variants | States |
|-----------|------|----------|--------|
| Button | `Button.tsx` | 7 variants × 5 sizes | default, hover, active, disabled, loading |
| Badge | `Badge.tsx` | 5 variants | new, sale, bestseller, low-stock, default |
| Card | `Card.tsx` | default, interactive | hover (gold border glow) |
| Input | `Input.tsx` | default, error, with-icon | focus ring gold |
| Textarea | `Textarea.tsx` | default, error | focus ring gold |
| Select | `Select.tsx` | default | RTL-aware |
| Checkbox | `Checkbox.tsx` | default, checked | gold accent |
| RadioGroup | `RadioGroup.tsx` | horizontal, vertical | |
| Switch | `Switch.tsx` | on/off | gold active |
| Tabs | `Tabs.tsx` | underline, pill | active gold |
| Dialog | `Dialog.tsx` | modal, alert | backdrop blur |
| Sheet | `Sheet.tsx` | right, left (RTL-aware) | |
| Popover | `Popover.tsx` | click, hover | |
| DropdownMenu | `DropdownMenu.tsx` | | |
| Tooltip | `Tooltip.tsx` | top, bottom, start, end | |
| Skeleton | `Skeleton.tsx` | card, text, circle | shimmer animation |
| Spinner | `Spinner.tsx` | sm, md, lg | gold accent |
| Progress | `Progress.tsx` | determinate, indeterminate | |
| Alert | `Alert.tsx` | info, success, warning, error | |
| Toast / Toaster | `Toast.tsx`, `Toaster.tsx` | info, success, error | auto-dismiss |
| Avatar | `Avatar.tsx` | sm, md, lg | fallback initials |
| Label | `Label.tsx` | default, required | red asterisk |
| Separator | `Separator.tsx` | horizontal, vertical | |
| Table | `Table.tsx` | default, striped | sortable headers |
| Pagination | `Pagination.tsx` | numbered, prev/next | Arabic labels |
| EmptyState | `EmptyState.tsx` | | icon + title + CTA |
| Breadcrumb | `Breadcrumb.tsx` | | RTL chevrons |

---

## Admin Components

### AdminLayout
**File:** `components/admin/AdminLayout.tsx`
Admin shell — sidebar nav + header + content area.

### AdminModal
**File:** `components/admin/AdminModal.tsx`
Admin-specific modal with form support.

### DataTable
**File:** `components/admin/DataTable.tsx`
Sortable, filterable data table with pagination, search, bulk actions.

### Page Components
| File | Purpose |
|------|---------|
| `DashboardPage.tsx` | Sales metrics, revenue chart, top products |
| `ProductsPage.tsx` | Product CRUD with image upload, inventory |
| `OrdersPage.tsx` | Order management, status updates, tracking |
| `CustomersPage.tsx` | Customer list, order history |
| `CategoriesPage.tsx` | Category CRUD |
| `CouponsPage.tsx` | Coupon create/edit, usage tracking |
| `SlidesPage.tsx` | Hero carousel management |
| `SettingsPage.tsx` | System configuration |

---

## Icons

**File:** `components/icons/CategoryIcons.tsx`
Category-specific SVG icons for product types — stove, freezer, water cooler, vacuum, blender, TV.
