# Wilson Egypt — Design System (.pen)

VENOM cycle: Full frontend restructure with Pencil MCP.

## Real Brand Palette

**From official Wilson ads:** **Gold with silver** — bright gold (#E8A317) for CTAs/logo + brushed silver (#B8B8B8) for product accents. See [REAL-WILSON-PALETTE.md](./REAL-WILSON-PALETTE.md).

## First File: Wilson Design System + Homepage

**Save your open Pencil document as:** `wilson-design-system.pen`

### Contents
- **Design tokens:** Gold #E8A317 + Silver on slate background
- **Components:** Button (Primary, Outline), Product Card, Product Card Compact (mobile)
- **Homepage:** Header, Hero, **5 category sections** (vertical) each with **horizontal product row**
  - الثلاجات والفريزرات | البوتوجازات | مبردات المياه | المكانس | أجهزة منزلية
- **Mobile:** 375px viewport — horizontal scroll per category
- **Breakpoints:** 375 | 768 | 1024 | 1440

### Rebrand-ready
Tokens are structured so colors/fonts can be swapped for future branding changes.

### Background Grids (Light / Dark)

Use on sections for creative backgrounds. Theme-aware via CSS vars.

| Class | Light | Dark |
|-------|-------|------|
| `bg-grid-dots` | Silver dots on slate | Gold dots on charcoal |
| `bg-grid-lines` | Soft silver lines | Muted gold lines |
| `bg-grid-mesh` | Dots + gradient vignette | Dark mesh + gold accent |
| `bg-grid-hex` | Diamond/hex lines | Hex + gold nodes |
| `bg-grid-cross` | Plus/cross pattern | Cross pattern |

Default app background uses `bg-grid-dots`. Add `bg-grid-noise` for subtle texture.

### Next Phase
- Products page
- Product detail
- Cart / Checkout
- Admin layouts
- Mobile viewports
