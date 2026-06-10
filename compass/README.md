# Compass — Hvar Creative Direction

> The compass is not a rulebook. It is the standard we hold ourselves to. When a decision is genuinely ambiguous — a color, a word, a content type, a UX pattern — the compass gives you a direction. Read it, internalize it, then make the call.

---

## What This Is

Compass is a set of strategic direction documents for every layer of the Hvar system. Together they answer:

- What does this brand stand for and what does it look like?
- How does Hvar sound in Arabic, and how does it sound in English?
- What creative decisions are in bounds, what are out of bounds, and why?
- How do the products we build — portal, mCRM, ERP integrations — serve the brand?

These documents are written from the inside. They assume you have spent time with the brand, with Egyptian homemakers, and with the code. They do not explain things that can be read in a brief. They give direction.

---

## What Is Locked vs. What Is TBD

### Locked (do not deviate without a compass update)

- The two named themes: **هفار الأحمر** (light) and **هفار الليل** (dark)
- The color palette: warm ivory canvas, brand red `#d43533`, brass `#C8893B`, charcoal dark canvas
- The typeface trio: Cairo (Arabic UI + display) + Inter (prices, tabular) + JetBrains Mono (codes)
- The motion signature: Wilson curve `cubic-bezier(0.22,1,0.36,1)`
- The grain texture: `mix-blend-mode:overlay`, `0.04` opacity in light / `0.06` in dark
- The ambient glow: two radial-gradient glows (ember red, warm amber) fixed to viewport
- The visual thesis: "المطبخ الدافئ × هفار لوكس" (Warm Kitchen × Hvar Luxe)
- No emojis. Ever. In any context. SVG icons only.
- RTL-first. `dir="rtl"`. Logical CSS properties throughout.
- The five ERP absolutes (stock truth, phone identity, multi-tenancy, display-only, soft-delete)

### TBD — Pending Brand Finalization

The following are intentionally marked `[TBD]` across compass files. They will be filled in once the formal brand identity project completes. Until then, the direction documents provide sufficient guidance to make correct creative decisions.

| Element | File to update | Status |
|---------|---------------|--------|
| Brand essence (1–2 word soul) | `brand/00_brand-nucleus.md` | TBD |
| Logo system (primary, secondary, mono, reversed) | `brand/00_brand-nucleus.md` | TBD |
| Full color system (Pantone, CMYK, RGB) | `brand/01_visual-direction.md` | TBD |
| Tone examples (verified, approved phrases) | `brand/02_tone-voice.md` | TBD |
| Do/don't with actual brand examples | `brand/03_personality.md` | TBD |

---

## How to Navigate

**Start here when:** you are new to the project, you want to understand Hvar as a brand before touching code or content.
Read: `brand/00_brand-nucleus.md` → `brand/01_visual-direction.md` → `brand/03_personality.md`.

**When making visual decisions:** `brand/01_visual-direction.md` and `portal/design-system.md`.

**When writing copy (Arabic or English):** `brand/02_tone-voice.md`.

**When producing social content:** the file for that platform under `social/`.

**When building on top of the ERP:** `products/erp.md` first. Every time.

**When designing a new feature for hvarstore.com:** `portal/architecture.md` for system boundaries, `portal/design-system.md` for visual language, `portal/ux-patterns.md` for interaction patterns.

**When something feels off but you can't name why:** `brand/03_personality.md`. That is what it is for.

---

## File Index

### Brand

| File | What it answers |
|------|----------------|
| `brand/00_brand-nucleus.md` | Who is Hvar, what do we know right now, where does the brand stand |
| `brand/01_visual-direction.md` | Colors, typography, spacing, photography, motion, texture, do/don't |
| `brand/02_tone-voice.md` | How Hvar sounds in Arabic and English, per platform, what we never say |
| `brand/03_personality.md` | The brand's personality architecture — use this when decisions are ambiguous |
| `brand/04_facebook-intelligence.md` | Facebook audience, competitor, and content intelligence |
| `brand/05_market-intelligence.md` | Egypt appliance market sizing, channel/online share, retail distribution, competitor structure, competitive gap matrix |

### Social

| File | What it answers |
|------|----------------|
| `social/facebook.md` | Facebook content strategy, creative formats, chef content, trust posts, ad standards |
| `social/instagram.md` | Grid strategy, photography art direction, stories, captions, hashtags |
| `social/tiktok.md` | TikTok creative mandate, hook formulas, pacing, brand integration rules |

### Products

| File | What it answers |
|------|----------------|
| `products/erp.md` | ERP data display standards, the five absolutes, integration patterns |
| `products/mcrm.md` | mCRM design principles, ticket state machine, order flow, access control direction |
| `products/pos.md` | POS integration points, naming conventions, what we control vs. what we don't |
| `products/catalog.md` | Complete product catalog — all products, categories, parts, spec display rules, naming conventions |
| `products/hvar_erp.schema.sql` | Ground-truth structure-only DDL of the live `hvar_erp` database (80 tables, real columns and indexes). The schema `products/erp.md` is the narrative of — diff against it after any Ultimate POS upgrade |

### Print

| File | What it answers |
|------|----------------|
| `print/leaflets.md` | Leaflet types (product insert, promo, seasonal, digital), layout rules, RTL mandates, copy direction, production checklist |

### Assets

| File | What it answers |
|------|----------------|
| `assets/image-audit.md` | Full audit of hvarstore-assets library — logo confirmation, which hero banners are compass-fit, which product shot styles to use/reject, off-brand campaign graphics, missing asset gaps (food photography, chef content, COD icons, warm canvas product shots) |

### Portal

| File | What it answers |
|------|----------------|
| `portal/architecture.md` | Stack rationale, island architecture, two-database pattern, security, deployment |
| `portal/design-system.md` | Token system, theme system, typography scale, Wilson patterns, ambient glow, accessibility |
| `portal/ux-patterns.md` | Egyptian buyer journey, trust architecture, PDP pattern, cart, checkout, service tickets, mobile rules |
| `portal/service-portal.md` | Customer service portal — service request form, tracking page, Arabic copy per type, UX rules, mCRM bridge |

---

## When Brand Is Fully Defined — Update These Files

Run through this checklist when the brand identity project delivers final assets:

1. `brand/00_brand-nucleus.md` — Fill in **Brand Essence**, **Logo System** section, approve **Brand Personality** language
2. `brand/01_visual-direction.md` — Add Pantone, CMYK, RGB for all palette entries; finalize photography art direction with real shoot examples
3. `brand/02_tone-voice.md` — Add approved tone examples (real reviewed copy); finalize the "What Hvar Never Says" list with brand-reviewed additions
4. `brand/03_personality.md` — Confirm and finalize "In 3 years, when an Egyptian woman sees هفار, she should think: ___"
5. `portal/design-system.md` — Add logo usage rules in design system context

---

*Compass version: 1.1 — Written 2026-06-06, consolidated 2026-06-10. Brand identity in progress.*

*The 2026-06-10 consolidation absorbed the entire scattered `workspace/docs/` tree, the `.venom/` memory workspace, and loose root scratch files into compass — folding net-new signal (legacy ERP/POS/Kashier internals, Turbo courier, Bosta sync mechanics, market intelligence, the live `hvar_erp` DDL) into the files above and removing everything redundant or dead. Compass is now the single source of truth.*
