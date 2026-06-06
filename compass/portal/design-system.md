# Design System Direction — hvarstore.com

> The authoritative design direction for hvarstore.com. The implementation lives in `global.css` and the component library. This document is the WHY and the RULES — the reasoning behind every token, the principle behind every pattern.

---

## The Direction: "المطبخ الدافئ × هفار لوكس"

Warm Kitchen × Hvar Luxe. This phrase is the mandate that every design decision answers to.

**The Warm Kitchen axis:** the page should feel like it exists in the same warm light as the kitchen photography. Ivory canvas, not clinical white. Arabic display type that carries weight and warmth. Content that feels domestic and real.

**The Hvar Luxe axis:** the page should feel more considered than any competitor in this segment. Named themes. A precise token system. Grain texture. The ambient glow. Card depth. Motion with a signature. These are not decorative choices — they are the signals that separate Hvar from the loud-orange discount aesthetics of the competition.

**Resolving the tension in every component decision:**
- A trust badge should feel like a quality assurance signal, not a coupon. Heavy enough type, enough space, enough weight.
- A product card should feel like an editorial product feature, not a catalog entry. Warm photography, comfortable spacing, thoughtful hierarchy.
- An error message should feel like help, not like a system complaint.

---

## Token System

Every value in the design system has a named CSS variable. No hardcoded colors, no hardcoded values, no magic numbers. The variable names carry their intent.

### Brand Colors

```css
/* These are HSL channel values — use as hsl(var(--hvar-red-600)) */
--hvar-red-600: 1 64% 51%;        /* #d43533 — primary action, brand signature */
--hvar-red-700: 1 60% 42%;        /* hover, pressed, deep variant */
--hvar-red-50:  6 70% 97%;        /* tint wash, alert backgrounds */
--brass-500:    32 55% 51%;       /* #C8893B — premium warmth accent */
--trust-green:  142 71% 38%;      /* COD, WhatsApp, success */
```

**Intent rules:**
- `--hvar-red-600`: primary CTAs, active navigation, key highlights. One in ten visual elements, maximum.
- `--hvar-red-700`: hover and pressed states on red elements. Never used as a surface or decorative color.
- `--hvar-red-50`: alert backgrounds, badge tints, the lightest possible red — use when a red surface is needed but full saturation would be overwhelming.
- `--brass-500`: installment badges, price highlights, premium callouts, secondary accent on dark surfaces. The warmth modifier.
- `--trust-green`: only for functional trust signals — COD confirmation, WhatsApp buttons, success states. Never decorative.

### Canvas and Surface

```css
/* Light theme (هفار الأحمر) */
--bg:           36 38% 97%;       /* #FBF7F1 — warm ivory page canvas */
--surface:      0 0% 100%;        /* white cards on warm canvas */
--ink:          20 14% 12%;       /* warm near-black text */
--ink-muted:    20 8% 42%;        /* secondary text, labels */
--border:       30 16% 88%;       /* dividers, card borders */

/* Dark theme (هفار الليل) — overridden by .dark class */
--bg:           20 10% 7%;        /* warm charcoal canvas */
--surface:      20 9% 11%;        /* slightly lighter surface */
--ink:          36 30% 94%;       /* ivory text */
--ink-muted:    30 8% 62%;        /* muted ivory */
--border:       24 8% 20%;        /* subtle borders */
```

**Why warm ivory for the canvas, not white:**
White canvas is the default choice. It is also the choice of every generic ecommerce template. Warm ivory (`#FBF7F1`) reads as deliberate — the same warm light that appears in the kitchen photography, carried into the page itself. This single token choice establishes the brand's warmth before a single image loads.

**Why warm charcoal for dark mode, not black:**
Pure black (`#000000`) kills the ambient glow — the ember red and brass gradients cannot create warmth against solid black. Warm charcoal `hsl(20 10% 7%)` is dark enough to be a proper dark mode while warm enough to let the glow breathe.

### System Tokens

```css
--radius:       1rem;             /* 16px — soft, premium, the default border radius */
--radius-sm:    0.625rem;         /* 10px — small components: badges, chips, inputs */
--grain:        0.04;             /* light mode grain overlay opacity */
--mesh-red:     0.08;             /* ambient glow opacity, light mode */
--curve:        cubic-bezier(0.22, 1, 0.36, 1);  /* the Hvar Wilson curve */
--shadow-card:  0 1px 2px hsl(0 0% 0% / .04),
                0 8px 24px hsl(var(--hvar-red-600) / .06);
```

**The card shadow:** the `0 8px 24px hsl(var(--hvar-red-600) / .06)` layer is the brand's signature in depth. Cards in hvarstore.com cast a faint red-tinted shadow, which connects the card's depth to the ambient glow system. At 6% opacity, it is invisible to casual inspection but creates the sense that the card exists in a warm-lit space.

**The Wilson curve:** `cubic-bezier(0.22, 1, 0.36, 1)`. This is the Hvar motion signature. It has a slow approach and a confident, fast completion — the sensation of a quality mechanism clicking into place. Use it everywhere, as `var(--curve)`. Never introduce a different easing curve without updating this token.

---

## Theme System

### Two Named Themes

**هفار الأحمر** (Light) — `:root` base styles. The warm, daylit kitchen. Ivory canvas, deep red brand color, natural light feel.

**هفار الليل** (Dark) — `.dark` class on `<html>`. The kitchen at night. Warm charcoal, glowing ember red, ivory text.

### CSS Class Strategy

Dark mode is toggled via the `.dark` class on `<html>`. Not `prefers-color-scheme` auto-switching. The user explicitly chooses their theme through the ThemeToggle island, and the choice is persisted to `localStorage`.

**Why class, not `prefers-color-scheme`:**
- User agency: some users prefer dark mode at OS level but light mode for shopping (where product photography reads better in light). Force-following the OS preference removes this agency.
- Design control: `prefers-color-scheme` requires careful media query management and can produce flashes of wrong theme on first load. CSS class + localStorage, initialized in a `<script>` tag before the page renders, eliminates FOIT (flash of incorrect theme).

### ThemeToggle Island

Hydrates with `client:load`. Reads from `localStorage` on mount. Sets `.dark` class on `<html>`. Persists the preference. RTL-aware positioning (right side in LTR, left side in RTL — logical properties handle this).

### Testing Both Themes

Every component must be designed and tested in both themes before it is considered complete. The rule: if a new component is added to the system and هفار الليل mode breaks it (contrast failure, layout collapse, color bleeding), the component is not done.

---

## Typography Scale

All values in this scale apply to Cairo (Arabic) and Inter (numeric/English). Arabic line heights are looser than Latin defaults — Cairo's letterforms need more vertical breathing room.

| Token | rem | px | Line height | Use |
|-------|-----|-----|------------|-----|
| `text-xs` | 0.75rem | 12px | 1.5 | Legal, fine print, tiny labels |
| `text-sm` | 0.875rem | 14px | 1.6 | Secondary labels, captions, mCRM density layer |
| `text-base` | 1rem | 16px | 1.75 | Body text, product descriptions, form copy |
| `text-lg` | 1.125rem | 18px | 1.7 | Lead copy, introductory paragraphs |
| `text-xl` | 1.25rem | 20px | 1.6 | Card headings, section subheads |
| `text-2xl` | 1.5rem | 24px | 1.4 | Section headers |
| `text-3xl` | 1.875rem | 30px | 1.3 | Page headers, feature headings |
| `text-4xl` | 2.25rem | 36px | 1.2 | Large display — desktop |
| `text-5xl` | 3rem | 48px | 1.1 | Hero display — desktop only |

**Mobile scale adjustment:** one step down for display text on screens below 640px. `text-5xl` → `text-4xl` for hero. `text-4xl` → `text-3xl` for page headers. Body and label sizes do not scale down — they are already comfortable at mobile size.

**Cairo weight mapping:**

| Weight | Name | Tailwind class | Use |
|--------|------|----------------|-----|
| 400 | Regular | `font-normal` | Body text, secondary copy |
| 600 | SemiBold | `font-semibold` | Labels, badges, UI elements |
| 700 | Bold | `font-bold` | Card headings, navigation, buttons |
| 900 | Black | `font-black` | Hero display, brand moments |

**Inter for prices:** always with `font-variant-numeric: tabular-nums` (Tailwind: `tabular-nums`). This ensures price digits are fixed-width — a list of prices does not visually shift as numbers change.

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

**The density principle:** content inside a component uses small spacing (space-2 through space-4). Space between components uses medium spacing (space-6, space-8). Space between page sections uses large spacing (space-12 through space-24). Never invert this — a section with huge internal padding and tiny gap to the next section reads upside-down.

---

## Component Principles

These principles apply to every component in the system, before any component-specific decisions.

### Every interactive element has a 44px minimum touch target

iPhone's Human Interface Guidelines and Android Material spec both establish 44px / 48dp as the minimum comfortable touch target size. For an audience that is mobile-primary and often using large-screen Android phones with their thumbs, this is non-negotiable. The visual element can be smaller — add invisible padding to reach the touch target if needed.

### Every component has a resting state AND an interaction state

Every button, link, card, and form element must have a defined:
- Default (resting) state
- Hover state (pointer device)
- Focus state (keyboard navigation — this is an accessibility requirement, not optional)
- Active/pressed state
- Disabled state (where applicable)

The focus state must be visible. The `outline: none` without a replacement is an accessibility failure.

### Every text element respects `dir="rtl"`

The page root has `dir="rtl"`. Every text component, every icon with directional meaning (arrows, chevrons), and every layout with an LTR/RTL mirroring implication must respect this. Use logical CSS properties (`padding-inline-start` not `padding-left`, `margin-inline-end` not `margin-right`) throughout. Test RTL by checking that the component looks correct as an Arabic speaker reading it — start from the right, not the left.

### Every animation uses `var(--curve)`

The Wilson curve is used for all transitions and animations. If a component introduces a new animation, it uses `var(--curve)` as the timing function and checks `prefers-reduced-motion` for a static fallback.

---

## Wilson Pattern System

The 13 Wilson patterns are the ambient and interaction layer of the hvarstore.com visual system. Here is how they layer and when each applies.

### The Base Atmosphere (Always On)

These patterns are always present on pages that use them — they are not triggered by user interaction.

| Pattern | What it is | Where it applies |
|---------|-----------|-----------------|
| P1 — Appliance Doodle BG | SVG appliance motifs (blender, air fryer, kettle, iron) at `opacity: 0.18–0.22`, `pointer-events: none` | Hero section, mobile nav drawer, footer |
| P2 — Grain Texture | `::before` pseudo-element, SVG noise, `mix-blend-mode: overlay`, `opacity: var(--grain)` | Hero sections, cards (especially on dark surfaces) |
| P4 — Red Mesh Hero | Radial gradient at 8% opacity on hero backgrounds — Hvar red, not the Wilson gold | Hero sections, category page headers |

**These three together (P1 + P2 + P4):** create the base atmosphere. The mesh adds warmth through color. The grain adds texture. The doodles add brand-specific cultural context (these are kitchen appliances, rendered as art). The result is a hero that feels like it belongs to a brand, not a template.

### The Interaction Layer (Applied per Component)

These patterns activate through user action or scroll.

| Pattern | Trigger | Applied to |
|---------|---------|-----------|
| P6 — Card Shine | Hover | Product cards, ticket cards — diagonal gradient sweep on hover |
| P7 — Scroll Reveals | Scroll / IntersectionObserver | Page sections, product grid, trust block, chef strip |
| P5 — 3D Door-Swing Menu | Mobile nav open | The mobile navigation drawer |
| P8 — Product Viewport | Auto-cycle (20s interval) | PDP image gallery hero |
| P10 — Service Stepper | State data (static) | Ticket state timeline (HVM/HVR/HVT) |
| P11 — CTA Action Bar | Always visible on PDP | Qty stepper + أضيفي للسلة + WhatsApp + remove |
| P12 — Cart FAB | Always visible (count > 0 triggers badge) | Mobile cart fixed button |
| P13 — Staggered Menu | Mobile nav open | Nav item entry animation |

### Grid Pattern (P3)

P3 (CSS radial-gradient grid) applies as an ambient texture on the catalog page background — not on product cards themselves. It gives the catalog a sense of structure without adding visual weight to the cards. The grid is the container; the cards are the objects.

### Pattern Integrity

Every pattern respects `prefers-reduced-motion`. Specifically:
- P5 (door-swing): becomes an instant position change, no rotation
- P6 (card shine): becomes a static highlight on hover, no animation
- P7 (scroll reveals): elements appear at their final position, no translate/fade
- P8 (product viewport): paused at first image, no auto-cycle
- P13 (staggered menu): all items appear at once, no sequential delay

---

## The Ambient Kiln Glow

The living ember. This is the single most distinctive visual element in the hvarstore.com design system.

### Technical Implementation

```css
html::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(
      ellipse 60% 50% at 80% 5%,
      hsl(var(--hvar-red-600) / var(--mesh-red)) 0%,
      transparent 70%
    ),
    radial-gradient(
      ellipse 50% 40% at 10% 60%,
      hsl(var(--brass-500) / calc(var(--mesh-red) * 0.7)) 0%,
      transparent 60%
    );
}
```

- Light mode: `--mesh-red: 0.08` — subtle, warm
- Dark mode: `--mesh-red: 0.12` — more present, stronger atmospheric effect
- Fixed to viewport — the glow does not scroll with content
- `z-index: 0` — behind content but above the base canvas
- `pointer-events: none` — never interferes with interaction

### Design Purpose

The ambient glow answers the question: "Why isn't Hvar red harsh?" Hvar red (`#d43533`) is a saturated red. Used as a flat corporate color, it would feel like an urgency color — the red of sale badges and alarm states. The ambient glow transforms it into a warm light source, the ember of a kitchen fire. Every page becomes lit by this glow.

This is not optional polish. It is the system that makes the brand red work.

### The Glow and Dark Mode

In هفار الليل, the glow becomes more perceptible. The darker canvas allows the ember red to be more atmospheric — the charcoal room lit by a warm fire. The `--mesh-red` variable increases from `0.08` to `0.12`. The result is a dark mode that feels warm and alive, not cold and techy.

**Rule:** never use brand red as a flat decorative element without the ambient glow present. The glow is the reason the red reads correctly. Flat brand red without the glow context is a different color experience.

---

## Dark Mode Rules

### What Changes

| Element | هفار الأحمر | هفار الليل |
|---------|------------|-----------|
| Canvas `--bg` | `hsl(36 38% 97%)` ivory | `hsl(20 10% 7%)` charcoal |
| Surface `--surface` | `hsl(0 0% 100%)` white | `hsl(20 9% 11%)` dark surface |
| Text `--ink` | `hsl(20 14% 12%)` near-black | `hsl(36 30% 94%)` ivory |
| Muted text `--ink-muted` | `hsl(20 8% 42%)` | `hsl(30 8% 62%)` |
| Border `--border` | `hsl(30 16% 88%)` | `hsl(24 8% 20%)` |
| Brand red `--hvar-red-600` | `1 64% 51%` | `2 75% 58%` (brighter) |
| Grain opacity `--grain` | `0.04` | `0.06` |
| Glow opacity `--mesh-red` | `0.08` | `0.12` |
| Card shadow `--shadow-card` | Red-tinted at 6% | Red-tinted at 12% |

### What Stays

- The brand red is present in both themes, just slightly more luminous in dark mode
- The brass accent `--brass-500` is the same HSL value (appears brighter on dark because of contrast)
- The trust green `--trust-green` is the same
- The `--curve` easing is the same
- The `--radius` values are the same
- The typography scale is the same

### Why the Dark Mode Red is Slightly More Orange-Shifted

Light mode brand red: `hsl(1 64% 51%)` — slightly orange-red hue, full saturation control.
Dark mode brand red: `hsl(2 75% 58%)` — marginally warmer hue, higher lightness and saturation.

On a dark canvas, a straight `#d43533` reads as harsh — too much contrast, insufficient warmth. The dark mode red is slightly lighter and more saturated so it reads as glowing rather than flat. The 1-degree hue shift toward orange (hue 1 → 2) very slightly warms it. At the scale of a glow or a CTA button on dark background, this is the difference between "this looks right" and "this seems slightly off."

---

## Accessibility

### WCAG AA Minimum

Every text element meets WCAG AA contrast ratio minimum:
- Normal text (< 18pt / 14pt bold): 4.5:1 minimum
- Large text (≥ 18pt / 14pt bold): 3:1 minimum
- UI components and graphical objects: 3:1 minimum

### Critical Contrast Pairs to Monitor

| Foreground | Background | Min ratio | Check |
|-----------|-----------|----------|-------|
| `--ink` on `--bg` (light) | near-black on ivory | 4.5:1 | Passes |
| `--ink` on `--bg` (dark) | ivory on charcoal | 4.5:1 | Passes |
| `--hvar-red-600` text on `--bg` (light) | red on ivory | < 4.5:1 | Large text only |
| White on `--hvar-red-600` button | white on red | 4.5:1 | Passes (use as button label) |
| `--ink-muted` on `--surface` | muted on white | Borderline | Verify for body-size text |

**The rule:** if you change any token value, run contrast checks for all pairs that involve that token before shipping. Use a browser extension or the axe DevTools for in-context checking.

### Reduced Motion

Every animated element in the system has a `@media (prefers-reduced-motion: reduce)` block. The pattern:

```css
.reveal-section {
  transform: translateY(2rem);
  opacity: 0;
  transition: transform 700ms var(--curve), opacity 500ms var(--curve);
}

.reveal-section.visible {
  transform: translateY(0);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .reveal-section {
    transform: none;
    opacity: 1;
    transition: none;
  }
}
```

This is not optional. Users who have requested reduced motion have a medical or accessibility reason. Ignoring their preference is a failure.

### Focus Visible

All interactive elements have a visible focus indicator. The default browser focus ring is acceptable if it is visible against the background. A custom focus style using the brand:

```css
:focus-visible {
  outline: 2px solid hsl(var(--hvar-red-600));
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

**`outline: none` without a replacement = accessibility failure.** Do not do this.

### Touch Targets

44px minimum in both dimensions for any element a user can tap. If the visual size is smaller, add invisible padding:

```css
.small-button {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```
