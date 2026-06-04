# Design System

> MCRM design system implementation — the most evolved of the Hvar ecosystem.

---

## Design Language Summary

MCRM uses the **same brand-rose (#f43f5e) identity** as Hvar-OLD but is the most
advanced iteration — built specifically for **operations-heavy, scan-intensive,
status-driven service CRM** workflows.

### Key Differentiators vs Hvar-OLD

| Feature | Hvar-OLD | MCRM |
|---------|----------|------|
| Brand palette | brand-red 50-950 | brand-red 50-950 (identical scale) |
| Status colors | 5 semantic | 9 operative statuses (shipping, maintenance, active, busy, offline...) |
| Animations | fade, slide | Adds scanPulse (QR scanning), glow, shimmer |
| Glass effect | backdrop-blur glass | Explicitly removes blur, uses solid bg with border |
| Arabic utilities | None | `.arabic-card`, `.arabic-button`, `.arabic-input`, `.arabic-text` |
| Theme | 6 colors | 12 colors (adds full accent-green/amber/purple scales) |
| Shadow tints | 5 | 7 (adds brand-red deeper, accent-purple) |
| Typography | Cairo + Tajawal | Cairo (primary) + Roboto Mono for numbers |
| Spacing | up to 20 | up to 64 (more granular) |
| Radius | up to 2xl | up to 3xl (3xl for scan frames) |

---

## Design Tokens Source

**Single source of truth:** `front/src/styles/design-tokens.css`  
**Tailwind config:** `front/tailwind.config.js` (mirrors tokens for utility class generation)

Both files must stay in sync — the Tailwind config includes a comment warning:
> "When updating colors, update BOTH files."

---

## Color System

### Brand (Rose)
Full 11-step scale from 50 (#fff1f2) to 950 (#4c0519). Same as Hvar-OLD.

### Secondary (Blue)
Full 11-step scale from 50 (#f0f9ff) to 950 (#082f49).

### Accents (Full Scales)
Each accent has a complete 11-step scale (not just a single value):

| Accent | 500 (Base) | 600 (Active) | 700 (Hover) |
|--------|-----------|-------------|-------------|
| Green | #22c55e | #16a34a | #15803d |
| Amber | #f97316 | #ea580c | #c2410c |
| Purple | #a855f7 | #9333ea | #7e22ce |
| Red (ui-danger) | #ef4444 | #dc2626 | #b91c1c |

### UI Semantic Colors
| Token | 500 Value | Usage |
|-------|-----------|-------|
| ui-success | #22c55e | Completed, green badges |
| ui-warning | #f97316 | Pending, warning badges |
| ui-danger | #ef4444 | Errors, critical, cancellations |
| ui-info | #3b82f6 | Info badges, indicators |

### Status Operative Colors
| Token | Value | Purpose |
|-------|-------|---------|
| status-shipping | #8b5cf6 (purple-500) | Bosta tracking, in transit |
| status-maintenance | #f97316 (amber-500) | In workshop |
| status-completed | #10b981 (emerald-500) | Ticket closed |
| status-failed | #ef4444 (red-500) | Ticket failed |
| status-pending | #64748b (slate-500) | Awaiting action |
| status-processing | #3b82f6 (blue-500) | Being worked |
| status-active | #22c55e (green-500) | Live call session |
| status-busy | #f59e0b (amber-500) | Agent occupied |
| status-offline | #6b7280 (gray-500) | Agent logged out |

### Surface & Ink
| Token | Light | Dark |
|-------|-------|------|
| Page bg | #f9fafb (gray-50) | #111827 (gray-900) |
| Card bg | #ffffff | #1f2937 (gray-800) |
| Primary text | #111827 (gray-900) | #f9fafb (gray-50) |
| Secondary text | #4b5563 (gray-600) | #9ca3af (gray-400) |
| Border | #e5e7eb (gray-200) | #374151 (gray-700) |

---

## Typography

### Fonts
| Role | Font | Fallback |
|------|------|----------|
| Display/Headings | Cairo (700) | sans-serif |
| Body/UI | Cairo (400) | Tajawal, sans-serif |
| Numbers/Codes | Roboto Mono | monospace |
| Brand text | Cairo Play | (optional display) |

### Fluid Scale
| Token | Size (clamp) | Leading | Weight |
|-------|-------------|---------|--------|
| xs | clamp(0.75, 0.7+0.1vw, 0.8rem) | 1.5 | 400 |
| sm | clamp(0.875, 0.8+0.15vw, 0.9rem) | 1.5 | 400 |
| base | clamp(1, 0.95+0.2vw, 1.1rem) | 1.6 | 400 |
| lg | clamp(1.125, 1.05+0.25vw, 1.2rem) | 1.6 | 400 |
| xl | clamp(1.25, 1.2+0.3vw, 1.4rem) | 1.5 | 700 |
| 2xl | clamp(1.5, 1.4+0.4vw, 1.7rem) | 1.4 | 700 |
| 3xl | clamp(1.875, 1.7+0.5vw, 2.1rem) | 1.3 | 700 |
| 4xl | clamp(2.25, 2+0.6vw, 2.5rem) | 1.2 | 700 |
| 5xl | clamp(3, 2.5+0.7vw, 3.5rem) | 1.1 | 700 |
| 6xl | clamp(3.75, 3+0.8vw, 4.5rem) | 1.1 | 700 |

---

## Animation System

### Keyframes
| Name | Purpose |
|------|---------|
| `fadeIn` | 0→1 opacity |
| `slideUp` | 20px up + fade |
| `slideRight` | Right entrance (RTL: -20px→0) |
| `slideLeft` | Left entrance |
| `pulse` | Scale 1→1.05 idle |
| `bounce` | Jump 0→-10px |
| `float` | Hover 0→-10px infinite |
| `scanPulse` | QR scan frame glow — box-shadow 0→10px→0 |
| `glow` | Neon glow oscillation |
| `shimmer` | Loading skeleton sweep |

### Animation Classes
```
animate-fade-in     animate-slide-up    animate-slide-right
animate-slide-left  animate-pulse       animate-bounce
animate-float       animate-spin-slow   animate-scan-pulse
animate-glow        animate-shimmer
```

### Respects Reduced Motion
```css
@media (prefers-reduced-motion) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## RTL & Arabic Utilities

### Global Setup
```html
<html dir="rtl" lang="ar">
```

### Custom Plugin (from tailwind.config.js)
```css
html[dir="rtl"] { --start: right; --end: left; }
html[dir="ltr"] { --start: left; --end: right; }
```

### Arabic-Specific Utility Classes
| Class | Purpose |
|-------|---------|
| `.arabic-text` | Cairo font, right-align, RTL |
| `.arabic-number` | Roboto Mono for digits, LTR direction, bidi-embed |
| `.arabic-card` | Card with 3xl radius, shadow, hover lift |
| `.arabic-button` | Cairo 600, rounded-xl, hover lift, press feedback |
| `.arabic-input` | Cairo, rounded-lg, focus ring |
| `.glass-effect` | Solid bg + border (explicitly NO blur) |

### Scan Frame
```css
.scan-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid #f43f5e;
  border-radius: 1rem;
  animation: scanPulse 2s ease-in-out infinite;
}
```

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| sm | 0 1px 2px rgba(0,0,0,0.05) | Cards |
| md | 0 4px 6px -1px rgba(0,0,0,0.1) | Elevated cards |
| lg | 0 10px 15px -3px rgba(0,0,0,0.1) | Modals |
| xl | 0 20px 25px -5px rgba(0,0,0,0.1) | Panels |
| 2xl | 0 25px 50px -12px rgba(0,0,0,0.25) | Overlays |
| red | brand-rose 20% | Brand glow |
| blue | brand-blue 20% | Info glow |
| green | green 20% | Success glow |
| amber | amber 20% | Warning glow |
| purple | purple 20% | Premium glow |
| brand-red | brand-rose 25% | Deeper brand glow |
