# Design System

> Wilson Egypt — the most creatively ambitious design system in the Hvar ecosystem.

---

## Design Philosophy

**"قوية. ذكية. بسعر عادل."** — Powerful. Smart. Fairly Priced.

Wilson's design language is built on **Egyptian warmth meets modern premium**. Gold is the hero — not just as an accent, but as the **philosophical center**: quality, heritage, value. The palette draws from Egyptian desert (papyrus cream by day, warm charcoal by night) and Pharaonic gold.

### The Two Themes

| Theme | Name | Vibe | Background |
|-------|------|------|------------|
| Light | **Desert Luxe** | Warm, calm, premium | Papyrus cream (42 18% 97%) |
| Dark | **Night Luxe** | Deep, elegant, immersive | Warm charcoal (240 10% 5%) |

---

## Pattern Innovations (What Makes Wilson Special)

Wilson has the most creative design patterns in the Hvar ecosystem. Here's what sets it apart:

### 1. Appliance Doodle Background
**File:** `ApplianceDoodleBg.tsx`

A hand-drawn SVG with **22 appliance illustrations** scattered across the viewport:
- refrigerator, stove/oven, vacuum cleaner, kettle, blender, TV, water cooler, stand mixer, electric plug, snowflake (cooling), flame (cooking), water drop, stars, hearts, home icon, washing machine, iron, lightning bolt, WiFi signal, speech bubble, Egyptian gold brackets « », thermometer
- Theme-aware strokes: light = warm brown + gold, dark = gold + ivory
- Opacity 0.22 — visible per UX, content still primary
- Optional float animation (30s infinite group translate)
- Variants: gold-only, white-only, mix (theme-aware)

```tsx
// Usage — placed as absolute background on any section
<ApplianceDoodleBg variant="mix" opacity={0.22} animated={true} />
```

### 2. Gold Mesh Overlay
```css
.gold-mesh-hero::after {
  background: radial-gradient(ellipse 80% 60% at 50% 0%,
    hsl(var(--gold-500) / 0.08) 0%,
    hsl(var(--gold-400) / 0.03) 40%,
    transparent 70%);
}
```
Subtle gold radiance at top of hero sections. 8% gold density at center, fading outward.

### 3. Grain / Noise Texture
```css
.grain-overlay::before {
  background-image: url("data:image/svg+xml,...fractalNoise...");
  opacity: 0.04;
  mix-blend-mode: overlay;
}
```
CSS-generated SVG noise texture. 4% opacity light, 6% dark. Adds tactile depth to sections.

### 4. Background Grids
5 theme-aware patterns via CSS variables:

| Pattern | Light | Dark |
|---------|-------|------|
| `bg-grid-dots` | Silver dots | Gold dots |
| `bg-grid-lines` | Soft silver lines | Muted gold lines |
| `bg-grid-mesh` | Dots + gradient vignette | Dark mesh + gold accent |
| `bg-grid-hex` | Hexagonal | Hex + gold nodes |
| `bg-grid-cross` | Plus/cross | Cross pattern |

Controlled by `--grid-dot`, `--grid-line`, `--grid-size`, `--grid-dot-opacity` CSS vars.

### 5. 3D Menu Drawer
**Keyframes:** `menuDrawerOpenRTL`, `menuDrawerOpenLTR`

Mobile menu opens with a **3D door-swing** animation:
- RTL: right hinge, `rotateY(12deg)` → 0deg, opacity 0 → 1
- LTR: left hinge, `rotateY(-12deg)` → 0deg
- Duration: 0.5s, cubic-bezier(0.22, 1, 0.36, 1) — the "Wilson curve"

### 6. Product Card Shine
On hover, a diagonal gradient sweeps across the card left-to-right, creating a metallic shine effect:
```css
.product-card-creative::after {
  background: linear-gradient(105deg,
    transparent 40%, gold-tint 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}
.product-card-creative:hover::after {
  transform: translateX(100%);
}
```

### 7. Hero with Product Viewport
Hero section features a framed product viewport — a card with border, grain overlay, auto-cycling product slides, and a subtle 20s infinite breathe animation (scale 1↔1.02).

### 8. CTA Trust Line
Under every primary CTA: a small trust line showing warranty, service, delivery info:
```
ضمان 5 سنوات · توصيل مجاني · صيانة 48 ساعة
5-Year Warranty · Free Delivery · 48h Service
```

### 9. Category Chips (Stepped Layout)
Creative layout where chips are arranged in rows of varying lengths (long/short/long), not a uniform horizontal scroll. Each chip has 44px minimum touch target.

### 10. Why Wilson Strip
Editorial 3-pillar section — one horizontal strip with:
- 4px gold accent bar on the left (RTL: right)
- Numbered circle badge (gold bg)
- Title + description
- Hover: gold border glow

### 11. Service Process Stepper
Horizontal connected stepper with:
- Gold-numbered dots connected by a gradient gold line
- RTL-aware line direction
- Vertical mobile version with connector lines

### 12. Cart FAB (Mobile Only)
Fixed bottom gold circle (52px) with cart icon and badge. Appears only on mobile (< 1024px). Gold shadow, hover brightness, tap scale.

### 13. CTA Horizontal Bar (Product Detail)
Single horizontal strip with 3 zones:
- Quantity stepper (− / value / +) with 44px touch targets
- Gold "Add to Cart" button (flex grow)
- WhatsApp inquiry button (green)
- Removable variant with remove button

---

## Color System

### Brand: Egyptian Gold
Full scale from `--gold-50` (cream) to `--gold-950` (bronze). 500 is brand.

| Token | Hex | HSL | Usage |
|-------|-----|-----|-------|
| gold-50 | #FFFBEB | 42 25% 98% | Lightest tint |
| gold-100 | #FFF1C7 | 42 30% 95% | Hover surfaces |
| gold-200 | #FDE68A | 42 35% 90% | Accent borders |
| gold-300 | #FCD34D | 40 90% 72% | Medium accent |
| gold-400 | #FBBF24 | 39 98% 62% | Hover states |
| **gold-500** | **#FEB636** | **38 99% 60%** | **BRAND GOLD — CTAs, logo** |
| gold-600 | #D97706 | 37 92% 52% | Active state |
| gold-700 | #B45309 | 36 85% 44% | Deep hover |
| gold-800 | #92400E | 34 78% 36% | Dark accent |
| gold-950 | #451A03 | 30 70% 18% | Deepest bronze |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| success | #10B981 | In stock, positive |
| warning | #F59E0B | Sale badges, alerts |
| danger | #EF4444 | Errors, out of stock |
| info | #3B82F6 | Information |
| badge-new | #7C3AED | New product |
| badge-sale | #DC2626 | Sale tag |
| badge-bestseller | #F59E0B | Bestseller |

### Surface & Ink (CSS Variable System)
| Token | Light (Desert Luxe) | Dark (Night Luxe) |
|-------|-------------------|-------------------|
| Page bg | 42 18% 97% (cream) | 240 10% 5% (charcoal) |
| Card bg | same as page | 240 8% 8% |
| Primary text | 28 18% 16% | 42 18% 95% |
| Muted text | 28 12% 44% | 38 12% 68% |
| Border | 38 8% 90% | 240 6% 15% |
| Gold ring | 38 99% 60% | 38 92% 58% |

---

## Typography

### Font Stack
| Role | Arabic | English |
|------|--------|---------|
| Display/Hero | Cairo 800-900 | Inter 700-800 / Playfair Display |
| Headings | Cairo 700 | Inter 600-700 |
| Body | Cairo 400 / Tajawal | Inter 400-500 |
| UI/Labels | Cairo 600 | Inter 500-600 |
| Numbers | Inter | Inter |

### Fluid Scale
| Token | Size (clamp) | Weight | Leading |
|-------|-------------|--------|---------|
| hero | clamp(2.5, 5vw+1, 4.5rem) | 800 | 1.1 |
| h1 | clamp(2, 4vw+0.5, 3.5rem) | 700 | 1.2 |
| h2 | clamp(1.5, 3vw+0.5, 2.5rem) | 700 | 1.25 |
| h3 | clamp(1.25, 2vw+0.5, 2rem) | 600 | 1.3 |
| body | clamp(1, 1.5vw, 1.125rem) | 400 | 1.6 |

---

## Animation System

### Keyframes
| Name | Duration | Curve | Purpose |
|------|----------|-------|---------|
| fadeIn | 0.5s | ease-out | General entry |
| fadeInUp | 0.6s | ease-out | Content reveal |
| fadeInDown | 0.6s | ease-out | Header reveal |
| scaleIn | 0.3s | ease-out | Modal open |
| slideInRight | 0.4s | ease-out | RTL panel |
| slideInLeft | 0.4s | ease-out | LTR panel |
| menuDrawerOpen* | 0.5s | cubic-beizer(0.22,1,0.36,1) | 3D door-swing |
| pulseGold | 2s | ease-in-out infinite | CTA attention |
| shimmer | 2s | linear infinite | Skeleton loading |
| float | 3s | ease-in-out infinite | Doodle float |
| doodleFloat | 30s | ease-in-out infinite | Background float |
| heroViewportBreath | 20s | ease-in-out alternate | Viewport slide |
| productCardCheckIn | 0.35s | cubic-beizer(0.22,1,0.36,1) | Added-to-cart check |

### The Wilson Curve
The standard easing curve used across Wilson: `cubic-bezier(0.22, 1, 0.36, 1)` — fast start, slow finish. Used for menu drawer, product card check, hero art entrance.

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
All animations degrade gracefully — no content depends on motion.

---

## Accessibility

### Touch Targets
- Minimum 44×44px for all interactive elements
- Buttons have adequate padding for mobile

### Focus States
- 2px gold ring (`hsl(var(--ring))`)
- 2px offset
- Visible on all interactive elements

### Contrast
- Body text on gold backgrounds uses gold-600+ or neutral-900
- Primary CTAs use gold-500 background with dark text (28 25% 14%)
- WCAG 2.1 AA compliant for all text sizes

### RTL
- `dir="rtl"` on `<html>`
- Logical CSS properties (ps-, pe-, ms-, me-, start, end)
- Direction-aware animations (menu drawer swings from correct hinge)
- Arabic-optimized line heights (1.5-1.8 body, 1.2-1.4 headings)
- Heavier Arabic font weights for headings (800 vs 700 English)
