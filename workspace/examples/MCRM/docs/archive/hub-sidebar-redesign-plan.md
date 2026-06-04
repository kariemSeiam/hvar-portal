# Hub Sidebar — Full Collapsible States Redesign Plan

> Redesign collapsed + expanded states to meet real UX/accessibility standards.

---

## 1. Goal

Apply industry and WCAG standards to the Hub sidebar so both collapsed and expanded states are:

- **Discoverable** — Purpose of each item is clear
- **Accessible** — Keyboard, focus, reduced motion, ARIA
- **Usable** — Touch targets, contrast, RTL
- **Consistent** — Design tokens, no magic numbers

---

## 2. Standards (Research-Based)

| Standard | Source | Target |
|----------|--------|--------|
| Touch target size | WCAG 2.2 AAA | Min 44×44px (prefer 48×48px) |
| Focus visible | WCAG 2.1 | `:focus-visible` ring, no `outline: none` without alternative |
| Reduced motion | web.dev, prefers-reduced-motion | `transition-duration: 0` when user prefers reduced motion |
| Collapsed width | Common pattern | 56–64px for icon-only rail |
| Expanded width | Common pattern | 280–320px |
| Focus management | web.dev sidenav | Focus trap when open, return focus on close |
| Escape to close | web.dev | Already implemented ✓ |
| Backdrop on mobile | web.dev | Overlay to close when expanded on small viewport |

---

## 3. Current State

- **Expanded:** w-80 (320px), full content (camera, scan input, mode buttons)
- **Collapsed:** translateX to reveal ~4rem (64px), icon + micro-labels
- **Animation:** transform-only, 200ms, no prefers-reduced-motion
- **Mobile:** No backdrop; sidebar expands over content
- **Touch targets:** min-h-3.5rem (56px) ✓

---

## 4. Redesign Tasks

### 4.1 Motion & Accessibility

- [ ] **A1** Add `prefers-reduced-motion` support  
  - Use CSS var `--sidebar-transition-duration`  
  - In `@media (prefers-reduced-motion: reduce)` set to `0ms`  
  - Apply to sidebar and main content margin

- [ ] **A2** Ensure focus styles  
  - Use `:focus-visible` on all interactive elements  
  - Add `ring-2 ring-offset-2` (or equivalent) for focus ring

### 4.2 Collapsed State (Icon Rail)

- [ ] **C1** Standardize collapsed width  
  - Use `4rem` (64px) explicitly for collapsed rail  
  - Ensure all buttons meet 44×44px minimum

- [ ] **C2** Improve label legibility  
  - Use `text-[10px]` (instead of 9px) if readability is an issue  
  - Ensure contrast ≥ 4.5:1 (WCAG AA)

- [ ] **C3** Consistent spacing  
  - Use design tokens: `var(--spacing-2)`, `var(--spacing-3)` where available  
  - Or stick to Tailwind scale: `gap-2`, `space-y-2`, `p-2`

### 4.3 Expanded State

- [ ] **E1** Header consistency  
  - Keep title + nav; ensure toggle button has min 44×44px touch target

- [ ] **E2** Section hierarchy  
  - Use `role="region"` and `aria-label` for camera, scan, modes, status  
  - Logical heading order (h2 for sections)

### 4.4 Mobile (< 1024px)

- [ ] **M1** Backdrop overlay  
  - When sidebar expanded on mobile, add semi-transparent backdrop behind it  
  - Clicking backdrop closes sidebar  
  - Backdrop: `fixed inset-0 bg-black/30 z-30`

- [ ] **M2** Full-width or overlay behavior  
  - Option A: Sidebar overlays content (current) + backdrop  
  - Option B: Sidebar pushes content (requires layout shift)  
  - Recommend A: overlay + backdrop for consistency with web.dev pattern

### 4.5 Design Tokens

- [ ] **D1** Replace magic values where feasible  
  - Collapsed width: `4rem` or `var(--sidebar-collapsed-width)`  
  - Expanded width: `20rem` or `var(--sidebar-expanded-width)`  
  - Colors: use `--color-*` from design-tokens.css where applicable

---

## 5. Implementation Order

1. **A1 + A2** — Motion + focus (accessibility baseline)
2. **M1** — Backdrop on mobile (high-impact UX)
3. **C2** — Label legibility (quick win)
4. **D1** — Design tokens (maintainability)
5. **E2** — ARIA regions (accessibility polish)

---

## 6. Files to Modify

| File | Changes |
|------|---------|
| `HubPage.jsx` | Backdrop, prefers-reduced-motion, focus styles, ARIA |
| `design-tokens.css` | Optional: `--sidebar-collapsed-width`, `--sidebar-expanded-width`, `--sidebar-transition-duration` |
| `index.css` or global | `@media (prefers-reduced-motion)` override for sidebar |

---

## 7. Risks

- **Backdrop z-index:** Must be below sidebar (z-40) but above main content; ensure no conflicts
- **RTL:** Backdrop and sidebar are right-aligned; verify RTL layout

---

## 8. Done When

- [x] Sidebar respects `prefers-reduced-motion` (design-tokens + --sidebar-transition-duration)
- [x] All buttons have visible focus styles (focus-visible:ring-2 ring-blue-500)
- [x] Mobile: backdrop closes sidebar on click
- [x] Collapsed labels meet contrast requirements (text-[10px], opacity-90)
- [x] ARIA regions for screen readers (role="region", role="group", aria-label)

---

**Implemented:** 2025-02-01
