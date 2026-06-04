# Design Directions — hvarstore.com

> Three distinct directions for the new customer portal, grounded in Hvar's real brand
> (Egyptian DTC kitchen-appliance brand, women-homemaker audience, trust-via-COD + long
> warranties, chef/recipe social culture), the proven Wilson pattern library, and 2025
> best-in-class external references. One recommendation at the end, build-ready with tokens.

---

## The Strategic Insight (why this matters)

The world's best appliance brands stopped selling *specs* and started selling *ritual*:
- **Gaggenau** — "Obsessed with life as it should be" (craft, beauty, daily rituals)
- **KitchenAid** — "the joy of making," empowering makers, emotionally-driven, mobile-first
- **Zecchinon** — "Your kitchen. Live every moment."
- **V-ZUG** — "Radical Simplicity"

Hvar **already lives this** — its growth engine is chef endorsements (Chef Sara Abdelsalam),
recipe/demo reels, and the kitchen as the heart of the Egyptian home. But its current Dukan
storefront sells like a generic discount catalog (loud anchor pricing, urgency, zero soul).

**The opportunity:** be the first Egyptian value-appliance brand that *feels* premium and warm
while keeping the trust mechanics (COD-inspect-before-pay, 2–3yr warranty, free shipping,
ValU/Souhoola/Aman installments) that actually close the Egyptian sale. Premium feel + value trust.

---

## Direction A — "المطبخ الدافئ" · The Warm Kitchen (Editorial Warmth)

**Concept:** The kitchen as the emotional center of the home. Lifestyle-led, editorial, human.
Big Arabic display headlines, generous whitespace, food-in-motion photography (steam, hands,
the chop, the pour), recipe/demo content woven into commerce.

| Element | Choice |
|---------|--------|
| Canvas | Warm ivory `#FBF7F1` / paper cream — never sterile white |
| Hero accent | Hvar red `#d43533` used sparingly, like a ribbon |
| Warmth accent | Brass/amber `#C8893B` for premium cues |
| Type | Cairo (display, heavy weights for Arabic headlines) + Inter tabular for prices |
| Photography | Editorial lifestyle, warm light, real Egyptian kitchens |
| Motion | Gentle scroll reveals, "breathing" hero imagery |
| Signature | Recipe cards, chef-endorsement strip, "في مطبخك" storytelling sections |

**Fits:** the brand's chef/recipe DNA; differentiates hard from Sokany/Dukan look-alikes.
**Risk:** depends on quality photography. Mitigant: Hvar already produces demo video/photo content.
**Reference:** KitchenAid, Gaggenau, Zecchinon, Big Green Egg scrollytelling.

---

## Direction B — "السوق الذكي" · The Smart Souk (Conversion-Dense Trust Machine)

**Concept:** Mobile-first, fast, trust-saturated, built to convert the Egyptian value buyer.
Hvar's current playbook done *right* — disciplined, not loud.

| Element | Choice |
|---------|--------|
| Canvas | Clean white + light gray sections |
| Primary | Hvar red `#d43533` as energetic action color |
| Type | Cairo (UI) + Inter tabular-nums (prices, the hero of every card) |
| Density | Compact cards, 2-col mobile / 4-col desktop, fast scan |
| Signature | Anchor pricing + discount badge, **trust line** under every CTA (ضمان · شحن مجاني · دفع عند الاستلام), installment calculator (ValU/Souhoola/Aman), sticky add-to-cart, low-stock cue |
| Trust architecture | "افحص قبل الدفع" badge, warranty seal, 14-day return — placed at every risk moment |
| Motion | Minimal, snappy; speed over flourish |

**Fits:** Egyptian online buyer behavior (COD trust, price sensitivity, installments). Highest raw conversion.
**Risk:** can drift into the generic "loud Dukan store" look — loses the premium "brilliance" you asked for.
**Reference:** Namshi (GCC mobile-first), Baymard/DTC PDP trust-signal frameworks (74% mobile traffic).

---

## Direction C — "هفار لوكس" · Hvar Luxe (Tactile Premium System)

**Concept:** Turn the browser into brand canvas. The full Wilson pattern library, re-skinned in
Hvar red, with **named themes** so the environment *is* the brand.

| Element | Choice |
|---------|--------|
| Themes | **"هفار الأحمر" (light)** warm ivory + deep red · **"هفار الليل" (dark)** charcoal + glowing red |
| Texture | CSS grain overlay (0.04/0.06), red mesh hero radiance (8–12%) |
| Backgrounds | Hvar-specific appliance doodles (chopper, blender, air fryer, iron, kettle) + Egyptian arabesque, scattered at 0.18–0.22 |
| Cards | Diagonal shine sweep on hover, soft red-glow shadows |
| Motion | The "Wilson curve" `cubic-bezier(0.22,1,0.36,1)`, 3D RTL door-swing menu, staggered reveals, product-viewport breath |
| Components | CTA action bar (qty · add · WhatsApp · remove), Cart FAB, service stepper, trust line |

**Fits:** most distinctive and ownable; reuses 13 proven, mostly CSS-only patterns (fast to build).
**Risk:** highest motion budget — must honor `prefers-reduced-motion` and mobile performance.
**Reference:** the internal Wilson system (3.8k CSS lines, 44 components) — already battle-tested.

---

## Recommendation — "المطبخ الدافئ × هفار لوكس"

**Lead with Direction C as the system, express it through Direction A's warmth, and bake
Direction B's trust architecture into every commerce moment.** One identity, three strengths:

- **C gives the bones:** named themes + token system + the reusable Wilson pattern library (low effort, high distinctiveness, RTL-native, already proven).
- **A gives the soul:** warm ivory canvas, editorial Arabic headlines, kitchen-ritual storytelling, chef/recipe strips — the premium feel no Egyptian competitor has.
- **B gives the close:** trust line under every CTA, COD-inspect/warranty/installment signals at every risk point, tabular-nums pricing, sticky mobile add-to-cart.

**Why this wins:** it makes Hvar look like a brand worth 2× its price while keeping the exact
trust mechanics that convert the COD-first Egyptian buyer. Premium *and* value. Nobody in the
segment (Sokany, Tornado, Fresh, generic Dukan stores) is doing this.

---

## Build-Ready Tokens (the recommended direction)

```css
/* ---- هفار الأحمر · Light (Warm Kitchen) ---- */
:root {
  /* Brand */
  --hvar-red-600: 1 64% 51%;        /* #d43533 — primary action / brand */
  --hvar-red-700: 1 60% 42%;        /* hover / deep */
  --hvar-red-50:  6 70% 97%;        /* tint wash */
  --brass-500:    32 55% 51%;       /* #C8893B — premium warmth accent */
  --trust-green:  142 71% 38%;      /* COD / WhatsApp / success */

  /* Canvas (warm, never sterile) */
  --bg:           36 38% 97%;       /* #FBF7F1 ivory */
  --surface:      0 0% 100%;        /* cards */
  --ink:          20 14% 12%;       /* warm near-black text */
  --ink-muted:    20 8% 42%;
  --border:       30 16% 88%;

  /* System */
  --radius:       1rem;             /* 16px — soft, premium */
  --radius-sm:    0.625rem;
  --grain:        0.04;
  --mesh-red:     0.08;
  --curve:        cubic-bezier(0.22, 1, 0.36, 1);  /* the Hvar curve */
  --shadow-card:  0 1px 2px hsl(0 0% 0% / .04), 0 8px 24px hsl(1 64% 51% / .06);
}

/* ---- هفار الليل · Dark (Night) ---- */
.dark {
  --hvar-red-600: 2 75% 58%;        /* brighter to glow on dark */
  --bg:           20 10% 7%;        /* warm charcoal */
  --surface:      20 9% 11%;
  --ink:          36 30% 94%;       /* ivory text */
  --ink-muted:    30 8% 62%;
  --border:       24 8% 20%;
  --grain:        0.06;
  --mesh-red:     0.12;
  --shadow-card:  0 1px 2px hsl(0 0% 0% / .3), 0 8px 28px hsl(2 75% 58% / .12);
}
```

**Typography:** Cairo (Arabic UI + display, weights 400/600/700/900) · Inter `tabular-nums`
(prices, quantities) · JetBrains Mono (order codes / tracking numbers). RTL-first: `dir="rtl"`,
`lang="ar"`, logical properties (`margin-inline`, `padding-inline`) — never hard left/right.

---

## Signature Components (Wilson patterns → Hvar)

| Component | Pattern source | Hvar use |
|-----------|---------------|----------|
| `HeroMesh` | Red mesh + grain | Home hero, category headers |
| `ApplianceDoodleBg` | Wilson P1 | Hvar appliance motifs + arabesque, hero/footer/menu |
| `ProductCard` (shine) | Wilson P6 | Catalog grid; red diagonal shine on hover |
| `ProductViewport` | Wilson P8 | PDP gallery, breath animation, auto-cycle |
| `CtaActionBar` | Wilson P11 | PDP: qty · أضف للسلة · واتساب · إزالة |
| `TrustLine` | Wilson P9 | Under every CTA: ضمان سنتين · شحن مجاني · افحص قبل الدفع |
| `InstallmentBadge` | new | ValU / Souhoola / Aman monthly price |
| `ServiceStepper` | Wilson P10 | Ticket state timeline (HVM/HVR/HVT) |
| `CartFAB` + `CartDrawer` | Wilson P12 / P5 | Mobile cart, 3D RTL door-swing |
| `ChefStrip` | new (Direction A) | Chef endorsements / recipe demos |
| `MenuDrawer` (staggered) | Wilson P13 | RTL mobile nav with doodle overlay |

---

## External References (curated 2025)

- **Kitchen/appliance:** Gaggenau (kevinhipke.com), V-ZUG (cdlx.de/projects/v-zug), KitchenAid
  (engle.design), Thermomix TM7 (dopamino.com), Zecchinon / Bella / KeukenKastenFabriek (Awwwards 2025).
- **RTL excellence:** Namshi (GCC mobile-first benchmark); "RTL is architecture not translation"
  (logical tokens, auto-mirroring, bidi).
- **DTC conversion:** Baymard 2025 (avg PDP 2.1% vs top 6–8%); trust-signal architecture (place
  proof at each risk moment); 74% mobile traffic.

---

## Next Step for Design

Produce a single self-contained HTML mockup of the **Home hero + one ProductCard + the PDP CTA
action bar + trust line**, in the recommended tokens, RTL Arabic, light + dark — so Kariem can
*see* the direction before any framework code is written.
