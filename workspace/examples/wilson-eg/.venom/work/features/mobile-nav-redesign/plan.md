# Mobile Navigation Redesign — Implementation Plan

## Architecture

**Current:** Trust bar (36px) → Header (64px, logo + hamburger) → Content → Footer → CartFab (floating)

**New:** Trust bar (2px on mobile / 36px on tablet+) → Header (64px, logo + search + cart + hamburger) → Content → Footer → BottomNav (56px, mobile only)

The drawer (Sheet) remains but gains: close button, search input at top. CartFab is deleted.

## Component Changes

### New Components

**`BottomNav.tsx`** — Fixed bottom bar, 5 items, mobile only (<1024px)
- Props: none (reads from contexts)
- Uses: `useCart()` for badge, `useAuth()` for account state, `useLanguage()` for RTL/labels, `useLocation()` for active state
- Items: Home (`/`), Products (`/products`), Cart (`/cart` with badge), Wishlist (`/wishlist`), Account (`/account` or `/login`)
- Active state: gold icon + gold underline
- Hidden on `/cart` and `/checkout` pages (same as CartFab behavior)
- Hidden on admin routes
- Height: 56px + `safe-area-inset-bottom`
- CSS: `.bottom-nav`, `.bottom-nav-item`, `.bottom-nav-item--active`, `.bottom-nav-badge`

**`SearchOverlay.tsx`** — Full-width search bar sliding from header
- Props: `open: boolean`, `onClose: () => void`
- Uses: `useLanguage()` for RTL/placeholder, `useNavigate()` from react-router
- Behavior: slides down from below header, covers content, has input + close button
- On submit: navigates to `/products?search=<query>`
- On close: clears input
- CSS: `.search-overlay`, `.search-overlay-input`, `.search-overlay-close`

### Modified Components

**`Header.tsx`** — Add search icon, cart icon to mobile header. Collapse trust bar on mobile.
- Add `Search` icon from lucide-react
- Add `useState` for search overlay open/close
- Mobile header bar: add search button + cart button (with badge) between logo and hamburger
- Trust bar: add conditional rendering — on mobile show thin gold line, on tablet+ show full marquee
- Add `SearchOverlay` component render
- Cart badge uses existing `itemCount` from `useCart()`
- Search button opens overlay, cart button navigates to `/cart`

**`Sheet.tsx`** — Add optional close button for menu variant
- `showClose` prop already exists but is set to `false` for menu variant
- Change: when `variant="menu"`, still render close button if `showClose` is not explicitly `false`
- Actually: simpler — just change Header.tsx to pass `showClose={true}` for menu variant

**`Layout.tsx`** — Add BottomNav, remove CartFab
- Import `BottomNav` instead of `CartFab`
- Render `<BottomNav />` at the bottom of the layout

### Removed Components

**`CartFab.tsx`** — Deleted. Replaced by bottom nav cart item + header cart icon.

## CSS Changes (globals.css)

**Add:**
- `.bottom-nav` — fixed bottom bar, z-50, bg-background, border-top, safe-area padding
- `.bottom-nav-items` — flex row, justify-around, items-center
- `.bottom-nav-item` — flex-col, items-center, gap-0.5, min-h-44px touch target
- `.bottom-nav-item--active` — gold icon color, gold underline via ::after
- `.bottom-nav-badge` — small badge on cart item (similar to cart-fab-badge but smaller)
- `.search-overlay` — fixed, inset-0, z-40, slides from top, bg-background
- `.search-overlay-input` — full-width search input with gold focus ring
- `.search-overlay-close` — close button in overlay
- `.trust-bar-mobile` — 2px gold line visible only <768px
- `.trust-bar-desktop` — full marquee visible only ≥768px

**Modify:**
- `.header-main-bar` — mobile layout now has 4 elements (logo, search, cart, hamburger) instead of 2
- `.header-mobile-btn` — keep existing styles, add search/cart button styles

**Remove:**
- `.cart-fab` and all related styles (or leave orphaned — doesn't hurt)

## State Flow

- **Cart badge:** `CartContext.itemCount` → BottomNav cart item + Header cart icon. Same source, two consumers.
- **Search overlay:** Local state in Header.tsx (`isSearchOpen`). Opens via header search button, closes via overlay X or Escape key.
- **Drawer:** Existing `isMenuOpen` state in Header.tsx. Unchanged.
- **Active nav item:** `useLocation().pathname` → compared against each nav item path. Exact match for home, startsWith for others.

## RTL Considerations

- Bottom nav: items stay in same visual order (LTR: Home→Products→Cart→Wishlist→Account, RTL: same order but dir="rtl" on container). Icons are symmetric except Account — no change needed.
- Search overlay: input text direction follows `dir` attribute. Close button on trailing side.
- Header bar: logo stays at start (RTL: right, LTR: left), hamburger at end. Search and cart in between.
- Drawer: already RTL-aware via `side={isRTL ? 'right' : 'left'}` and `dir` prop. Unchanged.

## Accessibility

- Bottom nav: `<nav aria-label="Mobile navigation">` landmark
- Search overlay: `role="dialog"`, `aria-label="Search"`, focus trap, Escape to close
- Header search button: `aria-label="Search products"`
- Header cart button: `aria-label` includes item count
- Drawer: already has `aria-label="Main navigation"` on inner nav
- All touch targets ≥44px

## Migration Path

1. Create BottomNav.tsx + SearchOverlay.tsx (new files, no impact)
2. Add CSS for new components (new classes, no impact on existing)
3. Modify Header.tsx to add search/cart icons + search overlay (additive)
4. Modify Layout.tsx to add BottomNav + remove CartFab (swap)
5. Modify Sheet.tsx to support close button on menu variant (additive)
6. Delete CartFab.tsx
7. Test: vitest + playwright + manual RTL check

## File-by-File Change Plan

| File | Action | Changes |
|------|--------|---------|
| `src/components/layout/BottomNav.tsx` | CREATE | 5-item bottom nav, mobile only, reactive cart badge |
| `src/components/layout/SearchOverlay.tsx` | CREATE | Full-width search overlay, slides from header |
| `src/components/layout/Header.tsx` | MODIFY | Add search icon, cart icon, search overlay state, collapse trust bar on mobile |
| `src/components/layout/Layout.tsx` | MODIFY | Replace CartFab with BottomNav |
| `src/components/ui/Sheet.tsx` | MODIFY | Allow close button on menu variant |
| `src/styles/globals.css` | MODIFY | Add bottom nav, search overlay, trust bar mobile styles |
| `src/components/layout/CartFab.tsx` | DELETE | Replaced by bottom nav |
