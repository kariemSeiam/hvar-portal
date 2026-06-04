# Wilson Egypt — RTL/LTR Standards

> Perfect bidirectional support: AR → RTL, EN → LTR.

## How It Works

- **LanguageProvider** sets `document.documentElement.dir` and `lang` on `<html>`
- **App** root uses `dir={dir}` for consistency
- **AdminLayout** sets `dir` on its root (admin can differ from customer in future)

## Rules (Every Section)

### 1. Use Logical Properties — Never Physical

| ❌ Avoid | ✅ Use |
|----------|--------|
| `left-4`, `right-4` | `start-4`, `end-4` |
| `ml-2`, `mr-2` | `ms-2`, `me-2` |
| `pl-4`, `pr-4` | `ps-4`, `pe-4` |
| `text-left`, `text-right` | `text-start`, `text-end` |
| `margin-left`, `margin-right` | `margin-inline-start`, `margin-inline-end` |

### 2. Positioning

- **Absolute/Fixed**: `start-0`, `end-0`, `inset-x-0` (avoid `left-0` `right-0`)
- **FABs, Badges**: `bottom-4 end-4` or `top-3 start-3`

### 3. Text Alignment

- Default body: inherits from `dir`
- Sections: `text-start` (follows dir automatically)
- Numbers, phones: wrap in `<span dir="ltr">` or `dir="ltr"` on parent

### 4. Flex Direction

- When content order must flip: `rtl:flex-row-reverse`
- Avoid: `isRTL ? 'flex-row-reverse' : ''` — use `rtl:` instead

### 5. Icons With Direction

- Arrows: `rotate-180 rtl:rotate-0` or `rtl:rotate-180` based on meaning
- Chevrons: mirror with `rtl:rotate-180` when pointing "forward"

### 6. Containers (globals.css)

- `margin-inline: auto`, `padding-inline: 1rem`

### 7. Borders

- Use `border-e`, `border-s` (inline-end, inline-start)
- Avoid `border-l`, `border-r` for directional borders

### 8. Sheet/Drawer Side

- `side={isRTL ? 'left' : 'right'}` — Sheet API uses physical sides

## Checklist for New Components

- [ ] No `left`/`right`/`ml`/`mr`/`pl`/`pr` for directional layout
- [ ] `text-start` or `text-end` instead of `text-left`/`text-right`
- [ ] `start-`/`end-` for positioned elements
- [ ] Phone numbers, codes: `dir="ltr"`
- [ ] `rtl:` for flex/transform that must flip
