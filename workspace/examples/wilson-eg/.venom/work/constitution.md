# Project Constitution — Wilson Egypt

**Quality:** Every change must not break existing functionality. Backend has 1 unittest file (test_api_endpoints.py) — must pass after any backend change. Frontend has vitest + playwright — must pass after frontend changes. No regressions on RTL/AR behavior. No changes to database schema without explicit approval (no migration system exists).

**Performance:** Mobile header must not increase Time to Interactive. New components must be lazy-loaded or code-split. No additional blocking network requests on initial page load. Cart badge must update reactively (existing CartContext). Drawer open/close must feel instant (<100ms perceived).

**Constraints:**
- Backend is a single 3450-line Flask file — no backend restructuring in this feature
- Frontend is React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui
- Must preserve RTL/LTR bilingual support (Arabic default)
- Must preserve Egyptian Gold branding (#FEB636)
- Must not break existing CartContext, AuthContext, LanguageContext
- Deploy target is PythonAnywhere — no server-side changes beyond existing app.py
- CartFab currently exists and handles cart on mobile — must be replaced cleanly
- Trust bar marquee is a brand element — cannot be removed entirely, only repositioned
- Phone number (010 80755516) and WhatsApp link must remain accessible

**Ratified:** 2026-04-04
