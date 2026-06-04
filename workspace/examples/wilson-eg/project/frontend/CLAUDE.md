# CLAUDE.md - Wilson Egypt Frontend

This file provides guidance for Claude Code when working with the Wilson Egypt frontend.

## Project Overview

Bilingual (Arabic/English) e-commerce frontend for Wilson Egypt home appliances. Features customer storefront and admin dashboard with Egyptian Gold branding (#FEB636).

**Live**: https://kariemseiam.github.io/wilson-egypt/
**Repo**: https://github.com/kariemSeiam/wilson-egypt

---

## Commands

```bash
npm install                # Install dependencies
npm run dev                # Dev server on port 3000
npm run build              # TypeScript compile + Vite build → dist/
npm run lint               # ESLint with typescript-eslint + react-hooks
npm run typecheck          # TypeScript validation
npm run preview            # Preview production build
npx vitest                 # Run tests (jsdom environment)
```

---

## Architecture

React 18 + TypeScript + Vite 5 + Tailwind CSS 3.4 + shadcn/ui + React Query.

### Routes

| Path | Page | Layout |
|------|------|--------|
| `/` | HomePage | Layout |
| `/products` | ProductsPage | Layout |
| `/products/:slug` | ProductDetailPage | Layout |
| `/cart` | CartPage | Layout |
| `/checkout` | CheckoutPage | Layout |
| `/about` | AboutPage | Layout |
| `/service` | ServicePage | Layout |
| `/contact` | ContactPage | Layout |
| `/admin` | DashboardPage | AdminLayout |
| `/admin/products` | ProductsPage | AdminLayout |
| `/admin/orders` | OrdersPage | AdminLayout |
| `/admin/customers` | CustomersPage | AdminLayout |
| `/admin/coupons` | CouponsPage | AdminLayout |
| `/admin/slides` | SlidesPage | AdminLayout |
| `/admin/settings` | SettingsPage | AdminLayout |

### Directory Structure

```
src/
├── App.tsx                 # Routes, QueryClient, LanguageProvider
├── main.tsx                # React root
├── contexts/
│   ├── LanguageContext.tsx # ar/en switching, t() translations, dir/isRTL
│   ├── ThemeContext.tsx    # Dark/light mode with system detection
│   ├── CartContext.tsx     # Shopping cart state, localStorage persistence
│   └── AuthContext.tsx     # JWT authentication state
├── hooks/
│   └── useAdmin.ts         # Admin API hooks with React Query
├── pages/
│   ├── admin/              # Dashboard, Products, Orders, Customers, Coupons, Slides, Settings
│   └── customer/           # Home, Products, ProductDetail, Cart, Checkout, About, Service, Contact
├── components/
│   ├── admin/              # AdminLayout, DataTable
│   ├── layout/             # Header, Footer, Layout
│   └── ui/                 # Button, Card, Input, Badge, Switch, Label, etc.
├── services/
│   └── api.ts              # API client with typed endpoints
├── types/
│   └── index.ts            # TypeScript interfaces (Product, Order, User, etc.)
└── styles/
    └── globals.css         # Egyptian Gold design system
```

---

## Design System

### Egyptian Gold Palette (globals.css)

| Variable | HSL | Usage |
|----------|-----|-------|
| `--primary` | `38 99% 60%` | Brand gold #FEB636 |
| `--secondary` | `45 97% 88%` | Cream background |
| `--accent` | `38 94% 55%` | Gold accent |
| `--success` | `160 84% 39%` | Teal |
| `--destructive` | `0 84% 60%` | Red |

### Typography

```css
[dir="rtl"] body { font-family: 'Cairo', 'Tajawal', sans-serif; }
[dir="ltr"] body { font-family: 'Inter', 'Cairo', sans-serif; }
```

### Custom Utilities

- `.gold-glow` - Hover glow effect
- `.bg-gold-gradient` - Primary gradient
- `.btn-gold` / `.btn-gold-outline` - Gold button variants
- `.text-gradient-gold` - Gradient text
- `.container-narrow` (max-width: 56rem)
- `.container-wide` (max-width: 80rem)
- `.text-h1` through `.text-hero` - Fluid typography

---

## Internationalization

`LanguageContext` provides:

```typescript
const { language, setLanguage, dir, isRTL } = useLanguage();
```

Default language is Arabic (`ar`). Translation strings are inline in components using conditional:

```tsx
const text = language === 'ar' ? 'نص عربي' : 'English text';
```

---

## API Integration

### API Client (src/services/api.ts)

```typescript
import { productsApi, ordersApi, couponsApi, contactApi } from '@/services/api';

// Products
productsApi.getAll({ category: 'ac', sort: 'price_asc', page: 1 });
productsApi.getById('123');
productsApi.search('microwave');

// Orders
ordersApi.create({ items: [...], addressId: '...', paymentMethod: 'cod' });
ordersApi.getAll();

// Coupons
couponsApi.validate('SAVE10', 5000);
```

### Dev Proxy (vite.config.ts)

```typescript
proxy: {
  '/api': { target: 'http://127.0.0.1:5004', changeOrigin: true },
  '/uploads': { target: 'http://127.0.0.1:5004', changeOrigin: true },
}
```

---

## Deployment

### GitHub Pages

- **Base path**: `/wilson-egypt/` (set in vite.config.ts)
- **Branch**: `gh-pages`
- **Build**: `npm run build` → `dist/` folder

```bash
# Deploy to gh-pages branch
git add dist -f
git commit -m "Deploy"
git subtree push --prefix dist origin gh-pages
```

---

## Path Alias

```json
// tsconfig.json
"paths": { "@/*": ["./src/*"] }
```

Usage:
```typescript
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
```

---

## Key Patterns

### RTL-Aware Layout

```tsx
const { isRTL } = useLanguage();
<div className={cn(isRTL ? 'space-x-reverse' : 'space-x-4')}>
```

### cn() Utility

```tsx
import { cn } from '@/lib/utils';
<div className={cn('base-class', condition && 'conditional-class')} />
```

### API Error Handling

```typescript
try {
  const product = await productsApi.getById(id);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.status, error.message);
  }
}
```

---

## Backend API Reference

Connects to Flask backend at `http://127.0.0.1:5004` (dev) or production URL.

Key endpoints:
- `GET /api/products` - Product list with filters
- `GET /api/products/:id` - Single product
- `POST /api/orders` - Create order
- `POST /api/auth/login` - Login
- `POST /api/coupons/validate` - Validate coupon
- `GET /api/admin/*` - Admin endpoints (require JWT)
