# Styles — design system source of truth

**Single source of truth:** `design-tokens.css`. Tailwind and component CSS must align with it.

---

## Files


| File                | Role                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| `design-tokens.css` | Colors, typography, spacing, radius, shadows, motion. Use `var(--*)` only. |
| `scrollbar.css`     | .scrollbar-hide, .scrollbar-custom                                         |
| `index.css`         | Imports tokens → scrollbar → Tailwind → base → components                  |


---

## Rules

- No hardcoded hex/spacing; use tokens.
- Update `design-tokens.css` first; then `tailwind.config.js` to match.
- RTL: logical properties; `dir="rtl"` on layout.
- `prefers-reduced-motion` respected in tokens.

Migration: `bg-red-600` → `bg-brand-red-600`; `text-blue-500` → `text-brand-blue-500`. See [docs/design/design.md](../../docs/design/design.md).