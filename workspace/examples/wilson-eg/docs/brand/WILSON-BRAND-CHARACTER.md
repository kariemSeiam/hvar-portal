# Wilson Egypt - Brand Character & UI/UX Philosophy

## Brand Soul

**Tagline:** صُنع للبيت المصري (Made for Egyptian Homes)

**Core Promise:** Quality appliances that understand Egyptian life.

---

## Brand Personality

### We Are:

| Trait | How We Show It |
|-------|----------------|
| **Reliable** | 5-year warranty, 48-hour service, parts always available |
| **Smart** | Better engineering, thoughtful features, energy efficient |
| **Local** | Designed for Egypt's climate, voltage, families, cooking |
| **Honest** | Real specs, real prices, no gimmicks |
| **Warm** | Family-focused, supportive, always there when needed |

### We Are NOT:

- Luxury/status brand
- Budget-cheap option
- Foreign import mystique
- Tech-first innovator
- Cold corporate entity

### Brand Voice:

**Arabic:**
> قوية. ذكية. بسعر عادل.
> معاك طول العمر.
> مش الأرخص... الأفضل ليك.

**English:**
> Powerful. Smart. Fairly Priced.
> With You for Life.
> Not the cheapest... The best for you.

---

## Visual Identity

### Primary Color: Egyptian Gold (#FEB636)

**Why Gold:**
- Warm, welcoming, premium feel
- Egyptian heritage (pharaonic gold)
- Stands out from generic blue/green tech brands
- Works beautifully with dark and light modes
- Represents quality and trust

### Color Application Rules:

```css
/* Usage Hierarchy */
--primary: #FEB636;     /* CTAs, highlights, brand moments */
--accent: #FBBF24;      /* Hover states, emphasis */
--deep: #78350F;        /* Text on light backgrounds */

/* Never use gold for: */
- Body text (use stone-900)
- Error states (use danger-500)
- Backgrounds (use stone-50)
```

### Typography System:

| Use Case | Arabic Font | English Font | Weight |
|----------|-------------|--------------|--------|
| Hero/Display | Cairo | Inter | 800-900 |
| Headings | Cairo | Inter | 700 |
| Body | Tajawal | Inter | 400-500 |
| UI/Labels | Cairo | Inter | 600 |
| Numbers | Inter | Inter | 600 |

### Fluid Typography:

```css
/* Mobile-first, scales smoothly */
--text-hero: clamp(2rem, 5vw + 1rem, 4.5rem);
--text-h1: clamp(1.75rem, 4vw, 3.5rem);
--text-h2: clamp(1.5rem, 3vw, 2.5rem);
--text-h3: clamp(1.25rem, 2vw, 2rem);
--text-body: clamp(1rem, 1.5vw, 1.125rem);
```

---

## UI/UX Principles

### 1. Egyptian-First Design

**What This Means:**
- RTL is the default, LTR is secondary
- Arabic typography gets more weight (heavier fonts)
- Images show Egyptian homes/families
- Content addresses Egyptian pain points (voltage, heat, large families)

### 2. Mobile-First, Desktop-Perfect

**Mobile (Priority 1):**
- Touch targets minimum 44px
- Bottom-sheet modals, not popups
- Swipe gestures for galleries
- Sticky CTA buttons
- Collapsible navigation

**Desktop (Priority 2):**
- Hover states with gold glow
- Wider layouts, more whitespace
- Side-by-side comparisons
- Full navigation visible

### 3. Trust Through Transparency

- Real product photos (no stock imagery)
- Actual customer reviews with locations
- Clear warranty information upfront
- Honest stock status
- Price breakdown visible

### 4. Frictionless Path to Purchase

```
Product View → Add to Cart → Checkout → Done
     ↓             ↓            ↓
  [1 click]    [1 click]    [3 fields]
```

**Target:** Complete purchase in under 2 minutes

### 5. Service-First Messaging

- Warranty prominently displayed
- Service response time highlighted
- Parts availability assured
- Contact methods always visible
- WhatsApp integration throughout

---

## Component Patterns

### Product Card

```
┌─────────────────────────┐
│ [Badge: New/Sale]       │
│                         │
│    [Product Image]      │
│                         │
│ Product Name            │
│ Category                │
│ ★★★★☆ (23)             │
│                         │
│ EGP 12,085              │
│ EGP 10,300  [Discount]  │
│                         │
│ [Add to Cart]           │
└─────────────────────────┘
```

**States:**
- Default: Clean, readable
- Hover: Gold border glow, slight lift
- Out of Stock: Muted, "Notify Me" button
- Sale: Discount badge, strikethrough price

### Product Gallery

**Mobile:**
- Swipeable horizontal carousel
- Dots indicator
- Full-screen zoom on tap

**Desktop:**
- Main image with thumbnails
- Zoom on hover
- Lightbox on click

### Cart Drawer

**Mobile:**
- Full-height bottom sheet
- Swipe down to close
- Sticky checkout button

**Desktop:**
- Slide-in from right
- Overlay with blur
- Full cart management

### Checkout Flow

**Steps:**
1. Cart Review
2. Shipping Address
3. Payment (COD default)
4. Confirmation

**Design:**
- Progress indicator
- Back/edit at any step
- Order summary always visible
- Guest checkout available

---

## Page Layouts

### Homepage

```
┌─────────────────────────────────┐
│         HEADER                   │
├─────────────────────────────────┤
│         HERO BANNER              │
│     Full-width, CTA focus        │
├─────────────────────────────────┤
│     SOCIAL PROOF BAR             │
│  Warranty | Service | Delivery   │
├─────────────────────────────────┤
│       CATEGORIES                 │
│      Icon grid, 2x3              │
├─────────────────────────────────┤
│     FEATURED PRODUCTS            │
│     Horizontal scroll            │
├─────────────────────────────────┤
│      WHY WILSON                  │
│      3 pillars cards             │
├─────────────────────────────────┤
│     TESTIMONIALS                 │
│      Carousel quotes             │
├─────────────────────────────────┤
│       CTA SECTION                │
│   "Ready to start?" + buttons    │
├─────────────────────────────────┤
│         FOOTER                   │
└─────────────────────────────────┘
```

### Products Page

```
┌─────────────────────────────────┐
│         HEADER                   │
├─────────────────────────────────┤
│   Category Title + Description   │
├──────────────┬──────────────────┤
│              │                  │
│   FILTERS    │   PRODUCT GRID   │
│   (desktop)  │   2/3/4 columns  │
│              │   infinite scroll│
│   - Category │                  │
│   - Price    │   [Card] [Card]  │
│   - Specs    │   [Card] [Card]  │
│              │   [Card] [Card]  │
│              │                  │
├──────────────┴──────────────────┤
│         FOOTER                   │
└─────────────────────────────────┘
```

### Product Detail Page

```
┌─────────────────────────────────┐
│         HEADER                   │
├─────────────────────────────────┤
│  Breadcrumb: Home > Cat > Name  │
├─────────────────────────────────┤
│                                 │
│  [GALLERY]    │   PRODUCT INFO  │
│   Main img    │   Name          │
│   Thumbnails  │   Rating        │
│               │   Price         │
│               │   Badges        │
│               │   Variant sel   │
│               │   [Add to Cart] │
│               │   [WhatsApp]    │
│               │                 │
│               │   SPECIFICATIONS│
│               │   Key features  │
│               │   Warranty info │
│               │                 │
├───────────────┴─────────────────┤
│     REVIEWS SECTION              │
├─────────────────────────────────┤
│     RELATED PRODUCTS             │
├─────────────────────────────────┤
│         FOOTER                   │
└─────────────────────────────────┘
```

---

## Animation Philosophy

### Principles:
- **Purposeful**: Every animation guides the user
- **Fast**: 200-400ms, never block interaction
- **Smooth**: Ease-out curves, no jank
- **Subtle**: Enhance, don't distract

### Standard Animations:

```css
/* Fade In Up - Content reveal */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Duration: 0.6s ease-out */

/* Scale In - Modal/dialog open */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
/* Duration: 0.3s ease-out */

/* Gold Pulse - CTA attention */
@keyframes pulseGold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(254, 182, 54, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(254, 182, 54, 0); }
}
/* Duration: 2s ease-in-out infinite */
```

---

## Responsive Breakpoints

```css
/* Mobile First */
sm: 640px   /* Small phones → larger phones */
md: 768px   /* Phones → tablets */
lg: 1024px  /* Tablets → laptops */
xl: 1280px  /* Laptops → desktops */
2xl: 1536px /* Large desktops */
```

### Component Adaptations:

| Component | Mobile | Desktop |
|-----------|--------|---------|
| Nav | Hamburger menu | Full horizontal |
| Product Grid | 2 columns | 3-4 columns |
| Filters | Drawer | Sidebar |
| Cart | Full page | Slide drawer |
| Gallery | Swipe carousel | Thumbnails |

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance:

- All text 4.5:1 contrast minimum
- Focus indicators visible (gold ring)
- Alt text on all images
- Form labels properly associated
- Skip-to-content link
- Keyboard navigable
- Screen reader friendly

### Arabic-Specific:

- Higher line-height (1.7-1.8)
- More letter-spacing for headings
- Larger touch targets
- Right-aligned text by default

---

## Content Strategy

### No Competitor Mentions

**Instead of:**
> "35% cheaper than Samsung"

**Say:**
> "Best value in its class"
> "Premium quality at a fair price"
> "More features, better price"

### Focus Points:

1. **Warranty:** "5 years peace of mind"
2. **Service:** "48-hour response, guaranteed"
3. **Quality:** "Built to last, designed for Egypt"
4. **Value:** "Every pound counts"

### Testimonial Style:

**Real, Local, Specific:**
> "الثلاجة شغالة من سنة من غير أي مشاكل. خدماتهم سريعة جداً."
> — أحمد، المعادي

Not generic, not over-the-top praise.

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3s |
| Cumulative Layout Shift | < 0.1 |
| First Input Delay | < 100ms |

---

## Implementation Checklist

### Per Page:
- [ ] Responsive layouts tested (mobile, tablet, desktop)
- [ ] RTL layout verified
- [ ] Animations smooth at 60fps
- [ ] All text properly translated
- [ ] Touch targets ≥ 44px
- [ ] Loading states designed
- [ ] Error states designed
- [ ] Empty states designed

### Per Component:
- [ ] Hover states (desktop)
- [ ] Active/pressed states
- [ ] Focus states
- [ ] Disabled states
- [ ] Loading states
- [ ] Error states
- [ ] Success states

---

*Document Version: 1.0*
*Focus: Wilson's own brand character, not comparisons*
