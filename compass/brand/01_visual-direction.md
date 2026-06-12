# Visual Direction — هفار

> The complete visual system for the Hvar brand. Every locked element is here with its rationale. Follow this document before opening a design tool.

---

## The Visual Thesis

**"المطبخ الدافئ × هفار لوكس"** — Warm Kitchen × Hvar Luxe.

This phrase encodes a productive tension. Every visual decision in Hvar holds both sides:

**Warm Kitchen** — editorial warmth, real Egyptian kitchens, hands in food, steam, morning light, Arabic display type, the intimacy of domestic space. The feeling that this brand lives in the same world as the audience.

**Hvar Luxe** — named themes, precise token system, grain texture, ambient glow, the Wilson pattern architecture, premium spatial rhythm, cards with depth and shine. The feeling that this brand is more considered than anything else in its price range.

The tension is not a contradiction. It is the differentiator. Brands that are only warm become folksy. Brands that are only premium become cold. Hvar holds both, and that is why it owns a gap that no competitor in the Egyptian appliance segment has claimed.

**How to resolve the tension in any design decision:**
- If a choice makes the design warmer but cheaper-feeling, weigh it against the Luxe axis.
- If a choice makes the design more premium but more distant, weigh it against the Kitchen axis.
- The answer is almost always: the warmer version of the premium execution, or the most elevated version of the warm element.
- Example: product photography shot in a real Egyptian kitchen (warm), but lit to editorial standard, with precise composition (luxe). Not a white studio backdrop. Not a phone snapshot.

---

## Color System

### Primary Palette

| Token | HSL | HEX | Name | Purpose |
|-------|-----|-----|------|---------|
| `--hvar-red-600` | `1 64% 51%` | `#d43533` | Hvar Red | Primary action color. Brand signature. CTAs, active states, key highlights. |
| `--hvar-red-700` | `1 60% 42%` | `#ad2a28` | Deep Red | Hover state. Pressed state. Never used as surface. |
| `--hvar-red-50` | `6 70% 97%` | `#fef2f2` | Red Tint | Subtle highlight wash. Pill backgrounds. Alert tints. |
| `--c-flame` | `17 72% 41%` | `#B3471D` | Flame (burnt) | Secondary warmth accent — text-safe. Eyebrow labels, nicknames, price highlights, installment badges, hotline numbers. Light theme; dark theme uses `#FF9A62`. |
| `--c-flame-bright` | `14 80% 55%` | `#E8552E` | Flame (bright) | Decorative flame only: sparks, accent lines, line-art dots, star fills, 3px borders. Never body text on light canvas. |
| `--trust-green` | `142 71% 38%` | `#1d9a4a` | Trust Green | COD confirmation, WhatsApp, success states, delivery confirmation. |

**Color system notes:**
- **[TBD: Pantone equivalents, CMYK values, RGB values for print production — pending brand identity delivery]**
- Hvar Red is the dominant brand color. It is not decorative. Every use of `--hvar-red-600` must earn its place — it carries the brand's full weight.
- Flame is the warmth modifier. It is the fire's own hot edge — hotter and more orange than the ember core — so the secondary accent stays inside the brand story instead of importing a foreign metal. It prevents red from reading as aggressive while keeping the whole palette one fire.
- **Ratified 2026-06-10 (Kariem):** Brass/gold (`#C8893B`) is retired across product and brand. Gold read as a foreign material against the ember identity. Every former brass role moved to the flame scale: burnt flame for text, bright flame for decoration. No gold anywhere.
- Trust Green appears only in functional trust contexts: COD, WhatsApp, delivery success. It is never decorative.

### Canvas & Surface

| Token | Light (هفار الأحمر) | Dark (هفار الليل) | Purpose |
|-------|--------------------|--------------------|---------|
| `--bg` | `hsl(36 38% 97%)` / `#FBF7F1` | `hsl(20 10% 7%)` | Page canvas. Never pure white, never pure black. |
| `--surface` | `hsl(0 0% 100%)` | `hsl(20 9% 11%)` | Cards, panels, elevated content. |
| `--ink` | `hsl(20 14% 12%)` | `hsl(36 30% 94%)` | Primary text. Warm near-black / ivory. |
| `--ink-muted` | `hsl(20 8% 42%)` | `hsl(30 8% 62%)` | Secondary text, labels, captions. |
| `--border` | `hsl(30 16% 88%)` | `hsl(24 8% 20%)` | Dividers, card borders, input borders. |

**Why warm ivory, not white:** White canvas reads as clinical. It is the default of every generic ecommerce store. Warm ivory (`#FBF7F1`) reads as considered, as if the page exists in the same warm light as the kitchen photography. It costs almost nothing to implement and adds immense warmth.

**Why warm charcoal, not black:** Pure black dark mode is harsh and prevents the ambient glow from working. The charcoal `hsl(20 10% 7%)` is warm enough to let the ember red and amber glows read as atmospheric rather than neon.

### The 60-30-10 Applied to Hvar

| Proportion | Element | Tokens |
|------------|---------|--------|
| 60% | Canvas and surface — the base that everything lives on | `--bg`, `--surface`, `--ink` |
| 30% | Structure — borders, dividers, muted text, section backgrounds | `--border`, `--ink-muted`, `--surface` used as section separator |
| 10% | Brand — Hvar red for actions, flame for premium accents | `--hvar-red-600`, `--c-flame`, selective use |

The 10% rule is the discipline that keeps Hvar from shouting. Every brand element you add beyond this proportion reduces the power of everything else.

### WCAG Accessibility

- `--ink` on `--bg`: passes AA at both normal and large text in both themes. Check after any token modification.
- `--hvar-red-600` on `--bg` (light): passes AA for large text only. Do not use brand red for body text or small labels.
- `--hvar-red-600` on white (`--surface`): passes AA for large text only. Same rule.
- `--ink` on `--surface`: passes AA.
- `--ink-muted` on `--bg`: passes AA for large text. Use for labels, captions — not for body text that requires AA normal.
- Any token combination not in this list: check with a contrast checker before use.

---

## Typography

### The Trio

| Font | Role | Weights used | Notes |
|------|------|-------------|-------|
| **Cairo** | Arabic UI, headings, all Arabic text, brand display | 400, 600, 700, 900 | RTL-optimized. Use for every Arabic character. The primary brand voice in type. |
| **Inter** | Prices, quantities, numeric tabular data, English UI labels | 400, 500, 600 | Always `font-variant-numeric: tabular-nums`. Prices must never shift layout. |
| **JetBrains Mono** | Order IDs, tracking codes, SKUs, serial numbers | 400, 500 | Technical legibility. Makes codes scannable. Never use for prose. |

**Pairing logic:** Cairo and Inter harmonize because Cairo's geometric structure (Humanist rounded forms) aligns with Inter's neutral geometry. They share similar x-heights and reading rhythm. JetBrains Mono is visually distinct enough that its monospace character immediately signals "this is a reference code" to the user — functional differentiation by typeface.

### Arabic-Specific Rules

- Always `lang="ar"` on Arabic text elements or their container. Correct OpenType shaping depends on it.
- Line height for Arabic text must be looser than Latin defaults: minimum `1.7` for body, `1.3` for headings. Arabic ascenders and descenders need the air.
- Never set Arabic text in weights below 400. Arabic letterforms at Light or Thin weights lose legibility on screen.
- Cairo 900 (Black) is the display weight. Use for hero headlines, product names in large format, section headers. Do not use it for body copy.
- Text alignment: Arabic text in RTL containers aligns start (right). Never force `text-align: left` on Arabic UI elements.
- Cairo 700 (Bold) is the workhorse heading weight. Product names on cards. Section headers. Navigation items.
- Cairo 600 (SemiBold) is for labels, badges, UI elements that need distinction without full heading weight.
- Cairo 400 (Regular) is body text. Caption text. Supporting copy.

### Bilingual Layout Rules

- Arabic and Latin in the same sentence: write the Arabic content first (it is the primary language), embed the Latin as a natural part.
- Product names may mix: Arabic category + brand/model in Latin. Cairo handles both scripts — Inter does not. Use Cairo for mixed-script lines. Use Inter only for pure-numeric or pure-Latin contexts.
- Price display: the number in Inter tabular, the currency in Cairo. Example: `<span class="price"><span class="amount">١٢٩٩</span> <span class="currency">جنيه</span></span>`. The amount is Inter for tabular stability; the currency label is Cairo for Arabic harmony.
- Installment line: use the same pattern. Monthly amount in Inter, the framing copy in Cairo.

### Typography Scale

| Token | Value | Cairo rem | Cairo px | Use |
|-------|-------|-----------|----------|-----|
| `--text-xs` | 0.75rem | — | 12px | Fine print, legal, small labels |
| `--text-sm` | 0.875rem | — | 14px | Secondary labels, captions, supporting copy |
| `--text-base` | 1rem | — | 16px | Body text. The baseline. |
| `--text-lg` | 1.125rem | — | 18px | Lead copy, introductory paragraphs |
| `--text-xl` | 1.25rem | — | 20px | Card headings, section subheads |
| `--text-2xl` | 1.5rem | — | 24px | Section headers |
| `--text-3xl` | 1.875rem | — | 30px | Page headers, feature headings |
| `--text-4xl` | 2.25rem | — | 36px | Large display headings |
| `--text-5xl` | 3rem | — | 48px | Hero display — desktop |

**Mobile:** Step down one size on small screens (below 640px). `--text-5xl` → `--text-4xl` for hero. `--text-4xl` → `--text-3xl` for page headers. The system shifts down, not restructures.

---

## Spatial System

### Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 4px | Fine gaps: icon-to-label, tight inline elements |
| `--space-2` | 8px | Component internal: padding inside small badges, narrow gaps |
| `--space-3` | 12px | Standard internal component padding |
| `--space-4` | 16px | Default component padding, card internal rhythm |
| `--space-6` | 24px | Section internal spacing, card-to-card gap |
| `--space-8` | 32px | Between components in a section |
| `--space-12` | 48px | Between major page sections |
| `--space-16` | 64px | Hero padding, page-level vertical rhythm |
| `--space-24` | 96px | Major section separation on desktop |

**The density principle:** how much space = how much premium. Tight spacing reads cheap (dense catalog). Generous spacing reads premium (editorial). Hvar lives in the generous zone for layout sections, tighter for functional UI components (cart items, order lists, form fields). Never mix the two rhythms in the same visual frame.

- Use `--space-4` and below inside components.
- Use `--space-6` and above between components and between sections.
- Never less than `--space-6` padding on content containers on desktop.

### Grid System

- Mobile: 1-column full bleed with `padding-inline: --space-4`
- Small mobile to tablet: 2-column product grid
- Tablet (768px+): 3-column product grid
- Desktop (1024px+): 4-column product grid
- Max content width: `1280px`, centered
- The grid is `--grid-pattern` (P3 dot grid from Wilson library) as ambient texture on catalog pages — never a structural element users consciously see

---

## Photography and Imagery Direction

### What Hvar Photography Looks Like

**Light:** Warm. Golden hour or morning kitchen light. The sun coming through a kitchen window, not a studio flash. The light that makes food look like food someone actually cooked, not a commercial shoot.

**Environment:** Real Egyptian kitchens. Tile backsplashes, marble counters with character, dark wood cabinets, the clutter of real life thoughtfully composed. Not a IKEA kitchen. Not a sterile international staging.

**Hands:** Always in frame when food is being made. The chop, the pour, the stir, the plate. Hands tell the story better than any copy. They make the viewer imagine themselves doing the same.

**Food:** Steam matters. Texture matters. The moment of completion (the finished كنافة, the carved chicken) is the hook. Show the result first, then the process.

**Color grading:** Warm toned. Lift the shadows slightly, keep highlights from blowing out. A very slight grain in post, which harmonizes with the brand's CSS grain texture system. Never cool, never desaturated, never studio-clinical.

**Products in frame:** The product is in use, not posed. It should be naturally present because it is doing something — not centered like a catalog shot. Exception: isolated product photography for the product detail page hero — but even there, on a warm surface (wood, marble, linen) not a white backdrop.

### What Hvar Photography Is Not

- White backdrop product shots — clinical, indistinguishable from Sokany's catalog
- Stock photo generic families — Egyptian audiences read stock photos as stock photos
- Cold studio lighting — kills the warmth the brand is built on
- Aspirationally foreign kitchens — marble islands and stainless steel pro ranges in a home that reads as "Europe" or "Gulf" not "Cairo"
- Over-edited, oversaturated food photography that reads as artificial
- Models who are visibly not from Egypt — casting matters, casting telegraphs authenticity or its absence

### Product Isolation Photography (PDP Hero)

Even when shooting the product alone:
- Surface: warm marble, dark wood, natural linen, not white foam board
- Light: directional warm light, not diffused studio flat light
- Angle: three-quarter perspective that shows form and depth, not pure frontal catalog
- Props: minimal but contextual — a ceramic bowl, a kitchen towel, fresh ingredients nearby

---

## Iconography

**SVG only. No emojis.** This is absolute. Emojis render inconsistently across devices, OS versions, and fonts. They destroy brand consistency. Every icon is a custom SVG or a Lucide React icon.

**Style parameters:**
- Stroke width: 2px at 24px canvas
- Corner radius: rounded (not sharp, not pill — rounded)
- Visual weight: medium (not thin lines that disappear at small sizes, not bold that reads as clunky)
- Consistency: all icons in the same set must share these parameters. Do not mix Lucide icons with Material icons.

**Base library:** Lucide React. It is clean, has RTL-compatible directional icons (arrows that should flip in RTL do flip), and has adequate coverage for ecommerce UI.

**Custom Hvar icons needed:**
- Appliance category icons (blender, air fryer, kettle, iron, mixer) for category navigation and doodle background motifs
- Service ticket type icons (HVM maintenance wrench-style, HVR replacement arrows, HVT return arrow)
- Trust seal icons (warranty shield, free shipping, COD inspect)

Custom icons must match Lucide's visual weight and stroke style exactly. Commission with an SVG style guide reference of 3 existing Lucide icons.

---

## Motion Direction

**The Hvar motion signature is the Wilson curve:** `cubic-bezier(0.22,1,0.36,1)`.

This is an ease-out curve with a slow approach and a fast, confident completion. It feels like a precise physical action — the click of a quality mechanism, not the bounce of a cheap spring. It is the motion equivalent of "premium without trying too hard."

Use this curve for everything. If another curve is used anywhere in the system, it needs justification.

**Duration guidelines:**

| Motion type | Duration | What it communicates |
|-------------|----------|---------------------|
| Hover state | 120–180ms | Acknowledgment — instant but not jarring |
| Micro-interaction (badge, counter) | 200–300ms | Responsive, crisp |
| Drawer open/close | 350–450ms | Confident, unhurried |
| Page section reveal | 500–700ms | Invitation — content arrives with purpose |
| Page transition | 300–400ms | Continuity — the page turns, it doesn't flash |
| Loading/skeleton | N/A — no duration, use shimmer animation | Patience without anxiety |

**What each motion type means:**
- **Page transitions (continuity):** The viewer does not experience a flash to blank page. The next page arrives. Astro view transitions handle this — use `<ViewTransitions />`.
- **Hover states (acknowledgment):** A card, button, or link hover says "I see you." The Wilson curve's fast completion makes it feel snappy, not sluggish.
- **Scroll reveals (invitation):** Content sections enter from a slight downward offset to opacity 0 → full opacity and position. This is P7 (scroll reveals) from the Wilson library. The threshold is `0.15` — elements enter when 15% is in the viewport, not at the top edge.
- **Loading states (patience without anxiety):** Skeleton screens shimmer. They give the user something to look at that is shaped like the content they're waiting for. Never a full-viewport spinner. Never a blank screen. Spinners appear only for user-triggered point actions (add to cart, checkout confirm).

**`prefers-reduced-motion` is not optional:**
Every animated element in the system has a `@media (prefers-reduced-motion: reduce)` fallback. For scroll reveals: appear immediately without the translate. For page transitions: instant. For hover states: instant. For drawers: instant position, no slide. Motion is enhancement. The experience without motion must be complete.

---

## The Grain Texture

**What:** A subtle SVG noise overlay applied as a `::before` or `::after` pseudo-element on hero sections and cards.

**Why it exists:** Grain is the analog counterweight to digital sterility. It prevents the design from reading as flat and cold. It adds tactile depth — the feeling that the surface has texture, like quality paper or brushed metal. It harmonizes with the warm kitchen photography direction. It is the physical quality of materials expressed in digital UI.

**How to apply:**
- `mix-blend-mode: overlay` — the grain interacts with the color beneath, darkening light areas and lightening dark areas, creating organic texture rather than sitting on top
- Opacity: `0.04` in light mode (`--grain: 0.04`), `0.06` in dark mode (`--grain: 0.06`)
- Never render at opacity higher than `0.06`. Above this threshold it reads as a pattern — intentional and distracting — rather than texture
- Cover: `100%` width and height of the parent
- `pointer-events: none` — never intercepts interaction
- `z-index` appropriate to sit above background but below content

The grain should never be consciously visible to a user who hasn't been told to look for it. If you can see it reading the page normally, it is too strong.

---

## The Ambient Glow

**What:** Two radial gradients fixed to the viewport that create a living atmospheric color presence. One ember red, positioned top-right. One warm amber, positioned left.

**CSS (light mode):**
```css
html::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse 60% 50% at 80% 5%, hsl(var(--hvar-red-600) / var(--mesh-red)) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 10% 60%, hsl(var(--c-flame-bright) / calc(var(--mesh-red) * 0.7)) 0%, transparent 60%);
}
```

**Why this is the brand signature:**

The ambient glow transforms Hvar red from a flat corporate color into a warm atmospheric light source. Without it, `#d43533` is a standard ecommerce red — the same color used by scores of discount brands. With the ambient glow, that red becomes warmth: a living ember that gives the whole page a kitchen-fire quality. The flame glow on the left adds depth and makes the composition feel three-dimensional.

In dark mode, the glows are stronger (`--mesh-red: 0.12` vs `0.08` in light) because the dark canvas allows the glow to be more present without overpowering content.

**Rule:** Never use brand red as a flat decorative element without the ambient glow context. The glow is always on. It is what makes the red work.

---

## Do / Don't

**1. Canvas color**
- Do: warm ivory `#FBF7F1` (light mode), warm charcoal `hsl(20 10% 7%)` (dark mode)
- Don't: pure white `#FFFFFF` as page canvas. It is clinical. It erases the brand's warmth in one decision.

**2. Brand red usage**
- Do: use `--hvar-red-600` for primary actions (CTAs, active states, key highlights), always in the context of the ambient glow
- Don't: use brand red as a surface color, background wash, or decorative pattern fill. Red surfaces shout. Hvar does not shout.

**3. Urgency language in visual form**
- Do: trust signals placed at risk moments (COD, warranty, free shipping — at the CTA, at the price, at the cart)
- Don't: countdown timers, "FLASH SALE" banners, animated urgency badges, blinking anything. Urgency destroys the brand premium feeling every time it appears.

**4. Photography on product cards**
- Do: warm-toned product photography on contextual surfaces (wood, marble, linen), or in-use lifestyle shots
- Don't: white-backdrop isolation shots on product cards. They read as Sokany. Reserve isolation for PDP hero only, and even there on a warm surface.

**5. Typography**
- Do: Cairo for all Arabic text, all heading text, all brand voice copy. Inter for prices and numeric data.
- Don't: mix font families within a paragraph or sentence. Don't use system fonts for any brand-facing text. Don't apply Cairo at weights below 400.

**6. Motion**
- Do: Wilson curve everywhere, `prefers-reduced-motion` fallback everywhere
- Don't: bounce curves, spring animations, elastic easing. These read as playful and diminish the premium register. Don't add motion for its own sake — every animation must communicate something (acknowledgment, invitation, continuity, patience).

**7. Spacing**
- Do: generous layout spacing between sections (`--space-12`, `--space-16`, `--space-24`). Tighter spacing inside components.
- Don't: tight card-to-card grids that compress the catalog to look like a dense souk. Density has its place (order lists, data tables) — it is not the default.

**8. Dark mode**
- Do: dark mode is هفار الليل — a considered experience with its own warmth, its stronger ambient glow, its ivory text. Design it as a named theme, not as "light mode but inverted."
- Don't: use `filter: invert()` or `prefers-color-scheme` auto-inversion. It produces ugly results and removes brand control.

**9. Icons**
- Do: SVG icons from Lucide or custom SVG at the documented stroke and weight
- Don't: emoji in any context. Not in placeholder states, not in toasts, not in empty states, not in social copy. Not ever.

**10. The grain and glow**
- Do: grain overlay on hero sections and cards at documented opacity. Ambient glow always on via `html::after`.
- Don't: increase grain opacity above `0.06` because it "looks more textured." Above this, it reads as a pattern. Don't turn off the ambient glow to "simplify" — it is the brand signature, not an option.

**11. Color palette discipline**
- Do: the documented palette only. Five named functional colors plus the canvas/surface/ink scale.
- Don't: introduce new brand colors without a compass update. Every unplanned color dilutes the brand.

**12. Typography in dark mode**
- Do: `--ink` token in dark mode is ivory `hsl(36 30% 94%)`. Use it consistently.
- Don't: use pure white `#FFFFFF` for text in dark mode. Pure white on dark charcoal has too much contrast — it reads harsh, not warm. The ivory text in the token system reads right.
