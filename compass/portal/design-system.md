# Design System — hvarstore.com

> Complete source of truth for any developer building a UI component. Real token names, real values, real CSS. The WHY behind every decision is here; the rules are absolute.

---

## The Direction: "المطبخ الدافئ × هفار لوكس"

Warm Kitchen × Hvar Luxe. Every design decision answers to this phrase.

**The Warm Kitchen axis:** the page exists in the same warm light as the kitchen photography. Ivory canvas, not clinical white. Arabic display type that carries weight and warmth. Content that feels domestic and real.

**The Hvar Luxe axis:** more considered than any competitor in this segment. Named themes. A precise token system. Grain texture. The ambient glow. Card depth. Motion with a signature. These are not decorative — they are the signals that separate Hvar from the loud-orange discount aesthetics of the competition.

**Resolving the tension in every component decision:**
- A trust badge: quality assurance signal, not a coupon. Heavy enough type, enough space, enough weight.
- A product card: editorial product feature, not a catalog entry. Warm photography, comfortable spacing, thoughtful hierarchy.
- An error message: help, not a system complaint.

---

## CSS Token System

Every value in the design system has a named CSS variable. No hardcoded colors, no hardcoded values, no magic numbers. Variable names carry their intent.

### Brand Colors (HSL channel values)

```css
/* Use as: hsl(var(--hvar-red-600)) */
--hvar-red-50:  6 70% 97%;        /* #FCF0EF — alert backgrounds, badge tints */
--hvar-red-100: 4 73% 92%;        /* soft tint wash */
--hvar-red-200: 3 74% 84%;        /* light interactive surface */
--hvar-red-300: 2 72% 72%;        /* decorative, disabled states */
--hvar-red-400: 1 68% 62%;        /* muted interactive */
--hvar-red-500: 1 66% 56%;        /* lighter brand, hover on dark */
--hvar-red-600: 1 64% 51%;        /* #d43533 — PRIMARY: CTAs, active nav, key highlights */
--hvar-red-700: 1 60% 42%;        /* hover + pressed states on red elements */
--hvar-red-800: 1 56% 34%;        /* deep red, rarely used directly */
--hvar-red-900: 1 52% 26%;        /* near-black red, text on light tint */

--flame-600:    17 72% 41%;       /* #B3471D — burnt flame: text-safe accent on light canvas */
--flame-500:    14 80% 55%;       /* #E8552E — bright flame: decorative only (sparks, lines, dots) */
--flame-400:    21 100% 69%;      /* #FF9A62 — flame on dark canvas (text-safe in dark theme) */

--trust-green:  142 71% 38%;      /* COD, WhatsApp buttons, success — NEVER decorative */
--trust-green-soft: 142 60% 94%; /* success backgrounds */
```

**Intent rules:**
- `--hvar-red-600`: primary CTAs, active navigation, key highlights. One in ten visual elements, maximum.
- `--hvar-red-700`: hover and pressed states on red elements only. Never a surface or decorative color.
- `--hvar-red-50`: alert backgrounds, badge tints — use when red surface is needed but full saturation would overwhelm.
- `--flame-600` / `--flame-400`: installment badges, price highlights, premium callouts, eyebrow labels — burnt on light canvas, bright on dark. Replaces the retired brass/gold (ratified 2026-06-10): the secondary accent is the fire's own hot edge, never a foreign metal.
- `--flame-500`: decorative flame only — sparks, accent lines, line-art dots, star fills. Never body text on light canvas.
- `--trust-green`: functional trust signals only — COD confirmation, WhatsApp, success states.

### Canvas and Surface Tokens

```css
/* ── هفار الأحمر — Light Theme (:root) ── */
--bg:            36 38% 97%;      /* #FBF7F1 — warm ivory page canvas */
--surface:       0 0% 100%;       /* white cards on warm canvas */
--surface-soft:  36 30% 98%;      /* slightly warmer card variant */
--surface-raised: 0 0% 100%;      /* elevated surfaces: modals, dropdowns */
--ink:           20 14% 12%;      /* #1E1915 — warm near-black text */
--ink-secondary: 20 10% 32%;      /* mid-level text, section labels */
--ink-muted:     20 8% 42%;       /* secondary text, labels, captions */
--ink-disabled:  20 5% 62%;       /* disabled state text */
--border:        30 16% 88%;      /* #E5DDD4 — dividers, card borders */
--border-strong: 28 18% 78%;      /* emphasis borders, active inputs */
--hairline:      32 14% 93%;      /* barely-there structural lines */

/* ── هفار الليل — Dark Theme (.dark on <html>) ── */
/* All --c-* tokens are overridden inside .dark {} */
--bg:            20 10% 7%;       /* #130F0C — warm charcoal canvas */
--surface:       20 9% 11%;       /* #1C1713 — slightly lighter surface */
--surface-soft:  20 8% 14%;       /* raised surface on dark */
--surface-raised: 22 8% 17%;      /* modals, dropdowns in dark */
--ink:           36 30% 94%;      /* #F5EFE6 — ivory text */
--ink-secondary: 32 18% 72%;      /* secondary ivory */
--ink-muted:     30 8% 62%;       /* muted ivory */
--ink-disabled:  28 6% 45%;       /* disabled in dark */
--border:        24 8% 20%;       /* subtle borders on dark */
--border-strong: 24 10% 28%;      /* emphasis borders in dark */
--hairline:      22 7% 16%;       /* hairlines in dark */

/* Brand red — slightly more luminous in dark mode */
--hvar-red-600:  2 75% 58%;       /* glowing ember, not flat red */
```

### System Tokens

```css
/* ── Geometry ── */
--radius:         1rem;           /* 16px — soft, premium, the default */
--radius-sm:      0.625rem;       /* 10px — badges, chips, inputs, tags */
--radius-xs:      0.375rem;       /* 6px — inline chips, very small elements */
--radius-lg:      1.5rem;         /* 24px — hero cards, feature blocks */
--radius-xl:      2rem;           /* 32px — large modal, hero overlay */
--radius-full:    9999px;         /* pill — badges, FABs, avatar circles */

/* ── Motion ── */
--curve:          cubic-bezier(0.22, 1, 0.36, 1);  /* the Hvar signature curve */
--duration-fast:  150ms;          /* micro-interactions: icon swap, check */
--duration-base:  250ms;          /* hover states, focus rings */
--duration-enter: 400ms;          /* element entering the DOM */
--duration-modal: 300ms;          /* overlays, drawers */
--duration-reveal: 700ms;         /* scroll-triggered reveals */

/* ── Atmosphere ── */
--grain:          0.04;           /* grain overlay opacity — light mode */
--grain-dark:     0.06;           /* grain overlay opacity — dark mode */
--mesh-red:       0.08;           /* ambient glow opacity — light mode */
--mesh-red-dark:  0.12;           /* ambient glow opacity — dark mode */

/* ── Elevation ── */
--shadow-xs:      0 1px 2px hsl(0 0% 0% / .05);
--shadow-sm:      0 2px 4px hsl(0 0% 0% / .06);
--shadow-card:    0 1px 2px hsl(0 0% 0% / .04),
                  0 8px 24px hsl(var(--hvar-red-600) / .06);
--shadow-card-hover: 0 2px 4px hsl(0 0% 0% / .06),
                  0 12px 32px hsl(var(--hvar-red-600) / .10);
--shadow-modal:   0 4px 6px hsl(0 0% 0% / .08),
                  0 20px 48px hsl(0 0% 0% / .20);
--shadow-fab:     0 4px 14px hsl(var(--hvar-red-600) / .35),
                  0 8px 24px hsl(0 0% 0% / .15);

/* ── Z-index layers ── */
--z-base:         0;
--z-raised:       10;
--z-sticky:       100;
--z-overlay:      200;
--z-modal:        300;
--z-fab:          40;
--z-toast:        400;
--z-glow:         0;              /* ambient glow — behind content */
```

**Shadow design intent:** the `0 8px 24px hsl(var(--hvar-red-600) / .06)` layer is the brand's signature in depth. Cards cast a faint red-tinted shadow, connecting card depth to the ambient glow system. At 6% opacity it is invisible to casual inspection but creates the sense of a warm-lit space.

**The Wilson curve:** `cubic-bezier(0.22, 1, 0.36, 1)`. Slow approach, confident fast completion — the sensation of a quality mechanism clicking into place. Use everywhere as `var(--curve)`. Never introduce a different easing without updating this token.

---

## Theme System

### Two Named Themes

**هفار الأحمر** (Light) — `:root` base styles. The warm, daylit kitchen. Ivory canvas, deep red brand color, natural light feel.

**هفار الليل** (Dark) — `.dark` class on `<html>`. The kitchen at night. Warm charcoal, glowing ember red, ivory text.

These are not generic "light/dark" — they are named brand experiences. The naming matters: it signals that each theme is intentional, not just an inversion.

### CSS Class Strategy

Dark mode is toggled via the `.dark` class on `<html>`. Not `prefers-color-scheme` auto-switching. The user explicitly chooses through the ThemeToggle component, persisted to `localStorage`.

**Why class, not `prefers-color-scheme`:**
- User agency: some users prefer dark OS but light for shopping (product photography reads better in light).
- Design control: CSS class + localStorage, initialized in a `<script>` tag before render, eliminates flash of incorrect theme.

### ThemeToggle Implementation

Hydrates with `client:load`. Reads `localStorage` on mount. Sets `.dark` class on `<html>`. Persists preference. RTL-aware positioning via logical CSS properties.

### Full Token Comparison Table

| Token | هفار الأحمر (Light) | هفار الليل (Dark) |
|-------|---------------------|-------------------|
| `--bg` | `hsl(36 38% 97%)` — ivory | `hsl(20 10% 7%)` — charcoal |
| `--surface` | `hsl(0 0% 100%)` — white | `hsl(20 9% 11%)` — dark |
| `--ink` | `hsl(20 14% 12%)` — near-black | `hsl(36 30% 94%)` — ivory |
| `--ink-muted` | `hsl(20 8% 42%)` | `hsl(30 8% 62%)` |
| `--border` | `hsl(30 16% 88%)` | `hsl(24 8% 20%)` |
| `--hvar-red-600` | `1 64% 51%` | `2 75% 58%` (brighter) |
| `--grain` | `0.04` | `0.06` |
| `--mesh-red` | `0.08` | `0.12` |
| `--shadow-card` | Red-tinted at 6% | Red-tinted at 12% |

### Why Dark Mode Red Shifts

Light mode: `hsl(1 64% 51%)`. Dark mode: `hsl(2 75% 58%)`. On a dark canvas, straight `#d43533` reads harsh — too much contrast, insufficient warmth. The dark mode red is lighter and more saturated so it reads as glowing rather than flat. The 1-degree hue shift toward orange very slightly warms it. The difference between "this looks right" and "this seems slightly off."

### Testing Both Themes

Every component must be designed and tested in both themes before it is complete. If a component is added and هفار الليل breaks it (contrast failure, layout collapse, color bleeding), the component is not done.

---

## Typography Scale

All values apply to Cairo (Arabic) and Inter (numeric/English). Arabic line heights are looser than Latin — Cairo's letterforms need more vertical breathing room.

### Size Scale

| Tailwind token | rem | px | Line height | Use |
|----------------|-----|-----|-------------|-----|
| `text-xs` | 0.75rem | 12px | 1.5 | Legal, fine print, tiny labels |
| `text-sm` | 0.875rem | 14px | 1.6 | Secondary labels, captions |
| `text-base` | 1rem | 16px | 1.75 | Body text, descriptions, form copy |
| `text-lg` | 1.125rem | 18px | 1.7 | Lead copy, intro paragraphs |
| `text-xl` | 1.25rem | 20px | 1.6 | Card headings, section subheads |
| `text-2xl` | 1.5rem | 24px | 1.4 | Section headers |
| `text-3xl` | 1.875rem | 30px | 1.3 | Page headers, feature headings |
| `text-4xl` | 2.25rem | 36px | 1.2 | Large display — desktop |
| `text-5xl` | 3rem | 48px | 1.1 | Hero display — desktop only |

**Mobile scale:** one step down for display text below 640px. `text-5xl` → `text-4xl` for hero. `text-4xl` → `text-3xl` for page headers. Body and label sizes do not scale down.

**Fluid sizes with clamp (preferred for display headings):**
```css
--text-hero: clamp(2rem, 5vw + 1rem, 3rem);     /* hero headline */
--text-display: clamp(1.5rem, 3vw + 1rem, 2.25rem); /* page header */
--text-section: clamp(1.25rem, 2vw + 0.75rem, 1.875rem); /* section header */
```

### Cairo Weight Mapping

| Weight | Name | Tailwind | Use |
|--------|------|----------|-----|
| 400 | Regular | `font-normal` | Body text, secondary copy |
| 600 | SemiBold | `font-semibold` | Labels, badges, UI elements |
| 700 | Bold | `font-bold` | Card headings, navigation, buttons |
| 900 | Black | `font-black` | Hero display, brand moments |

### Font Stacks

```css
/* Arabic + UI — primary stack */
font-family: 'Cairo', 'Tajawal', system-ui, sans-serif;

/* English numbers and price display */
font-family: 'Inter', system-ui, sans-serif;

/* Code / SKU / model numbers */
font-family: 'JetBrains Mono', 'Roboto Mono', ui-monospace, monospace;
```

**Prices always use:** `font-variant-numeric: tabular-nums` (Tailwind: `tabular-nums`). Fixed-width digits — price lists do not visually shift as numbers change.

**Google Fonts import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap');
```

---

## Spacing System

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Icon-to-label gap, hairline internal spacing |
| `space-2` | 8px | Badge padding, chip internal |
| `space-3` | 12px | Small component padding, compact lists |
| `space-4` | 16px | Standard component padding, default card internal |
| `space-6` | 24px | Between components in a section |
| `space-8` | 32px | Section internal — between header and content |
| `space-12` | 48px | Between major page sections |
| `space-16` | 64px | Hero section padding, large gap |
| `space-24` | 96px | Maximum section separation on large screens |

**The density principle:** content inside a component uses small spacing (space-2 through space-4). Space between components uses medium spacing (space-6, space-8). Space between page sections uses large spacing (space-12 through space-24). Never invert — a section with huge internal padding and tiny gap to the next reads upside-down.

---

## Component Principles

These apply to every component before any component-specific decisions.

### 44px Minimum Touch Target

iPhone HIG and Android Material both establish 44px / 48dp as the minimum comfortable touch target. For a mobile-primary audience using large Android phones with thumbs, this is non-negotiable. The visual element can be smaller — add invisible padding to reach the target:

```css
.small-button {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### Every Component Has All Interaction States

Every button, link, card, and form element must define:
- Default (resting)
- Hover (pointer device)
- Focus (keyboard — accessibility requirement, not optional)
- Active/pressed
- Disabled (where applicable)

The focus state must be visible. `outline: none` without a replacement is an accessibility failure.

### RTL Logical Properties

Page root has `dir="rtl"`. Every text component, every directional icon (arrows, chevrons), every layout with LTR/RTL implications must respect this. Use logical CSS:

```css
/* Use these */
padding-inline-start: 1rem;   /* not padding-left */
margin-inline-end: 0.5rem;    /* not margin-right */
border-inline-start: ...;     /* not border-left */
inset-inline-end: 1rem;       /* not right */

/* For directional icons */
[dir="rtl"] .chevron-right { transform: scaleX(-1); }
```

Test RTL by reading as an Arabic speaker: start from the right, not the left.

### Every Animation Uses `var(--curve)`

The Wilson curve is used for all transitions and animations. Every new animation uses `var(--curve)` as its timing function and has a `prefers-reduced-motion` fallback.

### Button Variant Reference

| Variant | Background | Text | Border | Use |
|---------|-----------|------|--------|-----|
| primary | `hsl(var(--hvar-red-600))` | white | none | Primary CTA |
| secondary | `--surface` | `--ink` | `--border` | Secondary action |
| outline | transparent | `--hvar-red-600` | `--hvar-red-600` | Tertiary |
| ghost | transparent | `--ink` | none | In-context action |
| danger | `--hvar-red-600` at 10% | `--hvar-red-700` | `--hvar-red-300` | Destructive (confirm) |
| ghost-danger | transparent | `--hvar-red-600` | none | Logout, delete |
| success | `--trust-green` | white | none | COD confirm, success |
| icon-only (44px) | varies | icon | optional | All icon buttons |

---

## The Ambient Kiln Glow

The living ember. The single most distinctive visual element in hvarstore.com.

### Technical Implementation

```css
html::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: var(--z-glow);   /* 0 — behind content, above base canvas */
  background:
    radial-gradient(
      ellipse 60% 50% at 80% 5%,
      hsl(var(--hvar-red-600) / var(--mesh-red)) 0%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 50% 40% at 10% 60%,
      hsl(var(--flame-500) / calc(var(--mesh-red) * 0.7)) 0%,
      transparent 60%
    );
}

/* Light mode: subtle, warm */
:root {
  --mesh-red: 0.08;
}

/* Dark mode: more present, atmospheric */
.dark {
  --mesh-red: 0.12;
}
```

Two gradient sources: ember red (top-right, 80% / 5%) + warm flame (bottom-left, 10% / 60%). The flame gradient runs at 70% of the red opacity (`mesh-red * 0.7`), creating the sensation of a secondary warm light source.

### Design Purpose

The ambient glow answers: "Why isn't Hvar red harsh?" Hvar red (`#d43533`) is saturated. Used flat, it would feel like an urgency color — alarm, sale badge, warning. The glow transforms it into a warm light source, the ember of a kitchen fire. Every page is lit by this glow.

This is not optional polish. It is the system that makes the brand red work.

**Rule:** never use brand red as a flat decorative element without the ambient glow present. Flat brand red without glow context is a different color experience.

### Glow in Dark Mode

In هفار الليل, the glow becomes more perceptible. Darker canvas allows ember red to be more atmospheric — the charcoal room lit by a warm fire. `--mesh-red` increases from `0.08` to `0.12`. The result: dark mode feels warm and alive, not cold and techy.

---

## Grain Texture

Pure CSS, zero network request, zero bundle size.

### Implementation

```css
.grain-overlay {
  position: relative;
  isolation: isolate;
}

.grain-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  opacity: var(--grain);           /* 0.04 light / 0.06 dark */
  mix-blend-mode: overlay;
  border-radius: inherit;
}
```

Apply `.grain-overlay` to:
- Hero sections
- Cards on dark surfaces
- Premium badge backgrounds
- Section headers with strong brand presence

The `mix-blend-mode: overlay` ensures grain never muddy the color — it adds tactile texture while the underlying color shows through correctly.

---

## Wilson Pattern System

The 13 Wilson patterns are the ambient and interaction layer of the visual system. Extracted from Wilson Egypt's design system (3,834 lines of CSS, 44 components, 24 customer pages) — the most creatively evolved system in the Hvar workspace.

### The Base Atmosphere (Always On)

These patterns are always present — not triggered by interaction.

| # | Pattern | What it is | CSS class | Where it applies |
|---|---------|-----------|-----------|-----------------|
| P1 | Appliance Doodle BG | 22 SVG appliance motifs at `opacity: 0.18–0.22`, theme-aware stroke, `pointer-events: none` | `.doodle-bg` | Hero section, mobile nav drawer, footer |
| P2 | Grain Texture | `::before` SVG fractalNoise, `mix-blend-mode: overlay`, `opacity: var(--grain)` | `.grain-overlay` | Hero, cards on dark, premium surfaces |
| P4 | Red Mesh Hero | Radial gradient at 8% opacity — Hvar red at top, flame at bottom-left | `html::after` (global) or `.mesh-hero-red::after` | Hero sections, category headers |

**These three together (P1 + P2 + P4):** create the base atmosphere. Mesh adds warmth through color. Grain adds texture. Doodles add brand-specific cultural context — kitchen appliances rendered as art. The result: a hero that belongs to a brand, not a template.

**P1 CSS (doodle background):**
```css
.doodle-bg {
  position: relative;
  overflow: hidden;
}
.doodle-bg > .doodle-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  select: none;
  aria-hidden: true;
  opacity: 0.20;
}
/* Light mode: warm brown strokes alternating with brand red */
.doodle-layer svg path { stroke: #4A2820; }
.doodle-layer svg path:nth-child(even) { stroke: hsl(var(--hvar-red-600)); }
/* Dark mode: ivory strokes */
.dark .doodle-layer svg path { stroke: #F5EFE8; }
/* Optional float animation — respects reduced-motion */
@media (prefers-reduced-motion: no-preference) {
  .doodle-layer { animation: doodle-float 30s ease-in-out infinite alternate; }
  @keyframes doodle-float {
    from { transform: translateY(0); }
    to   { transform: translateY(-12px); }
  }
}
```

Hvar appliance motifs to use: air fryer, washing machine, refrigerator, kettle, blender, iron, TV, vacuum cleaner, snowflake, flame, water drop, diamond mark.

**P4 CSS (red mesh hero):**
```css
.mesh-hero-red::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 80% 60% at 50% 0%,
    hsl(var(--hvar-red-600) / 0.08) 0%,
    hsl(var(--hvar-red-500) / 0.03) 40%,
    transparent 70%
  );
}
.dark .mesh-hero-red::after {
  background: radial-gradient(
    ellipse 80% 60% at 50% 0%,
    hsl(var(--hvar-red-600) / 0.12) 0%,
    hsl(var(--hvar-red-500) / 0.05) 40%,
    transparent 70%
  );
}
```

### The Interaction Layer (Applied per Component)

| # | Pattern | Trigger | CSS class | Applied to |
|---|---------|---------|-----------|-----------|
| P5 | 3D Door-Swing Menu | Mobile nav open | `.menu-drawer-rtl` / `.menu-drawer-ltr` | Mobile nav drawer |
| P6 | Card Shine | Hover | `.product-card-creative` | Product cards, ticket cards |
| P7 | Scroll Reveals | IntersectionObserver | `.reveal-section` / `.reveal-child` / `.reveal-scale` | Page sections, product grids |
| P8 | Product Viewport | Auto-cycle (5500ms) | `.hero-viewport` | PDP image gallery |
| P9 | CTA Trust Line | Static (below CTA) | `.cta-trust-line` | Every primary CTA |
| P10 | Service Stepper | State data | `.service-steps-horizontal` | Ticket state timeline |
| P11 | CTA Action Bar | Always visible on PDP | `.product-detail-cta-bar` | Qty + Cart + WhatsApp + Remove |
| P12 | Cart FAB | Mobile, count > 0 shows badge | `.cart-fab` | Mobile-only fixed cart button |
| P13 | Staggered Menu | Nav open | `.menu-drawer-body > *` | Nav item entry |

### P3 — Background Grid System

Applies as ambient texture on catalog page background — not on product cards. Gives structure without adding visual weight to cards. The grid is the container; cards are objects.

```css
/* 4 CSS variables control all grid patterns */
:root {
  --grid-dot:          var(--hvar-red-600);
  --grid-dot-opacity:  0.15;
  --grid-line:         var(--hvar-red-600);
  --grid-size:         24px;
}

.bg-grid-dots {
  --gs: var(--grid-size, 24px);
  background-image: radial-gradient(
    circle at center,
    hsl(var(--grid-dot) / var(--grid-dot-opacity, 0.15)) 1px,
    transparent 1px
  );
  background-size: var(--gs) var(--gs);
}

.bg-grid-lines {
  background-image:
    linear-gradient(hsl(var(--grid-line) / 0.06) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--grid-line) / 0.06) 1px, transparent 1px);
  background-size: var(--grid-size) var(--grid-size);
}

.bg-grid-mesh {
  background-image:
    radial-gradient(ellipse 50% 50% at 50% 50%,
      hsl(var(--hvar-red-600) / 0.04) 0%, transparent 100%),
    linear-gradient(hsl(var(--grid-line) / 0.04) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--grid-line) / 0.04) 1px, transparent 1px);
  background-size: 100% 100%, var(--grid-size) var(--grid-size), var(--grid-size) var(--grid-size);
}

/* Dark mode: dots become brighter */
.dark .bg-grid-dots { --grid-dot-opacity: 0.25; }
```

### P5 — 3D Door-Swing Menu

```css
@keyframes menuDrawerOpenRTL {
  from { transform: translateX(100%) rotateY(12deg); opacity: 0; }
  to   { transform: translateX(0) rotateY(0); opacity: 1; }
}
@keyframes menuDrawerOpenLTR {
  from { transform: translateX(-100%) rotateY(-12deg); opacity: 0; }
  to   { transform: translateX(0) rotateY(0); opacity: 1; }
}

[dir="rtl"] .menu-drawer {
  animation: menuDrawerOpenRTL var(--duration-modal) var(--curve) forwards;
}
[dir="ltr"] .menu-drawer {
  animation: menuDrawerOpenLTR var(--duration-modal) var(--curve) forwards;
}

/* Perspective must be on the parent */
.menu-drawer-container {
  perspective: 1200px;
}

@media (prefers-reduced-motion: reduce) {
  .menu-drawer { animation: none; transform: translateX(0); opacity: 1; }
}
```

### P6 — Card Shine

```css
.product-card-creative {
  position: relative;
  overflow: hidden;
}

.product-card-creative::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 0%, transparent 40%,
    hsl(var(--hvar-red-600) / 0.06) 45%,
    hsl(var(--hvar-red-600) / 0.12) 50%,
    hsl(var(--hvar-red-600) / 0.06) 55%,
    transparent 60%, transparent 100%
  );
  opacity: 0;
  transform: translateX(-100%);
  transition:
    opacity 0.4s var(--curve),
    transform 0.5s var(--curve);
  pointer-events: none;
}

.product-card-creative:hover::after {
  opacity: 1;
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .product-card-creative::after { transition: none; }
  .product-card-creative:hover::after { transform: none; opacity: 0.5; }
}
```

### P7 — Scroll Reveals

```css
.reveal-section {
  opacity: 0;
  transform: translateY(2rem);
  transition:
    opacity var(--duration-reveal) var(--curve),
    transform var(--duration-reveal) var(--curve);
}

.reveal-section.in-view {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered children */
.reveal-child {
  opacity: 0;
  transform: translateY(1.125rem);
  transition:
    opacity 500ms var(--curve),
    transform 500ms var(--curve);
}

.in-view .reveal-child { opacity: 1; transform: translateY(0); }

/* nth-child delays */
.in-view .reveal-child:nth-child(1) { transition-delay: 0ms; }
.in-view .reveal-child:nth-child(2) { transition-delay: 80ms; }
.in-view .reveal-child:nth-child(3) { transition-delay: 160ms; }
.in-view .reveal-child:nth-child(4) { transition-delay: 240ms; }
.in-view .reveal-child:nth-child(5) { transition-delay: 320ms; }
.in-view .reveal-child:nth-child(6) { transition-delay: 400ms; }

/* Scale variant for cards */
.reveal-scale {
  opacity: 0;
  transform: scale(0.95);
  transition:
    opacity 500ms var(--curve),
    transform 500ms var(--curve);
}
.in-view .reveal-scale { opacity: 1; transform: scale(1); }

/* Reduced motion — skip all animation */
@media (prefers-reduced-motion: reduce) {
  .reveal-section,
  .reveal-child,
  .reveal-scale {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

Intersection Observer hook triggers `.in-view` class when element enters viewport at 10% threshold.

### P8 — Product Viewport

```css
.hero-viewport {
  width: clamp(12rem, 28vw, 20rem);
  border-radius: var(--radius-lg);
  border: 2px solid hsl(var(--border));
  overflow: hidden;
  position: relative;
}

.hero-viewport__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (prefers-reduced-motion: no-preference) {
  .hero-viewport__img {
    animation: heroBreath 20s ease-in-out infinite alternate;
  }
  @keyframes heroBreath {
    from { transform: scale(1); }
    to   { transform: scale(1.02); }
  }
}
```

Auto-cycle: 5500ms interval in React. Touch swipe at 50px threshold. Dots with 44px touch targets. Prev/Next on tablet+.

### P9 — CTA Trust Line

```css
.cta-trust-line {
  font-size: 0.8125rem;           /* 13px */
  color: hsl(var(--ink-muted));
  margin-block-start: 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1rem;
  direction: inherit;
}

/* Example content (rendered as React children, not CSS) */
/* ضمان 5 سنوات · توصيل مجاني · صيانة 48 ساعة */
```

Use after every primary CTA. Hvar trust signals: `ضمان 5 سنوات · توصيل مجاني · تركيب مجاني · صيانة 48 ساعة`.

### P10 — Service Process Stepper

```css
.service-steps-horizontal {
  display: flex;
  justify-content: space-between;
  position: relative;
  padding-block: 1rem;
}

/* Connecting gradient line */
.service-steps-horizontal::before {
  content: '';
  position: absolute;
  inset-inline-start: 12.5%;
  inset-inline-end: 12.5%;
  top: calc(2.75rem / 2 - 1px);
  height: 2px;
  background: linear-gradient(
    to right,
    hsl(var(--border)) 0%,
    hsl(var(--hvar-red-600) / 0.4) 100%
  );
}

/* RTL: gradient direction flips */
[dir="rtl"] .service-steps-horizontal::before {
  background: linear-gradient(
    to left,
    hsl(var(--border)) 0%,
    hsl(var(--hvar-red-600) / 0.4) 100%
  );
}

.service-step-dot {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-full);
  border: 2px solid hsl(var(--hvar-red-600));
  background: hsl(var(--surface));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  color: hsl(var(--hvar-red-600));
  position: relative;
  z-index: 1;
}

.service-step-dot.completed {
  background: hsl(var(--hvar-red-600));
  color: white;
}

/* Mobile: vertical layout */
@media (max-width: 639px) {
  .service-steps-horizontal { flex-direction: column; gap: 1.5rem; }
  .service-steps-horizontal::before {
    inset-inline-start: calc(2.75rem / 2 - 1px);
    inset-inline-end: auto;
    top: 0;
    bottom: 0;
    width: 2px;
    height: auto;
    background: linear-gradient(
      to bottom,
      hsl(var(--border)) 0%,
      hsl(var(--hvar-red-600) / 0.4) 100%
    );
  }
}
```

Use for: ticket state timeline (HVM / HVR / HVT), order lifecycle in Hvar-OLD.

### P11 — CTA Action Bar

```css
.product-detail-cta-bar {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: fit-content;
  min-height: 44px;
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border));
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* Zone: quantity stepper */
.cta-bar__stepper {
  display: flex;
  align-items: center;
  padding-inline: 0.5rem;
  gap: 0.25rem;
  border-inline-end: 1px solid hsl(var(--border));
}
.cta-bar__stepper button {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: hsl(var(--ink-muted));
  border-radius: var(--radius-sm);
}
.cta-bar__stepper button:hover { background: hsl(var(--hvar-red-50)); color: hsl(var(--hvar-red-600)); }

/* Zone: add to cart */
.cta-bar__add {
  flex: 1;
  min-width: 140px;
  padding-inline: 1.5rem;
  background: hsl(var(--hvar-red-600));
  color: white;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background var(--duration-base) var(--curve);
}
.cta-bar__add:hover { background: hsl(var(--hvar-red-700)); }

/* Zone: WhatsApp inquiry */
.cta-bar__whatsapp {
  min-width: 44px;
  padding-inline: 1rem;
  background: #25D366;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-inline-start: 1px solid rgba(0,0,0,0.08);
}

/* Zone: remove (in cart) */
.cta-bar__remove {
  min-width: 44px;
  padding-inline: 0.75rem;
  background: hsl(var(--hvar-red-50));
  color: hsl(var(--hvar-red-600));
  border-inline-start: 1px solid hsl(var(--border));
}

/* Responsive: wrap on very small screens */
@media (max-width: 374px) {
  .product-detail-cta-bar { flex-wrap: wrap; width: 100%; }
  .cta-bar__stepper { width: 100%; justify-content: center; border-inline-end: none; border-block-end: 1px solid hsl(var(--border)); }
}
```

### P12 — Cart FAB (Mobile Only)

```css
.cart-fab {
  --cart-fab-size: 52px;
  position: fixed;
  z-index: var(--z-fab);
  bottom: max(1.25rem, calc(env(safe-area-inset-bottom) + 0.5rem));

  /* RTL: start side (visual right in RTL) */
  inset-inline-end: 1.25rem;

  width: var(--cart-fab-size);
  height: var(--cart-fab-size);
  border-radius: var(--radius-full);
  background: hsl(var(--hvar-red-600));
  color: white;
  box-shadow:
    var(--shadow-fab),
    0 0 0 3px hsl(var(--bg));   /* gap ring between FAB and page */
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--duration-base) var(--curve),
    box-shadow var(--duration-base) var(--curve),
    transform var(--duration-fast) var(--curve);
}

.cart-fab:hover {
  background: hsl(var(--hvar-red-700));
  box-shadow: var(--shadow-fab), 0 0 0 3px hsl(var(--bg)), 0 8px 32px hsl(var(--hvar-red-600) / 0.4);
}

.cart-fab:active { transform: scale(0.97); }

/* Cart item badge */
.cart-fab__badge {
  position: absolute;
  top: -4px;
  inset-inline-end: -4px;
  min-width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: white;
  color: hsl(var(--hvar-red-600));
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-inline: 4px;
  box-shadow: inset 0 0 0 1.5px hsl(var(--hvar-red-600) / 0.3);
}

/* Hidden on desktop */
@media (min-width: 1024px) { .cart-fab { display: none; } }
```

### P13 — Staggered Menu Items

```css
@keyframes menu-item-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

[data-state='open'] .menu-drawer-body > *:nth-child(1) {
  animation: menu-item-in 200ms var(--curve) both;
  animation-delay: 80ms;
}
[data-state='open'] .menu-drawer-body > *:nth-child(2) { animation-delay: 140ms; }
[data-state='open'] .menu-drawer-body > *:nth-child(3) { animation-delay: 200ms; }
[data-state='open'] .menu-drawer-body > *:nth-child(4) { animation-delay: 260ms; }
[data-state='open'] .menu-drawer-body > *:nth-child(5) { animation-delay: 320ms; }
[data-state='open'] .menu-drawer-body > *:nth-child(6) { animation-delay: 380ms; }
[data-state='open'] .menu-drawer-body > *:nth-child(7) { animation-delay: 440ms; }
[data-state='open'] .menu-drawer-body > *:nth-child(8) { animation-delay: 500ms; }
[data-state='open'] .menu-drawer-body > *:nth-child(n+9) { animation-delay: 560ms; }

/* Active nav item indicator */
.menu-nav-link.active {
  border-inline-start: 3px solid hsl(var(--hvar-red-600));
  padding-inline-start: calc(1rem - 3px);   /* compensate for border */
  background: hsl(var(--hvar-red-50));
  color: hsl(var(--hvar-red-700));
}

/* WhatsApp + Call in drawer bottom */
.menu-drawer-actions {
  margin-block-start: auto;
  padding-block-start: 1.5rem;
  border-block-start: 1px solid hsl(var(--border));
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (prefers-reduced-motion: reduce) {
  [data-state='open'] .menu-drawer-body > * {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

### Pattern Integrity — Reduced Motion Summary

| Pattern | Reduced Motion Behavior |
|---------|------------------------|
| P5 (door-swing) | Instant position change, no rotation |
| P6 (card shine) | Static highlight on hover, no sweep animation |
| P7 (scroll reveals) | Elements appear at final position, no translate/fade |
| P8 (product viewport) | Paused at first image, no auto-cycle, no breathe animation |
| P13 (staggered menu) | All items appear simultaneously |
| P1 (doodle float) | Doodles rendered statically |
| Ambient glow | Not affected (CSS `::after`, no animation) |

### Wilson Pattern Priority for Hvar

| Pattern | Implementation effort | Impact | Priority |
|---------|----------------------|--------|----------|
| P2 Grain texture | Low — CSS only | Medium | Ship now |
| P3 Grid system | Low — CSS only | Medium | Ship now |
| P4 Red mesh hero | Low — CSS only | High | Ship now |
| P9 Trust line | Low — CSS only | High | Ship now |
| P5 3D menu | Low — CSS only | Medium | Next sprint |
| P6 Card shine | Low — CSS only | High | Next sprint |
| P7 Scroll reveals | Low — CSS + IntersectionObserver hook | Medium | Next sprint |
| P13 Staggered menu | Low — CSS only | Medium | Next sprint |
| P12 Cart FAB | Low — CSS + React | Medium | Next sprint |
| P1 Doodle BGs | Medium — SVG design | High | Planned |
| P10 Service stepper | Medium — CSS | High | Planned |
| P11 CTA bar | Medium — React | High | Planned |
| P8 Product viewport | Medium — React | High | Planned |
| Named themes | Low — CSS var rename | Critical | Immediate |

---

## Cross-Ecosystem Design Languages

Hvarstore.com exists within a five-project workspace. Understanding the other design languages prevents accidental borrowing of wrong conventions.

| System | Primary | Character | Component count | CSS lines |
|--------|---------|-----------|-----------------|-----------|
| **hvarstore (POS)** | Green `#22c55e` | Utilitarian, terminal, cashier-speed | 25 | ~200 |
| **Hvar-Catalog** | Red `#ef4444` | Premium, editorial, consumer | 16 | ~500 |
| **Hvar-OLD** | Rose `#f43f5e` | Data-dense, admin, multi-role | 30 | ~800 |
| **MCRM** | Rose `#f43f5e` | Operative, scan-first, service | 40 | ~600 |
| **Wilson Egypt** | Gold `#FEB636` | Creative, warm, premium Egyptian | 44 | 3,834 |

hvarstore.com's design system is the least evolved functionally but the most deliberately branded atmospherically (ambient glow, grain, named themes). Wilson Egypt has the richest pattern library — the source for the 13 patterns above. Hvar-Catalog has the most complete typography system for Arabic consumer UIs.

### When to Reference Which

| Need | Look at |
|------|---------|
| Arabic display typography at scale | Hvar-Catalog (Almarai + Tajawal) |
| Product card hover effects | Wilson Egypt (P6 card shine) |
| Dashboard / data table patterns | Hvar-OLD |
| Status-driven scan interfaces | MCRM |
| Creative surface treatment | Wilson Egypt |
| Business terminal / cashier UX | Hvar-POS |

---

## Accessibility Rules

### WCAG AA Minimum

Every text element meets WCAG AA contrast ratio minimum:
- Normal text (< 18pt / 14pt bold): 4.5:1 minimum
- Large text (≥ 18pt / 14pt bold): 3:1 minimum
- UI components and graphical objects: 3:1 minimum

### Critical Contrast Pairs

| Foreground | Background | Min ratio | Status |
|-----------|-----------|----------|--------|
| `--ink` on `--bg` (light) | near-black on ivory | 4.5:1 | Passes |
| `--ink` on `--bg` (dark) | ivory on charcoal | 4.5:1 | Passes |
| `--hvar-red-600` text on `--bg` (light) | red on ivory | < 4.5:1 | Large text only |
| White on `--hvar-red-600` button | white on red | 4.5:1 | Passes |
| `--ink-muted` on `--surface` | muted on white | Borderline | Verify at body size |

If you change any token, run contrast checks for all pairs that involve that token. Use axe DevTools for in-context checking.

### Focus Visible

```css
:focus-visible {
  outline: 2px solid hsl(var(--hvar-red-600));
  outline-offset: 2px;
  border-radius: var(--radius-xs);
}

/* Keyboard nav on Arabic inputs */
[dir="rtl"] :focus-visible {
  outline-offset: 3px;  /* slightly more room for RTL text selection */
}
```

`outline: none` without a replacement is an accessibility failure. Do not do this.

### Touch Targets

44px minimum in both dimensions. Add invisible padding when visual size is smaller:

```css
.small-icon-button {
  min-height: 44px;
  min-width: 44px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### RTL Keyboard Navigation

- Tab order must read right-to-left in RTL context
- Arrow key navigation in menus and carousels: Left key = forward (RTL), Right key = back
- Test with: keyboard only, no mouse, starting from page top

---

## What to NEVER Do

These are absolute rules. No exceptions without a documented decision.

| Rule | Violation | Why it matters |
|------|-----------|----------------|
| Never hardcode colors | `color: #d43533` in CSS | Tokens exist so themes work. Hardcoded colors break dark mode and make rebrand impossible |
| Never use `outline: none` alone | `button:focus { outline: none; }` | Keyboard users lose navigation context |
| Never `padding-left` / `padding-right` | Use `padding-inline-start` / `padding-inline-end` | RTL layout breaks when physical properties used |
| Never use Hvar red as a background surface | Large red hero sections | Red is an action/signal color. As a surface it overwhelms and exhausts |
| Never introduce a new easing curve | `transition: all 0.3s ease-in-out` | The Wilson curve is the motion signature. Mixing curves destroys consistency |
| Never animate without reduced-motion fallback | Missing `@media (prefers-reduced-motion: reduce)` | Users have medical reasons for requesting reduced motion |
| Never use `em` for font sizes in component CSS | `font-size: 0.875em` | Compound inheritance creates unpredictable scaling in Arabic components |
| Never put grain texture on text | Grain on `<p>` or `<h2>` | Reduces legibility, fails contrast checks |
| Never deploy without testing dark mode | Ship light-only | Dark mode is a named theme, not an afterthought |
| Never use brand red flat without the ambient glow | Red CTA on a page without `html::after` | The glow is what makes the red warm. Without it, red reads as alarm/urgency |
| Never add `// TODO` or placeholder components | Partial implementation | Article II.6 of the Constitution. Complete or nothing |
| Never touch target below 44px | `button { height: 32px; }` | Egyptian mobile-primary audience on large Android phones with thumbs |

---

*Last updated: 2026-06-06*
*Compass location: `/hub/projects/dev/hvar/pos/compass/portal/design-system.md`*
