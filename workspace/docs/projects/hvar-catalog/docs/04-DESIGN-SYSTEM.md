# Design System

> How the visual design is implemented: Tailwind config, theming, RTL, dark mode.

---

## Design Language Summary

Hvar-Catalog uses a **premium red brand theme** with gradient accents, glass
morphism, and Arabic-first typography. The design language is intentionally
more expressive than the Hvar-POS — this is a consumer-facing showcase, not
a business tool.

**Key characteristics:**
- **Red primary** (#ef4444) — bold, emotional, high-contrast
- **Gradients everywhere** — buttons, badges, icons, backgrounds, text
- **Glass effects** — backdrop-blur on cards, headers, dropdowns
- **Elevated shadows** — red-tinted glows for CTAs and premium elements
- **Rich motion** — float, pulse-glow, shimmer, slide-up, bounce-in
- **Diamond brand mark** — 45° rotated red gradient with white "H"

---

## Tailwind Configuration

**File:** `tailwind.config.js`

### Custom Colors

| Palette | Values | Usage |
|---------|--------|-------|
| `primary` (red) | 50→950 | #fef2f2 → #450a0a | All brand surfaces |
| `secondary` (pink) | 50→950 | #fdf2f8 → #500724 | Accent gradients |
| `accent` (green) | 50→950 | #f0fdf4 → #052e16 | Success/new badges |
| `hvar` (red) | 50→950 | #fef2f2 → #450a0a | (alias of primary) |

### Gradient Definitions

```
gradient-primary:   #ef4444 → #dc2626
gradient-secondary: #f093fb → #f5576c
gradient-premium:   #ef4444 → #b91c1c
gradient-hvar:      #ef4444 → #dc2626
gradient-success:   #4ade80 → #22c55e
gradient-warning:   #fbbf24 → #f59e0b
gradient-danger:    #f87171 → #ef4444
```

### Font Families

| Key | Font | Usage |
|-----|------|-------|
| `cairo` | Cairo | Primary Arabic (Latin + Arabic) |
| `display` | Cairo | Display/headings |
| `body` | Cairo | Body text |
| `mono` | ui-monospace | Code/SKU |
| `almarai` | Almarai | Premium Arabic display |
| `tajawal` | Tajawal | Premium Arabic body |
| `arabic-display` | Almarai | Arabic headlines |
| `arabic-body` | Tajawal | Arabic paragraphs |

The CSS also imports from Google Fonts:
```css
@import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800;900&family=Tajawal:wght@200;300;400;500;700;800;900&display=swap');
```

### Custom Shadows

| Shadow | Value | Usage |
|--------|-------|-------|
| `soft` | `0 2px 15px rgba(239,68,68,0.08)` | Cards |
| `medium` | `0 4px 25px rgba(239,68,68,0.12)` | Elevated cards |
| `strong` | `0 8px 40px rgba(239,68,68,0.16)` | Modals |
| `glow` | `0 0 30px rgba(239,68,68,0.3)` | Primary buttons |
| `glow-premium` | `0 0 40px rgba(239,68,68,0.4)` | Hero CTAs |

### Custom Animations

**Keyframes defined:**
- `float` — gentle vertical floating (6s, ease-in-out)
- `pulse-glow` — shadow oscillation red glow (2s)
- `shimmer` — horizontal shine sweep (2s, infinite)
- `slide-up` — fade in from below (0.6s)
- `slide-down` — fade in from above (0.6s)
- `scale-in` — grow from 0.9 (0.5s)
- `rotate-in` — rotate + scale entrance (0.6s)
- `bounce-in` — elastic scale bounce (0.8s)

---

## RTL Implementation

### Global
```html
<html lang="ar" dir="rtl">
```

### Tailwind RTL Utilities

```
space-x-4 rtl:space-x-reverse
left-3 → right: 0.75rem (RTL)
right-3 → left: 0.75rem (RTL)
```

### Component-Level RTL

The `dir` prop from `DesignSystemProvider` is used for:
- `text-right` / `text-left` toggling
- Icon positioning (search icon inside input)
- Arrow directions (left/right navigation)
- Animation origins (`origin-left` vs `origin-right`)

### Gradient Text Directions

Maintained as LTR even in RTL layout (brand styling choice).

---

## Dark Mode

### Implementation

`DesignSystemProvider` manages dark mode:

```jsx
const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
});

useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
}, [darkMode]);
```

### Tailwind Dark Variants

All components use `dark:` prefixes:

```jsx
className="bg-white dark:bg-gray-900
           text-gray-900 dark:text-white
           border-gray-200 dark:border-gray-700"
```

### Dark Mode Color Mapping

| Token | Light | Dark |
|-------|-------|------|
| `canvas` | `#ffffff` | `#0f172a` |
| `surface` | `#ffffff` | `#1e293b` |
| `surface-soft` | `#f8fafc` | `#334155` |
| `ink` | `#0f172a` | `#f8fafc` |
| `ink-secondary` | `#475569` | `#cbd5e1` |
| `ink-muted` | `#94a3b8` | `#64748b` |
| `hairline` | `#e2e8f0` | `#334155` |
| `primary` | `#ef4444` | `#ef4444` (unchanged) |

---

## Design System Provider

**File:** `src/design_system/DesignSystemProvider.jsx`

Provides context throughout the tree:

```jsx
const { darkMode, setDarkMode, dir, setDir } = useDesignSystem();
```

| Value | Type | Default | Description |
|-------|------|---------|-------------|
| `darkMode` | Boolean | `prefers-color-scheme` | Dark mode state |
| `setDarkMode` | Function | — | Toggle dark mode |
| `dir` | String | `'rtl'` | Text direction |
| `setDir` | Function | — | Change direction |

---

## CSS Utility Classes

**File:** `src/index.css` (~600 lines)

### Custom Classes

| Category | Classes |
|----------|---------|
| **Gradients** | `.text-gradient`, `.text-gradient-premium`, `.text-gradient-hvar` |
| **Typography** | `.font-display`, `.font-heading`, `.font-body`, `.font-caption` |
| **Arabic fonts** | `.font-arabic-light→black`, `.font-display-light→black` |
| **Glass** | `.glass`, `.glass-dark`, `.glass-card` |
| **Buttons** | `.btn-modern`, `.btn-product-primary`, `.btn-product-secondary` |
| **Cards** | `.card-modern`, `.card-masterpiece` |
| **Shadows** | `.shadow-soft→glow-premium` |
| **HVAR Logo** | `.hvar-logo`, `.hvar-logo-diamond`, `.hvar-logo-text` + variants (sm, lg, xl) + animations |
| **Skeleton** | `.skeleton-card`, `.skeleton-card-dark`, `.loading-shimmer` |
| **Grid** | `.grid-auto-fit`, `.grid-auto-fill`, `.grid-responsive` |
| **Animations** | `.animate-float→bounce-in` |
| **Accessibility** | `.focus-ring`, `.sr-only`, `.focus-visible` |
| **Scroll** | `.scrollbar-hide`, `.horizontal-scroll-container` |
| **Section** | `.section-divider`, `.space-section`, `.category-separator` |
| **Icons** | `.icon-container`, `.icon-container-primary→info` |
