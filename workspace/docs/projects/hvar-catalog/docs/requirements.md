## Project Requirements

> Living document. Update continuously as details are decided. Keep sections concise and actionable.

### Document Metadata

| Field | Value |
|---|---|
| Project | Hvar Catalog (هفار)
| Owner(s) | <product owner / tech lead>
| Version | 0.1 (draft)
| Status | Draft
| Last Updated | 2025-08-10

---

## 1. Overview

- **Summary**: Arabic-first, RTL single landing-page catalog and brand reference site for Hvar (هفار) small appliances. Showcases ~20 SKUs across categories (choppers, blenders/juicers, hand blenders, irons, stand mixers, ovens, grinders, vacuums, air fryers). Serves as authoritative reference for wholesale partners and consumers, and highlights bloggers’ reviews in a polished, trustworthy way. Includes limited-time promotions (e.g., free shipping) and a support & maintenance hub. No add-to-cart, checkout, login, or server-side features. Retail (consumer) prices are shown; wholesale pricing is out of scope.
- **Primary outcomes**:
  - Establish a credible, always-up-to-date reference for Hvar products in Arabic (RTL)
  - Aggregate and surface bloggers’ reviews to boost trust and conversion
  - Enable discovery via categories and search; drive contact/lead actions and support engagement
- **Success metrics (KPIs)**:
  - Click-throughs on contact actions (call, WhatsApp, email)
  - Engagement with reviews (plays/clicks) and quick-view opens
  - Support/maintenance hub visits and product detail quick views per session

## 2. Goals and Non-Goals

- **Goals**:
  - [ ] Launch an Arabic/RTL responsive single-page landing with product sections
  - [ ] Showcase bloggers’ reviews in a dedicated section
  - [ ] Provide search-like filtering within the page and a support & maintenance hub section
  - [ ] Provide clear contact CTAs (phone 01204444196, email info@hvarstore.com, social); no cart/checkout/login
  - [ ] Display clear retail consumer prices (EGP) only; no wholesale pricing or quote flows
  - [ ] Convince traders by surfacing model, wattage, capacity, materials, included accessories, and warranty at a glance
- **Non-Goals / Out of Scope (MVP)**:
  - Add-to-cart, checkout, payments, order tracking
  - Inventory/stock synchronization and ERP integration
  - User accounts/login

## 3. Scope

- **In-scope features**:
  - Arabic/RTL site with responsive layout (web + mobile)
  - On-page navigation: أقسام المنتجات (تصنيفات), مميز, مراجعات البلوجرز, الدعم الفني, اتصل بنا
  - Product sections with cards: image, model, name, category, price (EGP), key spec chips (wattage, capacity, material); optional old price/discount
  - Product detail shown via expandable drawer/modal or anchored section (no separate PDP)
  - On-page filter/search to jump to products/categories
  - Bloggers’ reviews: embeds/cards (YouTube/Instagram) linked to products
  - Support & Maintenance section: warranty info, service process, contact options
  - Contact info and social links in header/footer
- **Constraints / assumptions**:
  - Static client-only site; no server; data inlined or loaded from `public/data/*.json`
  - Currency EGP; Arabic numerals preferred; no VAT calc in UI
- **Dependencies**:
  - Build tool: Vite + React
  - Embeds: YouTube/Instagram oEmbed

## 4. Stakeholders and Users

- **Stakeholders**: Brand owner (Hvar), Marketing, Wholesale sales, Web ops
- **Primary user personas**:
  - Wholesale buyer: needs quick, accurate specs/prices to share internally
  - Consumer: wants trustworthy info and real reviews before contacting/purchasing
  - Blogger/influencer: wants their content featured cleanly with links back

## 5. User Stories and Acceptance Criteria

- As a visitor, I want to browse products by category, so I can find items quickly.
  - Acceptance:
    - [ ] Given I am on المتجر, when I select a category, then I see only products in that category
    - [ ] Products show image, name, price, old price, discount %, and badges
- As a visitor, I want to search in Arabic, so I can find a specific product.
  - Acceptance:
    - [ ] Search matches Arabic names and categories RTL-aware
    - [ ] Results page shows count and can be cleared
- As a consumer, I want to read bloggers’ reviews, so I can trust the product.
  - Acceptance:
    - [ ] Product detail shows embedded review cards with source (YouTube/Instagram)
    - [ ] Clicking a review opens the source in a new tab
- As a visitor, I want a quick view for any product, so I can see the key info fast and contact immediately.
  - Acceptance:
    - [ ] Clicking quick view opens a clean modal with images, key specs, price, and call/WhatsApp CTAs
- As a trader, I want to know what’s included and the key specs immediately, so I can decide fast.
  - Acceptance:
    - [ ] Cards show model/wattage/capacity/material chips and “محتويات العلبة” is one click away


## 6. Functional Requirements

1. RTL and Arabic-by-default layout across pages; set `lang="ar"` and `dir="rtl"`.
2. Promo banner component supports limited-time free-shipping message; dismissible; configurable start/end.
3. On-page navigation includes anchored sections: أقسام المنتجات, مميز, العروض, مراجعات البلوجرز, الدعم الفني, اتصل بنا.
4. On-page filter toggles categories; URL hash reflects current section/filter.
5. Product grid cards display: image, category, name, price (EGP), old price (strikethrough), auto-calculated discount %, and a “شحن مجاني” badge if enabled.
6. Product quick view (modal) includes: gallery, key specs, price, and direct call/WhatsApp CTAs.
7. Search supports Arabic text and diacritics-insensitive matching; highlights terms.
8. Bloggers’ reviews module with cards or embeds (YouTube/Instagram). Each review links to the source and the related product.
9. Support & Maintenance page provides warranty details, maintenance process steps, and clear CTAs to contact support (phone/email/WhatsApp); optional request form link.
10. Footer includes contact info (info@hvarstore.com), social links (Facebook, Instagram, YouTube), rights text, and navigation shortcuts.
11. Pricing displayed in EGP with proper thousands separator; discount percent derived from original/current price.
12. Badges system supports “شحن مجاني”, “جديد”, and “عرض خاص”.
13. Content managed via versioned JSON files for MVP: products, categories, reviews, support_info, promos.
14. SEO: Arabic meta tags, Open Graph, product structured data (JSON-LD) for name, image, price.
15. Analytics events: banner clicks, review interactions, contact CTA clicks (call/email/WhatsApp), support interactions, spec sheet downloads, quote requests.
16. Accessibility: keyboard navigable menus, focus styles, alt text for images, ARIA for interactive components.
17. Performance: lazy-load images, responsive images, code-splitting; target LCP < 2.5s on mid devices.
18. Error states: empty category, missing media, unavailable product — show helpful messages in Arabic.
19. Internationalization readiness: future English locale without breaking RTL base.
20. Admin-only route (optional later) for content preview; not required for MVP.

## 7. Information Architecture & Navigation

- **Sitemap / IA**:
  - الصفحة الرئيسية (هبوط)
    - أقسام المنتجات (تصنيفات): مكواه, مكنسة كهربائية, قلاية كهربائية, كبه, الخلاطات و العصارات, فرن, مطحنة, عجانات
    - مميز, العروض
    - مراجعات البلوجرز
    - الدعم الفني (Support & Maintenance)
    - اتصل بنا
- **Navigation rules**:
  - Sticky header with search and category dropdown; promo banner above header
  - Footer mirrors primary links, shows contact and social; do not imply presence/absence of physical branches

## 8. Data Model

- **Entities**:
  - Product: id, slug, name_ar, category_slug, images[], price_current_egp, price_original_egp, badges[], specs{key:value}, description_ar, warranty_months, free_shipping (bool)
  - Category: slug, name_ar, description_ar, image
  - Review: id, product_id, platform (youtube|instagram|other), url, title_ar, quote_ar, thumbnail, published_at
  - SupportInfo: warranty_months_default, service_hub_description_ar, contact_channels[]
  - Promotion: id, title_ar, message_ar, starts_at, ends_at, active (bool)
- **Relationships**:
  - Product belongs to Category; Review belongs to Product; Part belongs to Product; Promotion is global or per product
- **Validation rules**:
  - price_original_egp >= price_current_egp when both present; discount derived not stored

## 9. API Requirements

- **Data source (MVP)**: Static JSON under `public/data/` or inlined data in the bundle loaded at runtime
- **Future**: Optional headless CMS for products and reviews
- **Auth**: None for MVP (public catalog)
- **Rate limits**: N/A (static hosting)

## 10. Integrations

- YouTube/Instagram embeds for reviews; graceful fallbacks (thumbnail + external link)
- Google Maps link-outs on branches (optional embed later)

## 11. UI/UX Requirements

- **Design language**: Use existing theme colors and layout. Minimal animations. Consistent sizing/padding. Responsive web/mobile.
- **Interaction**: Main actions visible by default; no action hidden behind expansion only.
- **Components**:
  - Promo banner (dismissible)
  - Category menu (RTL dropdown)
  - Product card with discount ribbon and free-shipping badge
  - Reviews carousel/grid with platform badges
- **States**: loading, empty, error, success — all copy in Arabic

## 12. Accessibility (WCAG 2.2 AA, WCAG 3–ready)

- Language & direction: set `lang="ar"` and `dir="rtl"` on `<html>`; semantic landmarks (`header`, `nav`, `main`, `footer`) and correct heading order.
- Keyboard: all interactive elements are reachable and operable by keyboard; no traps; logical tab order.
- Focus visibility (2.4.13) and not obscured (2.4.11): clear, high-contrast focus style; focus indicator is not hidden by sticky bars/banners.
- Target size (2.5.8): interactive targets are ≥ 24×24 CSS px (chips, icons, buttons), except WCAG-allowed exceptions.
- Pointer/gestures (2.5.7): avoid drag-only interactions; provide click/tap alternatives.
- Contrast: text contrast ≥ 4.5:1 (normal), ≥ 3:1 (large); non-text UI components and states ≥ 3:1 (1.4.11).
- Motion: respect `prefers-reduced-motion`; disable non-essential animations; no autoplay with sound.
- Live updates: announce async changes (filter/search results, promo banner) via polite ARIA live regions; maintain focus context.
- Forms (if present): programmatic labels, helpful errors; avoid redundant re-entry (3.3.7); consistent help availability (3.2.6).
- Media: embedded reviews do not autoplay with sound; provide titles and accessible names; captions handled by platform where possible.

## 13. Performance & Reliability

- **Budgets**: LCP < 2.5s, TTI < 3.5s on mid-range mobile over 4G; CLS < 0.1
- **Assets**: code-splitting, lazy loading, responsive images, font preloading, caching
- **Resilience**: graceful error states for data fetches; retry once with backoff

## 14. Security & Privacy

- **AuthN/Z**: None for MVP
- **Data protection**: HTTPS enforced
- **Secrets**: None for MVP; future CMS keys kept in env vars
- **Privacy**: No PII storage; analytics anonymized

## 15. Localization & Internationalization

- **Locales**: Arabic (primary). English planned.
- **Formatting**: EGP currency, Arabic numerals
- **Content direction**: RTL across all components; ensure mirrored icons and layout

## 16. Configuration & Feature Flags

- **Runtime config**: promo message text, promo active window, free-shipping global toggle
- **Flags**: reviews module enable/disable, map embed enable/disable

## 17. Environments & Deployment

- Environments: dev, production
- Deployment: manual build and upload to static hosting. No CI/CD.
- **Env variables**: none for MVP

## 18. Observability

- Keep minimal: default browser console only. No external logging/monitoring/analytics.

## 19. Analytics

- Not included (out of scope).

## 20. Testing Strategy

- Not included (out of scope). We will do manual spot checks during development.

## 21. Legal & Compliance

- Respect platform terms for embeds; copyright for blogger content via linking/embedding

## 22. Risks & Mitigations

- Risk: Blogger links change or are removed — Mitigation: nightly link checks; fallback to thumbnail + message
- Risk: Promo overuse causes banner blindness — Mitigation: limit to one concise banner; allow dismiss
- Risk: Data drift between JSON and reality — Mitigation: single source of truth files with review checklist

## 23. Milestones & Timeline

- Milestone: MVP Catalog — scope: sections 1–20 above; owner: <owner>; due: <date>
- Milestone: CMS Integration — scope: headless CMS for products/reviews; due: <date>

## 24. Acceptance Criteria (Release)

- [ ] Arabic RTL applied globally; usability and core flows verified manually
- [ ] Promo banner visible and configurable
- [ ] Category chips, on-page filter, product grid/cards and quick view working with retail EGP prices and discounts
- [ ] Bloggers’ reviews render with graceful fallbacks and links
- [ ] Support & Maintenance info and contact options present; no statements about local branches

---

### Appendix A: Glossary

- <term>: <definition>

### Appendix B: Change Log

- <YYYY-MM-DD>: v0.1 draft created



  