# Cross-Hvar Design Language Analysis

> A comparative study of the **5 design languages** across the Hvar ecosystem + Wilson — their origins, token systems, pattern innovations, and when to use which.

## The Five Faces

```

                          ┌────────────────────────────────────────────┐
                          │         HVAR ECOSYSTEM + WILSON            │
                          │                                            │
    ┌───────────┐  ┌──────┴──────┐  ┌──────────┐  ┌──────────┐  ┌─────┴──────┐
    │ Hvar-POS  │  │Hvar-Catalog │  │Hvar-OLD  │  │  MCRM    │  │ Wilson-eg  │
    │ Green     │  │ Red        │  │ Rose      │  │  Rose    │  │ Gold       │
    │ #22c55e   │  │ #ef4444    │  │ #f43f5e   │  │  #f43f5e │  │ #FEB636    │
    │Utilitarian│  │ Premium    │  │ Data-dense│  │ Operative│  │ Creative   │
    │ Terminal  │  │ Catalog    │  │ Admin     │  │  CRM     │  │ E-commerce │
    └───────────┘  └────────────┘  └──────────┘  └──────────┘  └────────────┘
```

## Color Architecture

### Primary Scales

| Token | POS (Green) | Catalog (Red) | OLD (Rose) | MCRM (Rose) | **Wilson (Gold)** |
|-------|-------------|---------------|------------|-------------|-------------------|
| 50 | #f0fdf4 | #fef2f2 | #fff1f2 | #fff1f2 | #FFFBEB |
| 500 | #22c55e | #ef4444 | #f43f5e | #f43f5e | **#FEB636** |
| 600 | #16a34a | #dc2626 | #e11d48 | #e11d48 | #D97706 |
| 700 | #15803d | #b91c1c | #be123c | #be123c | #B45309 |
| 900 | #14532d | #7f1d1d | #881337 | #881337 | #78350F |

### Palette Size & CSS System

| Category | POS | Catalog | OLD | MCRM | **Wilson** |
|----------|-----|---------|-----|------|-----------|
| Brand colors | 10 | 12 | 10 | 10 | 10 |
| Semantic colors | 4 | 6 | 6 | 9 operative | 4 |
| Surface colors | 8 | 8 | 6 | 4 | 4 |
| Ink colors | 6 | 4 | 6 | 4 | 4 |
| Border colors | 2 | 4 | 3 | 2 | 2 |
| Badge colors | 0 | 0 | 6 | 6 | 4 |
| Shadow tints | 0 | 3 | 5 | 7 | 4 |
| **Total tokens** | **76** | **68** | **70+** | **70+** | **70+** |
| **CSS lines** | ~200 | ~500 | ~800 | ~600 | **3,834** |
| **Pattern innovations** | 0 | 0 | 0 | 2 | **13** |

### Dark Mode Support

| Feature | POS | Catalog | OLD | MCRM | **Wilson** |
|---------|-----|---------|-----|------|-----------|
| Dark mode | ❌ | ❌ | ✅ | ✅ | ✅ |
| Named themes | ❌ | ❌ | ❌ | ❌ | **Desert Luxe / Night Luxe** |
| Safe-area aware | ❌ | ❌ | ❌ | ❌ | ✅ |
| 44px touch targets | ❌ | ❌ | ❌ | ❌ | ✅ (every element) |
| prefers-reduced-motion | ❌ | ❌ | ❌ | ❌ | ✅ |
| RTL logical props | Partial | Full | Full | Full | Full |

## Pattern Innovation Comparison

| Pattern | POS | Catalog | OLD | MCRM | **Wilson** |
|---------|-----|---------|-----|------|-----------|
| Doodle backgrounds | ❌ | ❌ | ❌ | ❌ | **22 SVG doodles** |
| CSS noise/grain | ❌ | ❌ | ❌ | ❌ | **CSS fractalNoise** |
| Background grids | ❌ | ❌ | ❌ | ❌ | **5 patterns (dots/lines/mesh/hex/cross)** |
| Gold/color mesh hero | ❌ | ❌ | ❌ | ❌ | **radial-gradient mesh** |
| 3D menu animation | ❌ | ❌ | ❌ | ❌ | **rotateY door-swing** |
| Card shine hover | ❌ | ❌ | ❌ | ❌ | **diagonal gradient sweep** |
| Scroll reveals | ❌ | ❌ | ❌ | ❌ | **3 variants + stagger** |
| CTA trust line | ❌ | ❌ | ❌ | ❌ | **warranty/service line** |
| Service stepper | ❌ | ❌ | ❌ | ❌ | **connected steps** |
| CTA horizontal bar | ❌ | ❌ | ❌ | ❌ | **stepper + cart + WA** |
| Action FAB | ❌ | ❌ | ❌ | ❌ | **cart FAB, WA FAB** |
| Staggered menu items | ❌ | ❌ | ❌ | ❌ | **nth-child delays** |
| Product viewport | ❌ | ❌ | ❌ | ❌ | **auto-cycle + breathe** |
| Gold glow shadows | ❌ | ❌ | ❌ | ❌ | **4 gold shadow levels** |
| Section gold dividers | ❌ | ❌ | ❌ | ❌ | **gradient separator** |

## Typography

| Aspect | POS | Catalog | OLD | MCRM | **Wilson** |
|--------|-----|---------|-----|------|-----------|
| Display | Cairo | Cairo | Cairo | Cairo | **Cairo + Playfair Display** |
| Body | Tajawal | Tajawal | Tajawal | Cairo | **Cairo + Inter** |
| English | system | system | system | system | **Inter (full stack)** |
| Fluid (clamp) | ❌ Fixed | ✅ Yes | ✅ Yes | ✅ Yes | **✅ Yes (most granular)** |
| Mono | system | system | system | **Roboto Mono** | system |

## Component Design

### Button Variants

| Variant | POS | Catalog | OLD | MCRM | **Wilson** |
|---------|-----|---------|-----|------|-----------|
| primary | ✅ | ✅ | ✅ | ✅ | ✅ (gold) |
| secondary | ❌ | ✅ | ✅ | ✅ | ✅ |
| outline | ✅ | ✅ | ✅ | ✅ | ✅ |
| ghost | ❌ | ✅ | ✅ | ✅ | ✅ |
| danger | ❌ | ✅ | ✅ | ✅ | ✅ |
| success | ❌ | ❌ | ✅ | ✅ | ✅ |
| gradient | ❌ | ✅ | ❌ | ❌ | ❌ |
| ghost-danger | ❌ | ❌ | ❌ | ❌ | ✅ (logout) |
| icon-only (44px) | ❌ | ❌ | ❌ | ❌ | **✅ (all icons)** |
| sizes | 3 | 3 | 5 | 5 | **5 (xs through xl)** |

### Component Count

| Type | POS | Catalog | OLD | MCRM | **Wilson** |
|------|-----|---------|-----|------|-----------|
| UI components | 25 | 16 | 14 | 14 | **26** |
| Layout components | — | 5 | 5 | 4 | **7** |
| Customer/Feature | — | 11 | 11 | 22 | **16** |
| Admin pages | — | — | — | — | **8** |
| **Total** | **25** | **16** | **30** | **40** | **44** |

## Design Principles

```yaml
Hvar-POS:
  principle: "Get in, transact, get out"
  audience: "Cashiers, warehouse staff"
  constraint: "Barcode-first, single screen"
  feel: "Industrial, trustworthy, fast"

Hvar-Catalog:
  principle: "Browse, discover, desire"
  audience: "Consumers, shoppers"
  constraint: "Mobile-first, one-page scroll"
  feel: "Premium, emotional, curated"

Hvar-OLD:
  principle: "See everything, act fast"
  audience: "Call center agents, managers, technicians"
  constraint: "Data density, keyboard navigation"
  feel: "Professional, status-aware, powerful"

MCRM:
  principle: "Scan, act, resolve"
  audience: "Hub technicians, call center agents"
  constraint: "Scan-first, status-driven, RTL operations"
  feel: "Operative, scanning, service-focused"

Wilson-eg:
  principle: "Browse, trust, buy"
  audience: "Egyptian home appliance shoppers"
  constraint: "Bilingual, trust-first, mobile-shopping"
  feel: "Creative, warm, premium Egyptian Gold"
```

## When to Use Which

| Scenario | Use |
|----------|-----|
| Customer-facing product browsing | **Catalog** (Hvar) or **Wilson** (other brand) |
| Cashier checkout & payment | **POS** — green, high-contrast |
| Internal operations dashboard | **OLD** — rose, data-dense, multi-role |
| Call center / hub scanning | **MCRM** — rose, status-driven, operative |
| Admin panel for e-commerce | **Wilson** admin — gold, CRUD-focused |
| POS backend (Laravel) | **POS tokens** in Blade |
| Third-party merchant portal | Hybrid — POS green + OLD layout |
| New brand wanting creative identity | **Wilson patterns** — doodles, grain, mesh |

## Key Insight

Wilson-eg is **not** an Hvar project — it's a separate brand. But it has the **most evolved
design system** in this workspace. Hvar projects are functionally complete; Wilson is
experientially rich. The ideal is somewhere in between.

**Wilson has 13 pattern innovations that Hvar has zero of.** The gap is not in functionality —
it's in **creative surface treatment.** Hvar could adopt any of these with minimal effort
(CSS-only patterns like grain, mesh, grids, reveals cost hours, not weeks).

---

*Five systems. Five purposes. One lesson: the creative layer is where brand lives.*
