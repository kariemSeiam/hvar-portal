# Wilson Egypt - Production Implementation Plan

## Project Overview

**Goal**: Build a complete, production-ready e-commerce site for Wilson Egypt home appliances with Egyptian Gold branding.

**Tech Stack**:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- State: React Context + React Query
- Backend: Flask + SQLAlchemy (existing, adapted)
- Database: SQLite (existing)

**Brand Color**: Egyptian Gold (#FEB636)

---

## Phase 1: Project Setup & Foundation (Days 1-3)

### 1.1 Initialize Project

```bash
cd wilson
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1.2 Install Dependencies

```bash
# Core
npm install react-router-dom @tanstack/react-query axios

# UI Components
npm install @radix-ui/react-accordion @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-tabs
npm install @radix-ui/react-toast @radix-ui/react-checkbox
npm install lucide-react class-variance-authority clsx tailwind-merge

# Forms
npm install react-hook-form @hookform/resolvers zod

# Utilities
npm install date-fns
```

### 1.3 Project Structure

```
wilson/
├── public/
│   ├── fonts/
│   │   ├── cairo/
│   │   └── tajawal/
│   └── images/
│       ├── products/
│       ├── categories/
│       └── brand/
├── src/
│   ├── components/
│   │   ├── ui/                 # Base components
│   │   ├── layout/             # Layout components
│   │   ├── ecommerce/          # E-commerce components
│   │   └── admin/              # Admin components
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   ├── services/
│   │   ├── api.ts              # Axios instance
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── auth.ts
│   │   └── admin.ts
│   ├── pages/
│   │   ├── customer/           # Customer pages
│   │   └── admin/              # Admin pages
│   ├── lib/
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   ├── data/
│   │   └── translations.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### 1.4 Design System Setup

Copy gold design system from `docs/rebranding-plan.md`:
- CSS variables for gold theme
- Tailwind configuration
- Typography scale
- Animation keyframes

---

## Phase 2: Core Infrastructure (Days 4-7)

### 2.1 API Service Layer

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5004',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wilson-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 2.2 Context Providers

#### AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: ProfileData) => Promise<void>;
}
```

#### CartContext
```typescript
interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant: Variant, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
}
```

#### LanguageContext
- Arabic (primary) / English (secondary)
- RTL/LTR switching
- Translation function

### 2.3 Core Hooks

- `useProducts()` - Fetch products with filters
- `useProduct(id)` - Single product
- `useCategories()` - Product categories
- `useCart()` - Cart operations
- `useAuth()` - Auth state
- `useOrders()` - User orders
- `useToast()` - Notifications

---

## Phase 3: Customer E-commerce (Days 8-14)

### 3.1 Pages to Build

| Page | Route | Priority |
|------|-------|----------|
| Home | `/` | P0 |
| Products | `/products` | P0 |
| Product Detail | `/products/:slug` | P0 |
| Cart | `/cart` | P0 |
| Checkout | `/checkout` | P0 |
| Order Success | `/order/success` | P0 |
| Login | `/login` | P0 |
| Account | `/account` | P1 |
| Orders | `/account/orders` | P1 |
| Order Detail | `/account/orders/:id` | P1 |
| Addresses | `/account/addresses` | P1 |
| Wishlist | `/wishlist` | P1 |
| About | `/about` | P2 |
| Service | `/service` | P2 |
| Contact | `/contact` | P2 |
| Track Order | `/track-order` | P2 |

### 3.2 Key Components

#### ProductCard
```typescript
interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  onAddToWishlist?: () => void;
  showQuickView?: boolean;
}
```

#### CartDrawer
- Slide-out cart preview
- Quantity controls
- Remove item
- Subtotal
- Checkout CTA

#### CheckoutFlow (Multi-step)
1. Cart Review
2. Shipping Address
3. Payment Method
4. Order Confirmation

#### ProductGallery
- Image carousel
- Thumbnail navigation
- Zoom functionality

---

## Phase 4: Admin Panel (Days 15-21)

### 4.1 Admin Routes

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin` | Analytics overview |
| Products | `/admin/products` | Product CRUD |
| Product Edit | `/admin/products/:id` | Single product |
| Orders | `/admin/orders` | Order management |
| Order Detail | `/admin/orders/:id` | Order details |
| Customers | `/admin/customers` | Customer list |
| Coupons | `/admin/coupons` | Coupon management |
| Slides | `/admin/slides` | Banner management |
| Settings | `/admin/settings` | Site settings |

### 4.2 Admin Components

- AdminLayout with sidebar navigation
- DataTable with sorting, filtering, pagination
- ProductForm with image upload
- OrderStatusUpdater
- CouponForm
- SlideUploader
- AnalyticsCharts

### 4.3 Dashboard Widgets

- Total Sales
- Order Count
- Average Order Value
- Top Products
- Revenue Chart
- Recent Orders
- Customer Retention

---

## Phase 5: Backend Adaptation (Days 22-25)

### 5.1 Product Model Changes

```python
# Add appliance-specific fields
class Product(db.Model):
    # Existing fields...

    # New fields for appliances
    energy_rating = Column(String)      # A++, A+, A, B
    voltage_range = Column(String)      # "180-260V"
    capacity = Column(String)           # "350 Liters"
    dimensions = Column(String)         # "WxHxD cm"
    warranty_years = Column(Integer)    # 2, 5, 10
    warranty_type = Column(String)      # full, compressor

    # Category change
    category = Column(String)           # refrigerators, stoves, etc.
```

### 5.2 Variant Changes

```python
# Change from shoe sizes to appliance specs
class VariantSpec(db.Model):
    variant_id = Column(String)
    spec_name = Column(String)   # color, finish, capacity
    spec_value = Column(String)  # Silver, Stainless Steel, 350L
    in_stock = Column(Boolean)
    quantity = Column(Integer)
```

### 5.3 Categories Migration

```python
CATEGORIES = {
    'refrigerators': {
        'ar': 'الثلاجات والفريزرات',
        'en': 'Refrigerators & Freezers'
    },
    'stoves': {
        'ar': 'البوتاجازات والأفران',
        'en': 'Stoves & Ovens'
    },
    'water_coolers': {
        'ar': 'مبردات المياه',
        'en': 'Water Coolers'
    },
    'vacuum_cleaners': {
        'ar': 'المكانس الكهربائية',
        'en': 'Vacuum Cleaners'
    },
    'tvs': {
        'ar': 'الشاشات',
        'en': 'TVs'
    },
    'small_appliances': {
        'ar': 'الأجهزة الصغيرة',
        'en': 'Small Appliances'
    }
}
```

---

## Phase 6: Polish & Testing (Days 26-30)

### 6.1 Performance

- [ ] Image lazy loading
- [ ] Route-based code splitting
- [ ] API response caching
- [ ] Bundle optimization

### 6.2 SEO

- [ ] Meta tags per page
- [ ] Structured data (JSON-LD)
- [ ] Sitemap generation
- [ ] robots.txt

### 6.3 Accessibility

- [ ] ARIA labels
- [ ] Focus management
- [ ] Keyboard navigation
- [ ] Color contrast verification

### 6.4 Testing

- [ ] Unit tests for utilities
- [ ] Component tests for key flows
- [ ] E2E tests for checkout

---

## File Deliverables

### Phase 1
- [ ] `wilson/package.json`
- [ ] `wilson/vite.config.ts`
- [ ] `wilson/tailwind.config.ts`
- [ ] `wilson/src/styles/globals.css`
- [ ] `wilson/src/lib/utils.ts`

### Phase 2
- [ ] `wilson/src/services/api.ts`
- [ ] `wilson/src/contexts/AuthContext.tsx`
- [ ] `wilson/src/contexts/CartContext.tsx`
- [ ] `wilson/src/contexts/LanguageContext.tsx`
- [ ] `wilson/src/types/index.ts`

### Phase 3
- [ ] All customer pages
- [ ] All e-commerce components
- [ ] Checkout flow

### Phase 4
- [ ] All admin pages
- [ ] Admin layout
- [ ] Admin components

### Phase 5
- [ ] Updated `app.py`
- [ ] Database migration scripts
- [ ] Updated API responses

---

## Quick Start Commands

```bash
# Start development
cd wilson
npm run dev

# Start backend (separate terminal)
cd ..
python app.py

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Environment Variables

```env
# wilson/.env
VITE_API_URL=http://127.0.0.1:5004
VITE_APP_NAME=Wilson Egypt
VITE_DEFAULT_LANGUAGE=ar
```
