# Architecture

> Wilson Egypt e-commerce — Flask + React 18 + Vite 6 + Tailwind CSS

---

## System Overview

Wilson Egypt is a bilingual (Arabic/English) home appliances e-commerce platform. Egyptian Gold identity, RTL-first, dark/light themes.

| Layer | Technology | Directory |
|-------|-----------|-----------|
| Frontend | React 18 + Vite 6 + Tailwind CSS 3 | `project/frontend/` |
| Backend | Flask + SQLAlchemy + JWT | `project/backend/app.py` |
| Database | SQLite (`wilson.db`) | `instance/` |
| Language | TypeScript (frontend), Python (backend) | |
| Container | PythonAnywhere deployment | `deploy/pythonanywhere/` |

## Stack Details

**Frontend (44 components):**
- React 18 + TypeScript + Vite 6
- Tailwind CSS with CSS variable theme system
- shadcn/ui-inspired component library
- React Context for auth, cart, language, theme
- Lucide icons
- React Router v6 for routing

**Backend (Flask):**
- SQLAlchemy ORM
- JWT authentication (30-day tokens)
- Phone-based login/register
- Full CRUD for products, orders, customers, coupons
- Admin analytics dashboard API
- Image upload support

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Wilson React   │     │  Flask Backend   │     │    SQLite DB     │
│   Frontend       │────▶│  :5004 /api/*   │────▶│   wilson.db      │
│   :3000 (dev)    │     │                  │     │                  │
│                  │     │  Auth (JWT)      │     │  users           │
│  Pages:          │     │  Products CRUD   │     │  products        │
│  Home, Shop,     │     │  Orders          │     │  product_variants│
│  Detail, Cart,   │     │  Customers       │     │  orders          │
│  Checkout,       │     │  Coupons         │     │  order_items     │
│  Admin Portal    │     │  Analytics       │     │  addresses       │
│                  │     │  Slides          │     │  coupons         │
│  DoodleBg        │     │                  │     │  offer_slides    │
│  (SVG pattern)   │     │                  │     │                  │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

## Route Mapping

### Customer Pages
| Path | Page | Purpose |
|------|------|---------|
| `/` | HomePage | Hero, categories, featured products, trust strips |
| `/products` | ProductsPage | Category filter grid, infinite scroll |
| `/products/:slug` | ProductDetailPage | Gallery, info, CTA bar, specs |
| `/cart` | CartPage | Cart items, summary, checkout |
| `/checkout` | CheckoutPage | Multi-step checkout |
| `/orders` | OrdersPage | Order history |
| `/orders/:id` | OrderDetailPage | Single order tracking |
| `/wishlist` | WishlistPage | Saved items |
| `/contact` | ContactPage | Contact form, WhatsApp |
| `/service` | ServicePage | Service/repair info |
| `/about` | AboutPage | Brand story |
| `/login` | LoginPage | Auth (phone-based) |
| `/profile` | ProfilePage | Account settings |
| `*` | NotFoundPage | Error 404 |

### Admin Pages
| Path | Page | Purpose |
|------|------|---------|
| `/admin` | AdminPortalPage | Dashboard, metrics |
| `/admin/products` | ProductsPage | Product CRUD |
| `/admin/categories` | CategoriesPage | Category management |
| `/admin/orders` | OrdersPage | Order management |
| `/admin/customers` | CustomersPage | Customer list |
| `/admin/coupons` | CouponsPage | Coupon CRUD |
| `/admin/slides` | SlidesPage | Hero banner management |
| `/admin/settings` | SettingsPage | System settings |

## Provider Hierarchy

```jsx
<ThemeProvider>
  <AuthProvider>
    <CartProvider>
      <LanguageProvider>
        <Router>
          <Layout>
            <SeoHead />
            <Header />
            <main>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Customer routes */}
                  {/* Admin routes (protected) */}
                  {/* 404 */}
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </Layout>
        </Router>
      </LanguageProvider>
    </CartProvider>
  </AuthProvider>
</ThemeProvider>
```

## Key Architecture Decisions

### Theme System
- `class`-based dark mode via Tailwind
- CSS variables (`:root` / `.dark`) for all colors
- 400+ CSS var tokens across light and dark
- `--background`, `--foreground`, `--primary`, etc.
- `--gold-50` through `--gold-950` scale
- `--grid-dot`, `--grid-line` for background patterns

### RTL Strategy
- `dir="rtl"` on `<html>` element
- Tailwind logical properties (ps-, pe-, ms-, me-, start, end)
- Cairo/Tajawal fonts for Arabic, Inter for English
- Direction-aware animation (menu drawer 3D swing)

### Design Pattern Layer
- **ApplianceDoodleBg** — SVG hand-drawn doodles as full-page backgrounds
- **Gold mesh** — radial gradient overlay on hero sections
- **Grain overlay** — CSS noise texture on sections
- **Grid patterns** — dots/lines/mesh/hex/cross via CSS vars
- **Section-rounded-bg** — margin+radius sections with doodle clip
