# هفارستور — Design System
> Canonical reference. Synthesized from: DESIGN_DIRECTIONS.md, wilson-innovation-catalog, hvar-brand-research, hvar-ecosystem-map, design-language study, all project DESIGN.md files.
> Last updated: 2026-06-05

---

## Identity

**Brand:** هفار (HVAR) — Egyptian DTC kitchen appliance brand  
**Tagline:** هفار اختيارك الأول في المطبخ  
**Audience:** Egyptian women/homemakers, COD-first buyer, social-commerce purchase journey  
**Positioning:** Premium feel + value trust. Neither a discount catalog nor a luxury brand.

**The strategic gap we fill:** First Egyptian value-appliance brand that *feels* premium while keeping the COD-inspect-before-pay, 2–3yr warranty, free shipping mechanics that close the Egyptian sale.

---

## The Two Themes (named brand identities)

| Theme | Arabic | Vibe | When |
|-------|--------|------|------|
| **هفار الأحمر** | Light | Warm ivory kitchen, editorial warmth, daytime ritual | Default / light mode |
| **هفار الليل** | Dark | Warm charcoal evening, glowing red, cozy appliance glow | Dark mode |

Neither is a generic OS dark/light — they are **named brand experiences**.

---

## Color Tokens

### هفار الأحمر — Light Mode

```css
--c-bg:           #fbf7f1;   /* warm ivory canvas — never sterile white */
--c-surface:      #ffffff;   /* card / component surface */
--c-surface-2:    #f5f0e8;   /* secondary (footer, alternate rows) */
--c-ink:          #1c1917;   /* warm near-black — primary text */
--c-ink-muted:    #57534e;   /* secondary text */
--c-ink-faint:    #8c7d73;   /* placeholder, disabled, label */
--c-border:       #e7e0d6;   /* standard border — warm beige */
--c-border-strong:#c8b8a6;   /* emphasis border, dividers */

--c-brand:        #d43533;   /* Hvar red — primary action */
--c-brand-hover:  #b91c1c;   /* red hover / pressed */
--c-brand-tint:   #fff0f0;   /* red tinted wash */
--c-brand-glow:   rgba(212, 53, 51, 0.12); /* red glow shadow */

--c-brass:        #c8893b;   /* brass — premium warmth accent */
--c-brass-tint:   #fdf3e7;   /* brass wash */

--c-trust:        #16a34a;   /* COD / warranty / WhatsApp / success */
--c-shadow-card:  0 1px 3px rgba(0,0,0,0.06), 0 8px 20px rgba(212,53,51,0.06);
```

### هفار الليل — Dark Mode

```css
--c-bg:           #131110;   /* warm charcoal — hsl(20° 10% 7%) */
--c-surface:      #1f1c18;   /* card surface — clear elevation above bg */
--c-surface-2:    #27231f;   /* navbar, drawer, popovers */
--c-ink:          #f0ebe3;   /* warm ivory text — not cold white */
--c-ink-muted:    #a09890;   /* warm taupe muted */
--c-ink-faint:    #706660;   /* very muted */
--c-border:       #322e28;   /* visible warm border */
--c-border-strong:#453e37;   /* strong border */

--c-brand:        #e85a58;   /* glowing red — hsl(2° 75% 63%) — brighter for dark */
--c-brand-hover:  #d43533;   /* red hover in dark = base red */
--c-brand-tint:   rgba(232, 90, 88, 0.10);
--c-brand-glow:   rgba(232, 90, 88, 0.16);

--c-brass:        #d4a050;   /* slightly lighter brass for dark bg */
--c-brass-tint:   rgba(212, 160, 80, 0.12);

--c-trust:        #22c55e;
--c-shadow-card:  0 1px 3px rgba(0,0,0,0.3), 0 8px 20px rgba(232,90,88,0.08);
```

### Semantic Status Colors (both modes)

| Token | Value | Use |
|-------|-------|-----|
| success | `#16a34a` / dark: `#22c55e` | Delivered, warranty, COD |
| warning | `#d97706` / dark: `#f59e0b` | Low stock, pending |
| danger | `#dc2626` / dark: `#ef4444` | Out of stock, error |
| info | `#0284c7` / dark: `#38bdf8` | Info, tracking |

---

## Typography

| Role | Font | Weights | Notes |
|------|------|---------|-------|
| Arabic display / UI | **Cairo** | 400, 600, 700, 900 | All headings, nav, body copy |
| Prices / numbers | **Inter** | 400, 500, 600 | `font-variant-numeric: tabular-nums` |
| Order codes / SKUs | **JetBrains Mono** | 500 | Tracking numbers, refs |

**Scale (fluid):**
```
hero:   clamp(2.2rem, 4vw + 1rem, 3.8rem) / weight 900
h1:     clamp(1.8rem, 3vw + 0.5rem, 3rem) / weight 700
h2:     clamp(1.4rem, 2vw + 0.5rem, 2.2rem) / weight 700
h3:     clamp(1.1rem, 1.5vw, 1.5rem) / weight 600
body:   clamp(0.9rem, 1.2vw, 1rem) / weight 400 / leading 1.6
small:  0.875rem / leading 1.5
xs:     0.75rem
```

**RTL rules:**
- `dir="rtl"` on `<html>`, `lang="ar"`
- Logical CSS only: `margin-inline`, `padding-inline`, `inset-inline`
- Never hard left/right in CSS
- Arabic headings weight += 100 vs English equivalent

---

## Motion System

**The Hvar Curve:** `cubic-bezier(0.22, 1, 0.36, 1)` — fast start, slow settle. Used everywhere.

| Type | Duration | Curve | Use |
|------|----------|-------|-----|
| Micro | 150ms | ease | Button press, icon state |
| Interaction | 300ms | Hvar curve | Hover, expand |
| Reveal | 500–600ms | Hvar curve | Scroll entrance |
| Hero | 0.6s staggered | Hvar curve | Page load |
| Menu drawer | 400ms | Hvar curve | 3D door-swing |

**Respect `prefers-reduced-motion`** — all animations degraded to none.

---

## Wilson Pattern Usage (13 patterns → Hvar)

| # | Pattern | Hvar implementation |
|---|---------|---------------------|
| P1 | Doodle BGs | Hvar appliance SVGs (blender, air fryer, iron, kettle, chopper) at 0.04–0.06 opacity |
| P2 | Grain texture | `::before` SVG fractalNoise, 0.04 light / 0.06 dark, `mix-blend-mode:overlay` |
| P3 | Grid system | Dot grid on catalog pages, red-tinted |
| P4 | Red mesh hero | `radial-gradient` 8% red at hero top, 12% dark |
| P5 | 3D door-swing | RTL `rotateY(12deg)` → 0, 400ms Hvar curve |
| P6 | Card shine | `::after` 105° diagonal gradient sweep, red-tinted |
| P7 | Scroll reveals | IntersectionObserver, 3 variants: section (600ms), child (500ms), scale |
| P8 | Product viewport | Auto-cycle 5.5s, 20s breath animation, vision filter |
| P9 | Trust line | `.trust-line` under every CTA: ضمان · شحن مجاني · افحص قبل الدفع |
| P10 | Service stepper | `::before` gradient line connecting state dots, RTL-aware |
| P11 | CTA action bar | [qty −/+] [أضف للسلة] [واتساب] [إزالة], 44px touch |
| P12 | Cart FAB | Fixed bottom-start, badge, `safe-area-inset-bottom` aware |
| P13 | Staggered menu | `nth-child` animation delays in drawer |

---

## Component Patterns

### Product Card
- Rounded: `1rem` (16px)
- Shadow light: `--c-shadow-card`
- Shadow dark: slight red tint
- Hover: `-4px` Y lift + enhanced shadow
- Shine: P6 diagonal sweep on hover
- Placeholder bg: gradient `--c-brand-tint → --c-bg` with "هـ" monogram at 15% opacity
- Discount badge: `--c-brand` bg, white text, top-end corner
- Out-of-stock: overlay + مuted text

### Trust Architecture (at every CTA)
```
ضمان ٢-٣ سنوات  ·  شحن مجاني  ·  افحص قبل الدفع  ·  تقسيط بدون فوائد
```
Color: `--c-trust` icons + `--c-ink-muted` text

### Navbar
- Sticky, `backdrop-blur-md`, bg: `--c-surface-2` in dark / `#fff/95` in light
- Logo: "هفار" in `--c-brand` + "ستور" in `--c-ink-faint`
- Active link: `--c-brand` text + `--c-brand-tint` bg
- Mobile drawer: 3D door-swing (P5), doodle overlay (P1)

### Hero
- Bg: `--c-bg` with P4 red mesh + P2 grain + P1 doodle
- Stage orb: morphing `border-radius` shape, red gradient
- Floating bob cards: `--c-surface` bg, `--c-border` border
- Stats: Inter tabular-nums, `--c-ink` value + `--c-ink-faint` label

### ChefStrip
- Always-dark: `#1c1917` light / `#0f0e0d` dark
- P2 grain overlay
- Red glow from bottom-left
- Quote in white, attribution in `--c-ink-muted`

### Footer
- Always-dark: same surface as ChefStrip
- `--c-ink-muted` body, `--c-trust` check icons
- WhatsApp CTA: `rgba(#25D366, 0.10)` bg

---

## Spacing / Radius

```
radius-sm:   6px     (inputs, tags)
radius-md:   10px    (buttons)
radius-lg:   16px    (cards) ← primary
radius-xl:   20px    (hero card, panels)
radius-2xl:  24px    (drawers)
radius-full: 9999px  (pills, badges, FAB)
```

---

## Trust Signals (COD Architecture)
Place at every risk moment — CTA, checkout, cart, order confirm:

| Signal | Icon color | Text |
|--------|-----------|------|
| ضمان ٢-٣ سنوات | `--c-trust` | على كل منتج |
| شحن مجاني | `--c-trust` | توصيل لباب البيت |
| افحص قبل الدفع | `--c-trust` | بدون مخاطرة |
| تقسيط بدون فوائد | `--c-brass` | فاليو · سهولة · أمان |

---

## Key Decisions (locked)

1. Cairo for all Arabic — not Almarai/Tajawal (already installed, consistent with ecosystem)
2. Warm ivory `#fbf7f1` canvas — never cold white  
3. Warm charcoal `#131110` dark bg — never cold `#000` or `#111`
4. Brand red `#d43533` light / `#e85a58` dark (glowing variant)
5. No emojis anywhere — SVG icons only
6. Logical CSS props only — no hard left/right
7. `prefers-reduced-motion` on every animation
8. ERP is authority — never guess stock
