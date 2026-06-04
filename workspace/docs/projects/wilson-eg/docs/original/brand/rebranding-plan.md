# Wilson Egypt Rebranding Master Plan

## Executive Decision

**Primary Brand Color: Gold** (`#FEB636` and family)
- Warm, premium golden amber
- Evokes quality, trust, and Egyptian heritage
- Works beautifully with Arabic typography

---

## 1. Color System - "Egyptian Gold"

### Primary Gold Palette

```css
:root {
  /* Primary Gold - Main Brand Color */
  --primary-50:  #FFFBEB;  /* HSL: 48, 100%, 96% | Cream Gold */
  --primary-100: #FEF3C7;  /* HSL: 45, 97%, 88% | Light Gold */
  --primary-200: #FDE68A;  /* HSL: 43, 96%, 77% | Soft Gold */
  --primary-300: #FCD34D;  /* HSL: 40, 95%, 65% | Pale Gold */
  --primary-400: #FBBF24;  /* HSL: 37, 94%, 55% | Bright Gold */
  --primary-500: #FEB636;  /* HSL: 38, 99%, 60% | BRAND GOLD */
  --primary-600: #D97706;  /* HSL: 32, 95%, 44% | Deep Gold */
  --primary-700: #B45309;  /* HSL: 28, 92%, 37% | Rich Gold */
  --primary-800: #92400E;  /* HSL: 24, 83%, 31% | Dark Gold */
  --primary-900: #78350F;  /* HSL: 21, 78%, 27% | Bronze */
  --primary-950: #451A03;  /* HSL: 19, 94%, 14% | Darkest Bronze */

  /* Neutral Tones - Warm Grays (Gold-tinted) */
  --neutral-50:  #FAFAF9;  /* HSL: 60, 9%, 98% | Off-white */
  --neutral-100: #F5F5F4;  /* HSL: 60, 9%, 96% | Warm white */
  --neutral-200: #E7E5E4;  /* HSL: 30, 6%, 90% | Light warm */
  --neutral-300: #D6D3D1;  /* HSL: 30, 6%, 83% | Soft warm */
  --neutral-400: #A8A29E;  /* HSL: 30, 5%, 64% | Medium warm */
  --neutral-500: #78716C;  /* HSL: 30, 5%, 45% | Stone */
  --neutral-600: #57534E;  /* HSL: 30, 5%, 32% | Dark stone */
  --neutral-700: #44403C;  /* HSL: 30, 5%, 25% | Charcoal warm */
  --neutral-800: #292524;  /* HSL: 20, 5%, 16% | Near black warm */
  --neutral-900: #1C1917;  /* HSL: 20, 5%, 11% | Rich black */

  /* Accent Colors */
  --accent-success: #10B981;  /* Emerald - for stock, positive states */
  --accent-warning: #F59E0B;  /* Amber - for alerts, sale badges */
  --accent-error:   #EF4444;  /* Red - for errors, out of stock */
  --accent-info:    #3B82F6;  /* Blue - for information */

  /* Semantic Colors */
  --color-sale:      #DC2626;  /* Sale price highlight */
  --color-in-stock:  #059669;  /* In stock indicator */
  --color-low-stock: #D97706;  /* Low stock warning */
  --color-new:       #7C3AED;  /* New product badge */
  --color-bestseller: #F59E0B; /* Bestseller badge */

  /* Background Colors */
  --bg-primary:   #FFFFFF;
  --bg-secondary: #FFFBEB;  /* Gold-tinted background */
  --bg-tertiary:  #FEF3C7;  /* Light gold section */
  --bg-dark:      #1C1917;  /* Dark mode primary */

  /* Text Colors */
  --text-primary:   #1C1917;
  --text-secondary: #57534E;
  --text-muted:     #78716C;
  --text-inverse:   #FFFFFF;
}
```

### Accessibility Notes
- Primary-500 (#FEB636) on white: 2.1:1 (decorative only)
- Primary-600 (#D97706) on white: 3.5:1 (large text AA)
- Primary-700 (#B45309) on white: 4.9:1 (normal text AA)
- Primary-800 (#92400E) on white: 7.1:1 (AAA)

**For text on gold backgrounds**: Use neutral-900 or primary-800+

### Tailwind Config Update

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FEB636',  // Main brand
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
        },
        brand: {
          gold: '#FEB636',
          bronze: '#78350F',
          copper: '#B45309',
        }
      }
    }
  }
}
```

---

## 2. Typography System

### Arabic Fonts (Primary)
```css
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800;900&display=swap');

/* Arabic Typography Scale */
:root {
  --font-arabic: 'Cairo', 'Tajawal', system-ui, sans-serif;
  --font-english: 'Inter', system-ui, sans-serif;
}

/* Fluid Typography */
.text-hero {
  font-size: clamp(2.5rem, 5vw + 1rem, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
}

.text-h1 {
  font-size: clamp(2rem, 4vw + 0.5rem, 3.5rem);
  font-weight: 700;
  line-height: 1.2;
}

.text-h2 {
  font-size: clamp(1.5rem, 3vw + 0.5rem, 2.5rem);
  font-weight: 700;
  line-height: 1.25;
}

.text-h3 {
  font-size: clamp(1.25rem, 2vw + 0.5rem, 2rem);
  font-weight: 600;
  line-height: 1.3;
}

.text-body {
  font-size: clamp(1rem, 1.5vw, 1.125rem);
  font-weight: 400;
  line-height: 1.6;
}

.text-small {
  font-size: clamp(0.875rem, 1vw, 1rem);
  font-weight: 400;
  line-height: 1.5;
}
```

### Font Pairing Rules
| Context | Arabic | English |
|---------|--------|---------|
| Hero/Display | Cairo 800-900 | Inter 700-800 |
| Headings | Cairo 700 | Inter 600-700 |
| Body | Tajawal 400-500 | Inter 400-500 |
| UI/Labels | Cairo 600 | Inter 500-600 |
| Numbers | Inter | Inter |

---

## 3. Frontend Architecture - What Needs Building

### Current State Analysis (from Research)

**Present (Demo):**
- 7 pages: Home, Products, ProductDetail, About, Service, Contact, 404
- 2 contexts: Language, Toast
- Bilingual (AR/EN)
- WhatsApp ordering (no cart)

**Missing for Production:**

#### P0 - Critical E-commerce
| Component | Status | Priority |
|-----------|--------|----------|
| Cart System | MISSING | P0 |
| Checkout Flow | MISSING | P0 |
| User Auth | MISSING | P0 |
| Order Creation | MISSING | P0 |
| API Integration | MISSING | P0 |

#### P1 - Account Features
| Component | Status | Priority |
|-----------|--------|----------|
| User Dashboard | MISSING | P1 |
| Order History | MISSING | P1 |
| Address Management | MISSING | P1 |
| Wishlist | MISSING | P1 |
| Order Tracking | MISSING | P1 |

#### P2 - Enhanced Features
| Component | Status | Priority |
|-----------|--------|----------|
| Product Reviews | MISSING | P2 |
| Search System | MISSING | P2 |
| Comparison Tool | MISSING | P2 |
| Installment Calculator | STUB | P2 |

### Admin Panel - Full Requirements

| Section | Features |
|---------|----------|
| **Dashboard** | Sales metrics, order counts, revenue charts, top products |
| **Products** | CRUD with image upload, variants, inventory management |
| **Orders** | Status updates, tracking, customer info, fulfillment |
| **Customers** | User list, order history, addresses, communication |
| **Coupons** | Create/edit coupons, usage tracking, user targeting |
| **Slides/Banners** | Hero carousel management, promotions |
| **Analytics** | Period filtering, retention rates, revenue trends |

---

## 4. Backend Analysis - Current vs Needed

### Current Backend (`app.py` - ~2800 lines)

**Originally Built For:** Shozati (Shoes E-commerce)

**Database Models:**
- User, Product, ProductVariant, VariantImage, VariantSize
- Order, OrderItem, OrderTracking
- Address, Favorite, Coupon, CouponUser, CouponUsage
- OfferSlide

**API Endpoints (Ready to Use):**
- Products: CRUD, filtering, search, variants, inventory
- Orders: Create, list, track, cancel, status update
- Auth: Phone-based login/register, JWT (30-day)
- Addresses: CRUD with default management
- Favorites: Toggle, list, status check
- Coupons: Validate, CRUD, statistics
- Slides: CRUD, public listing
- Admin Analytics: Dashboard with period filtering

**What Needs Modification:**

| Current | Needed for Appliances |
|---------|----------------------|
| `size` (shoe sizes 40-45) | `capacity` (liters, dimensions) |
| `color_name/color_code` | `color_name/color_code` (same) |
| Category: shoes | Categories: refrigerators, stoves, coolers, vacuums, TVs, small appliances |
| Product features: shoe-specific | Product features: energy rating, voltage, dimensions, warranty years |

**Backend Adaptation Plan:**

1. **Categories Migration**
```python
# New categories for appliances
CATEGORIES = [
    'refrigerators',
    'freezers',
    'stoves',
    'ovens',
    'water_coolers',
    'vacuum_cleaners',
    'tvs',
    'small_appliances'
]
```

2. **Product Attributes Schema**
```python
# Add to Product model or create ProductAttribute
class ProductAttribute:
    energy_rating = Column(String)     # A++, A+, A, B
    voltage_range = Column(String)     # "180-260V"
    capacity_liters = Column(Integer)  # For fridges
    dimensions = Column(String)        # "WxHxD cm"
    warranty_years = Column(Integer)   # 2, 5, 10
    warranty_type = Column(String)     # full, compressor
    installation_included = Column(Boolean, default=True)
    delivery_free = Column(Boolean, default=True)
```

3. **Variant Size → Variant Spec**
```python
# Change from shoe sizes to appliance specs
class VariantSpec:
    variant_id = Column(String)
    spec_type = Column(String)   # capacity, color, finish
    spec_value = Column(String)  # "350L", "Silver", "Stainless Steel"
    in_stock = Column(Boolean)
    quantity = Column(Integer)
    price_modifier = Column(Float, default=0)
```

---

## 5. Design System Components

### Core Components (from example-2 + new)

```
src/components/ui/
├── Button.tsx          # Primary (gold), secondary, outline, ghost
├── Card.tsx            # Product cards, feature cards
├── Badge.tsx           # Sale, new, bestseller, low-stock
├── Input.tsx           # Text, phone, email with validation
├── Select.tsx          # Dropdown for categories, filters
├── Modal.tsx           # Quick view, confirmations
├── Toast.tsx           # Success, error, warning notifications
├── Skeleton.tsx        # Loading states
├── Avatar.tsx          # User profile images
├── Accordion.tsx       # FAQ sections
├── Tabs.tsx            # Product details sections
├── Carousel.tsx        # Product images, hero slider
├── Rating.tsx          # Star ratings display/input
├── QuantityPicker.tsx  # +/- quantity selector
├── PriceDisplay.tsx    # Price with discount, EGP formatting
└── Breadcrumb.tsx      # Navigation trail
```

### E-commerce Components

```
src/components/ecommerce/
├── ProductCard.tsx         # Grid display
├── ProductGrid.tsx         # Responsive grid container
├── ProductGallery.tsx      # Image carousel with zoom
├── ProductInfo.tsx         # Title, price, specs
├── ProductSpecs.tsx        # Specifications table
├── ProductReviews.tsx      # Review list and form
├── RelatedProducts.tsx     # Similar items
├── CartDrawer.tsx          # Slide-out cart
├── CartItem.tsx            # Individual cart row
├── CartSummary.tsx         # Totals and checkout CTA
├── CheckoutForm.tsx        # Multi-step checkout
├── OrderSummary.tsx        # Final review
├── OrderTracking.tsx       # Status timeline
├── WishlistButton.tsx      # Heart toggle
├── ComparisonTable.tsx     # Side-by-side product compare
└── InstallmentCalc.tsx     # Monthly payment calculator
```

### Admin Components

```
src/components/admin/
├── Dashboard/
│   ├── SalesCard.tsx
│   ├── RevenueChart.tsx
│   ├── TopProducts.tsx
│   └── RecentOrders.tsx
├── Products/
│   ├── ProductTable.tsx
│   ├── ProductForm.tsx
│   ├── ImageUploader.tsx
│   └── InventoryEditor.tsx
├── Orders/
│   ├── OrderTable.tsx
│   ├── OrderDetail.tsx
│   └── StatusUpdater.tsx
├── Customers/
│   ├── CustomerTable.tsx
│   └── CustomerDetail.tsx
├── Coupons/
│   ├── CouponTable.tsx
│   └── CouponForm.tsx
├── Slides/
│   ├── SlideTable.tsx
│   └── SlideForm.tsx
└── Layout/
    ├── AdminSidebar.tsx
    ├── AdminHeader.tsx
    └── AdminLayout.tsx
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Update color system to gold palette
- [ ] Update typography to Cairo/Tajawal
- [ ] Create base UI components with gold theme
- [ ] Set up API service layer
- [ ] Create CartContext and AuthContext

### Phase 2: Customer E-commerce (Week 3-4)
- [ ] Build cart functionality
- [ ] Build checkout flow
- [ ] Implement user authentication
- [ ] Connect product listing to API
- [ ] Build order creation and tracking

### Phase 3: User Account (Week 5)
- [ ] User dashboard
- [ ] Order history
- [ ] Address management
- [ ] Wishlist functionality

### Phase 4: Admin Panel (Week 6-7)
- [ ] Admin layout and navigation
- [ ] Dashboard analytics
- [ ] Product management CRUD
- [ ] Order management
- [ ] Customer management
- [ ] Coupon management
- [ ] Slide management

### Phase 5: Polish & Optimization (Week 8)
- [ ] Performance optimization
- [ ] SEO implementation
- [ ] Analytics integration
- [ ] Testing and bug fixes
- [ ] Documentation

---

## 7. Key Design Principles

### Visual Identity
1. **Gold as hero** - Primary brand color in CTAs, highlights, accents
2. **Warm neutrals** - Gold-tinted grays for backgrounds and text
3. **Generous whitespace** - Premium, uncluttered feel
4. **Arabic-first** - RTL layout as default, LTR as secondary

### Interaction Design
1. **Smooth transitions** - Gold glow on hover, fade animations
2. **Clear feedback** - Toast notifications, loading states
3. **Touch-friendly** - Large tap targets for mobile
4. **Accessible** - WCAG 2.1 AA compliance

### Brand Voice
- **Arabic**: Conversational Egyptian colloquial ("صُنع للبيت المصري")
- **English**: Professional but warm ("Made for Egyptian Homes")
- **Tone**: Confident, honest, supportive

---

## 8. Technical Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | React Context + React Query |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| API | Axios + Custom Service Layer |
| Auth | JWT (30-day expiry) |
| Backend | Flask + SQLAlchemy + SQLite |
| Admin | Same stack, separate routes |

---

## Next Steps

1. **Confirm color palette** - Is #FEB636 the exact gold you want?
2. **Prioritize phases** - Which phase to start with?
3. **Backend decision** - Adapt existing or start fresh?
4. **Reference materials** - Share any design screenshots you have
