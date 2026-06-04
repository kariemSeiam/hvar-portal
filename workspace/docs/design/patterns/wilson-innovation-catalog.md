# Wilson Egypt — Pattern Innovation Catalog

> What Wilson does that Hvar doesn't yet. 13 concrete patterns extracted from source code,
> each with implementation notes and Hvar applicability.

---

## The Innovation Gap

Wilson (3834 lines of CSS, 44 components, 24 customer pages) is more creatively ambitious
than any Hvar project. While Hvar projects are **functionally complete** (POS, CRM, ERP, e-commerce),
Wilson is **experientially rich** — it treats the browser as a canvas for brand expression.

This document extracts **every pattern** from Wilson's source and maps it to what Hvar could learn.

---

## Pattern 1: Hand-drawn SVG Doodle Background

**File:** `components/customer/ApplianceDoodleBg.tsx`  
**Lines:** ~280 lines of SVG path data

**What it does:**
22 hand-drawn appliance illustrations rendered as SVG paths, scattered across the viewport
at 0.22 opacity. Theme-aware stroke colors. Optional 30-second float animation.

**The appliances:**
refrigerator, stove/oven, vacuum cleaner, kettle, blender, TV, water cooler, stand mixer,
electric plug, snowflake, flame, water drop, stars (5), hearts (3), home icon, washing machine,
iron, lightning bolt, WiFi signal, speech bubble, Egyptian gold brackets « », thermometer,
plus scattered decorative elements (plus signs, dots, rings, wavy lines, sparkles).

**Theme system:**
- Light mode: warm brown (`#4A3728`) alternating with gold (`#FEB636`)
- Dark mode: ivory (`#F5F0E8`) alternating with gold
- Variant system: `'gold'` | `'white'` | `'mix'` (theme-aware)

**Key implementation details:**
```tsx
// Opacity controlled via prop, default 0.22
// pointer-events-none, select-none, aria-hidden
// preserveAspectRatio="xMidYMid slice" — fills viewport
// Each <g> has translate + rotate for organic scatter
// Animated: 30s ease-in-out infinite group translate
```

**Hvar applicability:** 🔥 Direct. Replace appliance doodles with Hvar-specific motifs:
- Air fryer, washing machine, refrigerator, TV, AC unit
- Egyptian decorative patterns (arabesque, geometric)
- Khayamiya (tentmaker appliqué) patterns for the premium line
- Brand icons: diamond, flame (heat), snowflake (cooling)

---

## Pattern 2: CSS Noise/Grain Texture Overlay

**File:** `globals.css` (`.grain-overlay::before`)  
**Stack:** pure CSS, SVG data URI

```css
.grain-overlay::before {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' ... %3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' ...");
  opacity: 0.04;  /* light */
  mix-blend-mode: overlay;
}
.dark .grain-overlay::before {
  opacity: 0.06;
}
```

**What it does:** Adds tactile paper-like texture to sections. Zero JS, zero network request,
zero bundle size. Works in all browsers.

**Hvar applicability:** 🔥 Direct. Hvar's premium brand needs this for hero sections, cards.
Use a custom noise seed that matches Hvar's brand texture.

---

## Pattern 3: Background Grid Systems

**File:** `globals.css` (`.bg-grid-dots` class) + CSS variables  
**Stack:** pure CSS, `radial-gradient` pattern

```css
.bg-grid-dots {
  --gs: var(--grid-size, 24px);
  background-image: radial-gradient(circle at center,
    hsl(var(--grid-dot) / var(--grid-dot-opacity, 0.35)) 1px,
    transparent 1px);
  background-size: var(--gs) var(--gs);
}
```

**5 grid patterns designed:**
| Pattern | Light | Dark |
|---------|-------|------|
| dots | Silver dots | Gold dots |
| lines | Soft silver lines | Muted gold lines |
| mesh | Gradient mesh + dots | Dark mesh + gold accent |
| hex | Hexagonal | Hex + gold nodes |
| cross | Plus/cross | Cross pattern |

Controlled by 4 CSS variables: `--grid-dot`, `--grid-line`, `--grid-size`, `--grid-dot-opacity`

**Hvar applicability:** 🔥 Direct. Hvar-POS could use subtle dot grids on transaction screens.
Hvar-Catalog could use hex or mesh for premium appliance displays. MCRM could use cross pattern
on scanning backgrounds. All themeable via CSS vars.

---

## Pattern 4: Gold Mesh Hero Overlay

**File:** `globals.css` (`.gold-mesh-hero::after`)  
**Stack:** pure CSS, `radial-gradient`

```css
.gold-mesh-hero::after {
  background: radial-gradient(
    ellipse 80% 60% at 50% 0%,
    hsl(var(--gold-500) / 0.08) 0%,
    hsl(var(--gold-400) / 0.03) 40%,
    transparent 70%
  );
}
```

**What it does:** Subtle gold radiance at the top of hero sections. 8% gold at center fading
to transparent. Creates a premium "spotlit" effect. Dark mode uses 12% gold.

**Hvar applicability:** 🔥 Direct. Replace gold with Hvar red (#d43533) for hero sections.
A red mesh at 8% opacity creates a premium appliance brand feel.

---

## Pattern 5: 3D Door-Swing Menu (RTL-aware)

**File:** `tailwind.config.ts` (keyframes) + `globals.css`  
**Stack:** CSS keyframes with 3D transformations

```css
@keyframes menuDrawerOpenRTL {
  from { transform: translateX(100%) rotateY(12deg); opacity: 0; }
  to   { transform: translateX(0) rotateY(0); opacity: 1; }
}
@keyframes menuDrawerOpenLTR {
  from { transform: translateX(-100%) rotateY(-12deg); opacity: 0; }
  to   { transform: translateX(0) rotateY(0); opacity: 1; }
}
```

**The Wilson Curve:** `cubic-bezier(0.22, 1, 0.36, 1)` — fast start, slow finish.
Used everywhere: menu, hero animations, card entries, scroll reveals.

**Hvar applicability:** 🔥 Direct. Every Hvar project uses RTL. The MCRM mobile menu,
Hvar-OLD sidebar collapse, Hvar-Catalog filter drawer — all benefit from this pattern.

---

## Pattern 6: Product Card Shine Effect

**File:** `globals.css` (`.product-card-creative::after`)  
**Stack:** pure CSS, `linear-gradient` sweep

```css
.product-card-creative::after {
  background: linear-gradient(105deg,
    transparent 0%, transparent 40%,
    hsl(var(--primary) / 0.06) 45%,
    hsl(var(--primary) / 0.12) 50%,
    hsl(var(--primary) / 0.06) 55%,
    transparent 60%, transparent 100%);
  opacity: 0;
  transform: translateX(-100%);
  transition: opacity 0.4s ease, transform 0.5s ease;
}
.product-card-creative:hover::after {
  opacity: 1;
  transform: translateX(100%);
}
```

**What it does:** On hover, a metallic gold shine sweeps diagonally across the card.
Subtle enough to feel premium, not gimmicky.

**Hvar applicability:** 🔥 Direct. Hvar-Catalog's product cards would benefit immensely.
MCRM's ticket cards could use a subtle brand-rose shine.

---

## Pattern 7: Scroll-Triggered Section Reveals

**File:** `globals.css` + `hooks/useInView.ts`  
**Stack:** Intersection Observer + CSS transitions

```css
.reveal-section {
  opacity: 0; transform: translateY(32px);
  transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.reveal-section.in-view {
  opacity: 1; transform: translateY(0);
}

/* Child stagger — nth-child delays */
.reveal-child { opacity: 0; transform: translateY(18px); }
.in-view .reveal-child { opacity: 1; transform: translateY(0); }

/* Scale variant for cards */
.reveal-scale { opacity: 0; transform: scale(0.95); }
.in-view .reveal-scale { opacity: 1; transform: scale(1); }
```

**3 variants:**
- `reveal-section` — section-level fade-up (32px)
- `reveal-child` — staggered children with automatic nth-child delay
- `reveal-scale` — cards scale in from 0.95

All respect `prefers-reduced-motion`.

**Hvar applicability:** 🔥 Direct. MCRM's dashboard, Hvar-Catalog's product grid,
Hvar-OLD's analytics page — all benefit from scroll reveals.

---

## Pattern 8: Product Viewport with Auto-Cycle

**File:** `components/customer/HeroCarousel.tsx` + `globals.css`  
**Stack:** React + CSS animations

```css
.hero-wilson-viewport {
  /* framed card: border, shadow, grain overlay */
  width: var(--hero-viewport-size);  /* clamp(12rem, 28vw, 20rem) */
  border-radius: 1rem;
  border: 2px solid hsl(var(--border));
}
.hero-wilson-viewport__img {
  animation: heroViewportBreath 20s ease-in-out infinite alternate;
}
@keyframes heroViewportBreath {
  from { transform: scale(1); }
  to   { transform: scale(1.02); }
}
```

**Carousel features:**
- 5500ms interval auto-advance
- Touch swipe detection (50px threshold)
- Dots with 44px touch targets
- Prev/Next buttons on tablet+
- Vision filter: blur(2px), saturate(55%), brightness(72%), contrast(112%), sepia(8%)
- Gradient overlay for text legibility
- Dark variant: stronger blur/brightness adjustments

**Hvar applicability:** 🔥 Direct. Hvar-Catalog needs this pattern for product detail galleries
and hero banners. The vision filter system could be adapted for Hvar's red brand tone.

---

## Pattern 9: CTA Trust Line

**File:** `globals.css` (`.cta-trust-line`)  
**Stack:** pure CSS

```css
.cta-trust-line {
  font-size: 0.8125rem;
  color: hsl(var(--hero-text-muted));
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1rem;
}
```

**What it does:** A single line under every CTA showing trust signals:
```
ضمان 5 سنوات · توصيل مجاني · صيانة 48 ساعة
5-Year Warranty · Free Delivery · 48h Service
```

**Hvar applicability:** 🔥 Direct. Hvar's research found that warranty/trust signals are
critical for Egyptian appliance buyers. Every CTA on hvarstore.com should include this.

---

## Pattern 10: Service Process Stepper with Connected Line

**File:** `globals.css` (`.service-steps-horizontal`)  
**Stack:** pure CSS, flexbox + gradient line

```css
.service-steps-horizontal::before {
  content: '';
  position: absolute;
  left: 12.5%; right: 12.5%;
  top: calc(2.75rem / 2 - 1px);
  height: 2px;
  background: linear-gradient(
    to right,
    hsl(var(--border)) 0%,
    hsl(var(--primary) / 0.4) 100%
  );
}
```

**Features:**
- Dots: 2.75rem circles with gold border + number
- Gradient gold line connecting centers of first→last dot
- Mobile: vertical layout with connector lines between dots
- RTL-aware gradient direction

**Hvar applicability:** 🔥 Direct. MCRM's service ticket state machines (R→HUB→DISPATCHED→CLOSED)
would benefit from this visual stepper. Hvar-OLD's order lifecycle too.

---

## Pattern 11: CTA Horizontal Action Bar

**File:** `globals.css` (`.product-detail-cta-bar`)  
**Stack:** pure CSS, flexbox

```css
.product-detail-cta-bar {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: fit-content;
  min-height: 44px;
  border-radius: 1rem;
  border: 1px solid hsl(var(--border));
  overflow: hidden;
  box-shadow: 0 1px 2px hsl(0 0% 0% / 0.04);
}
```

**Structure:**
| Zone | Width | Purpose |
|------|-------|---------|
| Quantity stepper | shrink | − / value / +, 44px touch targets |
| Add to Cart | flex-grow | Gold background, primary action |
| WhatsApp inquiry | shrink | Green (#25D366), icon + text |
| Remove (cart) | shrink | Destructive red icon |

**Responsive behavior:**
- Mobile (<375px): wraps to 2 rows, stepper full width
- Mobile (≥375px): single row, scrollable
- Tablet+: full horizontal bar

**Hvar applicability:** 🔥 Direct. Hvar-Catalog's product detail page, MCRM's service ticket
action panel, Hvar-POS's checkout terminal — all need this pattern.

---

## Pattern 12: Cart FAB (Mobile-Only)

**File:** `globals.css` (`.cart-fab`)  
**Stack:** pure CSS + safe-area aware

```css
.cart-fab {
  --cart-fab-size: 52px;
  position: fixed;
  z-index: 40;
  bottom: max(1.25rem, calc(env(safe-area-inset-bottom) + 0.5rem));
  width: var(--cart-fab-size);
  height: var(--cart-fab-size);
  border-radius: 50%;
  background: hsl(var(--primary));
  box-shadow: 0 4px 14px hsl(var(--primary) / 0.35), ...;
}
```

**Features:**
- Gold circle FAB, fixed bottom
- Badge with item count (inset shadow, border)
- Direction-aware positioning (RTL: left, LTR: right)
- Hidden on desktop (≥1024px)
- Hover: brightness + deeper shadow
- Active: scale(0.97)
- Dark mode variant

**Hvar applicability:** 🔥 Direct. All Hvar projects need mobile-optimized action FABs.
MCRM: call center quick action, Hvar-OLD: new ticket, Hvar-Catalog: cart.

---

## Pattern 13: Menu Drawer Staggered Body Reveal

**File:** `globals.css` (`.menu-drawer-body > *`)  
**Stack:** CSS keyframes + nth-child delays

```css
@keyframes menu-drawer-item-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
[data-state='open'] .menu-drawer-body > *:nth-child(1) { animation-delay: 80ms; }
[data-state='open'] .menu-drawer-body > *:nth-child(2) { animation-delay: 140ms; }
/* ...continues through nth-child(9+) at 560ms */
```

**Additional menu features:**
- Doodle pattern overlay on drawer background (0.12 opacity)
- Section labels with uppercase + letter-spacing
- Gold border-start on active nav items (3px)
- RTL-aware link styles
- WhatsApp + Call action buttons in bottom of drawer
- Logout with destructive red styling

**Hvar applicability:** 🔥 Direct. All Hvar projects with mobile navigation should
adopt this staggered entrance. The doodle overlay on menu is unique and brand-building.

---

## Bonus: Environment-Brand Alignment

Wilson's best design decision: **the theme reflects the brand promise.**

| Light (Desert Luxe) | Dark (Night Luxe) |
|-----|-----|
| Papyrus cream (42 18% 97%) | Warm charcoal (240 10% 5%) |
| Warm, calm, premium | Deep, elegant, immersive |
| Sun-baked desert feeling | Cool evening feeling |
| Gold pops against warm | Gold glows against dark |

The environment IS the brand. Not a default dark/light toggle — a named, branded experience.

**Hvar applicability:** 🔥 Critical. Hvar needs named themes:
- "Hvar Red Luxe" (light) — warm ivory with deep red accents
- "Hvar Night" (dark) — charcoal with glowing red

---

## Priority Map for Hvar

| Pattern | Effort | Impact | Best for |
|---------|--------|--------|----------|
| 1. Doodle BGs | Medium (SVG design) | High | Hvar-Catalog, hvarstore.com |
| 2. Grain texture | Low (CSS only) | Medium | All projects |
| 3. Grid system | Low (CSS only) | Medium | All projects |
| 4. Gold/red mesh | Low (CSS only) | High | All hero sections |
| 5. 3D menu | Low (CSS only) | Medium | All mobile menus |
| 6. Card shine | Low (CSS only) | High | Hvar-Catalog product cards |
| 7. Scroll reveals | Low (CSS + hook) | Medium | All projects |
| 8. Product viewport | Medium (React) | High | Hvar-Catalog |
| 9. Trust line | Low (CSS only) | High | hvarstore.com, MCRM |
| 10. Service stepper | Medium (CSS) | High | MCRM, Hvar-OLD |
| 11. CTA bar | Medium (React) | High | All e-commerce |
| 12. Cart FAB | Low (CSS + React) | Medium | All mobile |
| 13. Staggered menu | Low (CSS only) | Medium | All mobile |
| **Bonus.** Named themes | Low (CSS vars) | **Critical** | All projects |
