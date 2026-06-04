# Mobile Navigation Redesign — Specification

## Problem
Mobile users on Wilson Egypt's storefront have poor navigation UX. The header shows only a logo and hamburger button. Cart is accessible only via a floating FAB. There is no search. The trust bar wastes 36px of vertical space. No bottom navigation exists — forcing users to reach to the top of the screen for every action. This violates every modern mobile e-commerce standard (Amazon, Noon, Jumia all use bottom nav + visible search).

## User Stories
1. As a mobile shopper, I want to search for products from any page so I can find what I need without browsing.
2. As a mobile shopper, I want to see my cart count in the header so I know what I've added without scrolling.
3. As a mobile shopper, I want a bottom navigation bar so I can reach key pages with my thumb.
4. As a mobile shopper, I want to close the menu drawer with a visible X button so I don't have to guess to tap the overlay.
5. As a mobile shopper, I want to see categories with visual hierarchy in the drawer so I can distinguish them at a glance.
6. As a mobile user, I want the trust bar to not waste screen space on my phone so I can see more products.
7. As an RTL user, I want all navigation elements to flip correctly so the experience feels native in Arabic.

## Functional Requirements
- Bottom nav: 5 items (Home, Products, Cart with badge, Wishlist, Account), visible only <1024px, 56px height + safe-area-inset-bottom, gold active state
- Search: icon button in header bar opens full-width overlay with input + close button. Overlay feeds `/products?search=...`. Drawer also has search input at top.
- Header bar (mobile): Logo + search icon + cart icon (with badge) + hamburger. Height 64px + safe-area-inset-top.
- Trust bar: on mobile (<768px), collapse marquee to 2px gold accent line. Full marquee visible on tablet+.
- Drawer: add X close button in header. Add search input above nav links. Categories remain as pills but with better spacing.
- CartFab: removed entirely. Cart access via bottom nav + header cart icon.
- All new elements must support RTL/LTR switching without layout breakage.
- Cart badge must be reactive (existing CartContext.itemCount).

## Out of Scope
- Backend changes (no API changes)
- Desktop navigation changes (desktop nav stays as-is)
- Category icons (pills stay text-only for now)
- Search autocomplete or suggestions
- Payment flow changes
- Admin panel changes

## Success Criteria
- Mobile user can search from any page within 1 tap
- Cart count visible in header bar on mobile
- Bottom nav provides thumb-reach access to Home, Products, Cart, Wishlist, Account
- Drawer has visible close button
- Trust bar does not consume >4px on phones <768px
- All existing functionality preserved (cart, auth, language toggle, theme toggle, WhatsApp, phone)
- No RTL regressions
- Frontend tests pass (vitest + playwright)
- No increase in initial bundle size >5%
