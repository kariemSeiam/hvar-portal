# Design System

> Implementation details: Tailwind config, CSS variables, theming, RTL.

---

## Design Language Summary

Hvar-OLD uses a **brand-rose (#f43f5e) admin dashboard aesthetic** — professional,
data-dense, status-first, with full dark mode and RTL support. Unlike Hvar-Catalog's
consumer-facing expressiveness or Hvar-POS's utilitarian green, this is an
**internal enterprise tool** designed for operators working 8-hour shifts.

**Key characteristics:**
- **Rose primary** (#f43f5e → #e11d48) — actions, links, active states
- **Blue secondary** (#0ea5e9) — info, analytics, non-primary CTAs
- **Status-driven** — 5 semantic colors (success, warning, danger, info, primary)
- **Data density** — compact tables, collapsible filters, expandable rows
- **Glass-morphism** — header backdrop-blur, dropdown panels
- **Fluid everything** — CSS `clamp()` for all spacing, typography, radius
- **Collapsible sidebar** — default collapsed, saves screen real estate
- **Minimal animations** — fade/slide for dropdowns, no decorative motion

---

## Tailwind Configuration

**File:** `tailwind.config.js` (~300 lines)

### Brand Colors

Only the brand-rose scale and accent colors are custom. Everything else uses
Tailwind defaults (gray, green, amber, red, blue, purple).

| Palette | Base | Dark Hover | Usage |
|---------|------|------------|-------|
| `brand-red` (rose) | 50→950 | #fff1f2→#4c0519 | Primary actions, links |
| `brand-blue` | 50→950 | #f0f9ff→#082f49 | Secondary, info |
| `accent-green` | 50→950 | #f0fdf4→#052e16 | Success states |
| `accent-amber` | 50→950 | #fff7ed→#431407 | Warning states |
| `accent-purple` | 50→950 | #faf5ff→#3b0764 | Premium/analytics |
| `ui-success` | 50→950 | #f0fdf4→#052e16 | Semantic success |
| `ui-warning` | 50→950 | #fff7ed→#431407 | Semantic warning |
| `ui-danger` | 50→950 | #fef2f2→#450a0a | Semantic danger |
| `ui-info` | 50→950 | #eff6ff→#172554 | Semantic info |

### Typography (Fluid with clamp)

| Scale | Size | Line Height |
|-------|------|-------------|
| `text-xs` | clamp(0.7rem, 0.7rem+0.1vw, 0.8rem) | 1.4 |
| `text-sm` | clamp(0.8rem, 0.8rem+0.1vw, 0.9rem) | 1.4 |
| `text-base` | clamp(1rem, 0.95rem+0.2vw, 1.1rem) | 1.5 |
| `text-lg` | clamp(1.1rem, 1.05rem+0.25vw, 1.2rem) | 1.5 |
| `text-xl` | clamp(1.2rem, 1.15rem+0.3vw, 1.35rem) | 1.4 |
| `text-2xl` | clamp(1.4rem, 1.35rem+0.4vw, 1.6rem) | 1.3 |
| `text-3xl` | clamp(1.7rem, 1.6rem+0.5vw, 2rem) | 1.3 |
| `text-4xl` | clamp(2rem, 1.85rem+0.6vw, 2.4rem) | 1.2 |
| `text-5xl` | clamp(2.5rem, 2.25rem+0.7vw, 3rem) | 1.1 |
| `text-6xl` | clamp(3rem, 2.75rem+0.8vw, 3.75rem) | 1.1 |

**Font families:**
- `font-cairo` / `font-display` — Cairo (headings, display)
- `font-tajawal` / `font-sans` — Tajawal (body, UI)

### Spacing (Fluid with clamp)

| Spacing | Desktop | Description |
|---------|---------|-------------|
| 1 | 4px | Micro space |
| 2 | 8px | Tight inset |
| 3 | 12px | Inner padding |
| 4 | 16px | Base inset |
| 5 | 20px | Card padding |
| 6 | 24px | Section gap |
| 8 | 32px | Section space |
| 10 | 40px | Page section |
| 12 | 48px | Major gap |

### Shadows

| Shadow | Value | Use |
|--------|-------|-----|
| `shadow-sm` | 0 1px 2px black/5% | Cards |
| `shadow-md` | 4px 6px black/10% | Elevated cards |
| `shadow-lg` | 10px 15px black/10% | Modals |
| `shadow-xl` | 20px 25px black/10% | Panels |
| `shadow-2xl` | 25px 50px black/25% | Overlays |
| `shadow-red` | 0 4px 14px brand-red/20% | Branded glow |
| `shadow-blue` | 0 4px 14px brand-blue/20% | Info glow |
| `shadow-green` | 0 4px 14px green/20% | Success glow |

---

## CSS Variables

**File:** `src/index.css`

### System Variables

```css
:root {
  /* Brand colors (full 50-950 scale for brand-red and brand-blue) */
  --color-brand-red-500: #f43f5e;
  --color-brand-red-600: #e11d48;
  
  /* Semantic colors */
  --color-success-500: #22c55e;
  --color-warning-500: #f97316;
  --color-error-500: #ef4444;
  --color-info-500: #3b82f6;
  
  /* Surfaces */
  --color-bg-light: var(--color-gray-50);
  --color-bg-dark: var(--color-gray-900);
  --color-bg-card-light: #ffffff;
  --color-bg-card-dark: var(--color-gray-800);
  
  /* Typography */
  --font-family-primary: 'Cairo', 'Tajawal', sans-serif;
  --font-family-secondary: 'Tajawal', 'Cairo', sans-serif;
  
  /* Fluid spacing (clamp-based) */
  --space-4: clamp(1rem, 0.8rem + 0.4vw, 1.2rem);
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-normal: 250ms;
  --transition-slow: 350ms;
}
```

---

## Dark Mode

**Implementation:** `ThemeProvider` toggles `dark` class on `<html>`.

```js
// Auto-detect
window.matchMedia('(prefers-color-scheme: dark)').matches

// Persisted in localStorage
localStorage.getItem('theme')  // 'light' | 'dark'
```

**CSS:**
```css
.dark body {
  color: var(--color-gray-100);
  background-color: var(--color-bg-dark);
}
```

**Tailwind pattern used everywhere:**
```jsx
className="bg-white dark:bg-gray-800
           text-gray-700 dark:text-gray-200
           border-gray-200 dark:border-gray-700"
```

---

## RTL Implementation

### Global
```html
<html lang="ar" dir="rtl">
```

Applied both in HTML and via `ThemeProvider`:
```js
document.documentElement.dir = direction;  // 'rtl' | 'ltr'
document.documentElement.lang = direction === 'rtl' ? 'ar' : 'en';
```

### Tailwind Plugin

The Tailwind config uses a custom plugin to set CSS variables for start/end:
```css
html[dir="rtl"] { --start: right; --end: left; }
html[dir="ltr"] { --start: left; --end: right; }
```

### Component Patterns

```jsx
// Icon positioning
direction === 'rtl' ? 'right-0' : 'left-0'

// Auto margin for RTL
'rtl:mr-0 rtl:ml-2'
'rtl:space-x-reverse'

// Mobile menu animation
direction === 'rtl' ? 'translate-x-full' : '-translate-x-full'
```

---

## Animation System

**File:** `src/index.css` — Custom keyframes + Tailwind config shortcuts

```css
@keyframes fadeIn { 0%→opacity:0 → 100%→opacity:1 }
@keyframes slideUp { translateY(20px)→0 + opacity }
@keyframes slideRight { translateX(-20px)→0 }
@keyframes slideLeft { translateX(20px)→0 }
@keyframes scaleIn { scale(0.8)→scale(1) }
@keyframes bounceIn { scale(0.3)→scale(1.05)→scale(0.9)→scale(1) }
@keyframes float { translateY(0)→(-10px) }
```

**Tailwind animation classes:**
```
animate-fade-in    → fadeIn 300ms ease-out
animate-slide-up   → slideUp 300ms ease-out
animate-slide-right → slideRight 300ms ease-out
animate-pulse      → scale 2s infinite
animate-float      → translateY 3s infinite
animate-bounce     → translateY 1s infinite
animate-spin-slow  → spin 3s linear infinite
```

**Respects reduced motion:**
```css
@media (prefers-reduced-motion) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
