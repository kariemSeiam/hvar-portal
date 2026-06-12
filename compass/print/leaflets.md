# Leaflets Creative Direction — هفار

> Leaflets are the brand's handshake at physical distance. An Egyptian woman who receives a Hvar package, walks past a Hvar display at a fair, or gets forwarded a WhatsApp PDF should feel the same brand she met on Facebook — warm, knowledgeable, trustworthy. If the leaflet feels cheaper than the product, the product feels cheaper than it is.

---

## The Role of Leaflets for Hvar

Leaflets appear at four specific moments in the Egyptian buyer journey. Each moment has different emotional context and different goals.

| Moment | Format | Goal |
|--------|--------|------|
| **Unboxing** — product is being opened for the first time | Product insert, A5, single sheet | Confirm the purchase was right. Warm the relationship. Explain warranty + care. |
| **Point of contact** — retail partner display, exhibition, event | Promo leaflet, A5 or DL, bi-fold | Introduce the brand to someone who doesn't know it yet. One product, one message, one CTA. |
| **Seasonal campaign** — Ramadan, Eid, back-to-school | Campaign leaflet, A4 or A5 | Drive awareness of the seasonal offer without looking like every other discount flyer. |
| **Digital share** — WhatsApp PDF, email attachment | Digital leaflet, PDF optimized at 1200×1800px (portrait) | Travel socially without print constraints. Still reads like Hvar. |

Every format follows the same visual language. What changes is the content hierarchy, not the identity.

---

## Visual Standards

These override nothing in `brand/01_visual-direction.md` — they apply it to the physical/print context.

### Color

- **Background:** Warm ivory canvas `#F5EDD8` (light) or charcoal `#1A1612` (dark, for special print runs only)
- **Primary accent:** Brand red `#d43533`
- **Secondary accent:** Flame `#B3471D` (burnt, text) / `#E8552E` (bright, decorative) — brass/gold retired 2026-06-10
- **Body text:** Charcoal `#1A1612` on light background. Cream `#F5EDD8` on dark.
- **No additional colors.** Never introduce a third accent for print. The palette discipline is what makes the brand look considered.

### Typography

- **Headlines:** Cairo Black — all Arabic display headings. Arabic always leads.
- **Body:** Cairo Regular or Cairo Medium — all Arabic body copy
- **Prices and specs:** Inter — numbers, percentages, specs in Latin numerals
- **Codes and model numbers:** JetBrains Mono — product codes, warranty registration codes
- **Never use a font not in this list.** Not for the fine print. Not for the CTA. Not for anything.

### Grain Texture

In digital leaflets: apply grain overlay at `mix-blend-mode: overlay`, `4%` opacity on light variant. In print: coordinate with printer to add subtle texture through paper stock choice (uncoated or soft-touch laminate preferred over glossy).

### Imagery

- **Real Egyptian kitchens.** Not catalogue-white studio shots.
- **Food as hero.** Product visible and in use, not posed on a pedestal.
- **Hands in frame.** Human contact with the appliance grounds the content.
- **Chef Sara content** — where licensed — is the highest-trust image source. When using, always credit: "شيف سارة عبدالسلام" on the image or caption.
- **No stock photos** that show non-Egyptian settings, Western kitchens, or food that is not part of Egyptian home cooking culture.
- **Aspect ratios:** Product image for A5 insert = landscape, 3:2. Hero food image = 4:3 or square.

### What Is Never on a Hvar Leaflet

- Emojis or emoji-adjacent symbols (checkmarks styled as emojis, etc.). SVG icons only.
- Orange, yellow, or bright green — the Sokany/discount palette. Even one wrong color reads as category regression.
- Flash sale urgency language: "خصم ٥٠٪ لفترة محدودة", countdown borders, red-on-yellow price stickers
- Clip art, decorative borders, or ornamental frames not from the Hvar design system
- Photos on pure white backgrounds (catalogue style — this is not a marketplace listing)
- Text that runs RTL and LTR in the same paragraph without visual control
- More than 4 font sizes on a single leaflet. Hierarchy through weight, not size explosion.

---

## RTL Layout Rules

All leaflets are RTL. This is not a localization option — it is the primary orientation.

- **Reading eye enters top-right.** The most important content lives top-right.
- **CTA is bottom-left** — where the eye exits on RTL reading.
- **Images in bi-folds:** when the visual and the text are side-by-side, image goes left, text goes right (image is the "end" of the reading direction, text is the "start").
- **Arabic and price (Latin numerals) in the same line:** the Arabic sets the line direction, the number inherits. Use `dir="rtl"` in digital versions. In print: proof the final layout with the actual Arabic font — Cairo handles this gracefully but numbers need visual verification in context.
- **Logical padding:** right-heavy padding is natural in RTL. Don't center everything — let content breathe toward the right margin.

---

## Leaflet Types

### Type 1 — Product Insert (مرفق المنتج)

**Format:** A5 (148×210mm), single sheet, printed both sides  
**Weight:** 130–170gsm coated, soft-touch preferred  
**Audience:** Customer who just received their Hvar order — she already bought, she is in trust-building phase, not sales phase

**Side A — Warmth side:**

```
[هفار wordmark — top right]

[Large product photograph — with food result in frame]

[Single headline — 2–4 words maximum]
Example: "الكباب في دقائق."

[One line of warm body copy — speaks to the decision she just made]
Example: "اخترتِ هفار. الآن خليه يشتغل."
```

**Side B — Trust and care side:**

```
[Warranty block]
ضمان [X] سنوات — رقم التسجيل: [product code in JetBrains Mono]
خط العملاء: [number]

[Usage tip — one Egyptian recipe or technique that works with this product]
عشان تعرفي الجهاز صح: [specific tip]

[Social link — one platform only, the highest-engagement one]
تابعينا على فيسبوك: facebook.com/hvarstore

[COD reminder — for products where this is relevant]
اشتريتِ بالكاش عند الاستلام؟ نشكرك على ثقتك.
```

**What this insert must NOT do:** upsell. She just bought. Do not put a QR code to "more products." Do not mention discounts. The only relationship being built here is between her and the product she holds.

---

### Type 2 — Promotional Leaflet (ليفليت ترويجي)

**Format:** A5 or DL (99×210mm), bi-fold  
**Weight:** 150–170gsm  
**Audience:** Someone who doesn't know Hvar yet — at a fair, a retail partner, an exhibition

**Front cover:**

```
[Full-bleed food/lifestyle image — the outcome, not the product]

[Headline — the promise, not the product name]
Example: "الكنافة في ربع ساعة، من غير فرن."

[Sub — product name and brief spec, Cairo Medium, small]
Example: "الفريير الهوائي من هفار — ٥٥ لتر، ١٨٠٠ واط"
```

**Inside spread (or back if single-fold):**

```
[Three trust signals — brief, no hyperbole]
ضمان ٣ سنوات
شحن مجاني
الدفع عند الاستلام

[Chef endorsement — if licensed]
[Photo] "شيف سارة بتستخدمه في مطبخها الحقيقي."

[One recipe or result — Egyptian, specific, achievable]
جربي: كفتة بالهواء في ٢٠ دقيقة.
المكونات البسيطة، النتيجة صح.

[CTA — one, not three]
hvarstore.com

[QR code — links to the specific product page or chef demo video]
```

**Back:**

```
[Hvar wordmark]
[Brand tagline: بيتك دايما جاهز مع هفار]
[Contact: website + Facebook + phone]
```

**What this leaflet must NOT do:** list every product Hvar makes. One product per promotional leaflet. The Egyptian buyer who is meeting the brand for the first time doesn't need a catalog — she needs one reason to trust.

---

### Type 3 — Seasonal Campaign Leaflet (ليفليت الموسم)

**Format:** A4 or A5, single sheet or bi-fold  
**Season:** Ramadan, Eid, Mother's Day (عيد الأم), back-to-school, winter

**Design mandate:** Seasonal leaflets must feel like Hvar — not like every other brand's Ramadan flyer. The baseline test: if you replaced the Hvar wordmark with Sokany, would it look right? If yes, the leaflet failed. If it would clearly look wrong without هفار, it succeeded.

**What season-appropriate looks like for Hvar:**

| Season | Visual shift | Copy shift | What to avoid |
|--------|-------------|------------|---------------|
| Ramadan | Deeper warm ambers, night kitchen lighting, lantern-adjacent but not literal lantern decoration | "مطبخك في رمضان" — the busy, social, cooking-for-guests energy | Crescent and star clichés, "أقل سعر في رمضان", gold glitter |
| Eid | Same warmth + celebratory food (قطايف، كنافة، عيش بالسمن) | The home is full, the food came out right — quiet pride | Balloons, confetti, "عروض العيد" in orange |
| Mother's Day | Woman in frame (not posed, real — cooking, hands visible) | Care flows both ways: she takes care of her kitchen, Hvar takes care of her | Generic flowers, pink, "أمي حبيبتي" saccharine copy |
| Winter | Dense, warming food — شوربة، فراخ محشية، كفتة | Warmth is earned through cooking together | Cold visual palettes, Christmas adjacency |

**Pricing on seasonal leaflets:**

Prices may appear on seasonal leaflets IF:
1. They are presented as information, not urgency. No "was/now" crossed-out pricing.
2. They are stated once, clearly, in Inter (not Cairo), with ج.م. after the number.
3. Installment option can be mentioned: "أو قسطها على [X] شهر مع ValU" — one line, not a feature.

**What seasonal leaflets must NOT do:** look like the Egyptian discount flyer template. High-saturation red background + white all-caps text + 50% OFF in huge numbers. This is the category language. Hvar does not speak it.

---

### Type 4 — Digital Leaflet (ليفليت رقمي)

**Format:** PDF, 1200×1800px (portrait) at 150dpi. Also usable as a single tall image.  
**Distribution:** WhatsApp shares, email attachments, Facebook post attachments, story screenshots  
**Design constraint:** Will be read on a phone screen at thumb-scroll speed. What survives two seconds of attention?

**Structure:**

```
[Brand red top bar — هفار wordmark, centered or right-aligned]

[Hero image — full-bleed, takes up top 40% of the leaflet]
Food result or chef-in-use image. No product-only white-background shot.

[Headline — large, Cairo Black, RTL]
2–5 words. The entire message, if she reads only this.

[Body — 2–3 lines, Cairo Medium, readable at 14px equivalent]
One trust signal + one product fact + one emotional anchor.

[Trust bar — horizontal divider with 3 icons + text]
[icon] ضمان ٣ سنوات   [icon] شحن مجاني   [icon] كاش عند الاستلام

[CTA — brand red button shape, white Cairo Bold text]
اشتري الآن — hvarstore.com

[Tagline footer — light, small]
بيتك دايما جاهز مع هفار
```

**Digital-specific rules:**
- SVG icons only in trust bar — no emoji substitutes
- Minimum type size: 14px equivalent (never smaller — screens at arm's length)
- No more than 3 type sizes on the whole leaflet
- The leaflet must look correct as a screenshot cropped to just the top half — that is how it travels on WhatsApp stories

---

## Copy Direction

### The right Arabic for leaflets

Egyptian dialect, not MSA. Not slang. The register of the knowledgeable friend.

**Use:**
- "جربيه" not "جربه" (feminine address — the primary audience is women)
- "مطبخك" not "مطبخكِ" — the يِ suffix is MSA; dialect omits it and it reads naturally
- "بتطلع" not "تخرج" — dialect for results, process, cooking outcomes
- Direct, specific, confident — "يطبخ في ٢٠ دقيقة" not "يمكن استخدامه لطبخ الطعام بسرعة"

**Never use:**
- "خارق" / "مذهل" / "رائع" — empty superlatives that every other brand uses
- "لا تفوّت الفرصة" — urgency pressure, not the Caregiver voice
- "أفضل سعر في السوق" — price-war language
- Three exclamation points. Or two. Or one, usually.
- "عرض لفترة محدودة" — creates anxiety, not trust

### Headline formulas that work for Hvar

| Formula | Example |
|---------|---------|
| **The outcome, not the product** | "الكنافة في ربع ساعة" |
| **The Egyptian dish + the appliance** | "الكفتة بالهواء، من غير حاجة تحضري" |
| **The promise, stated flatly** | "ضمان ٣ سنوات. ادفعي لما تشوفيه." |
| **The moment of use** | "مطبخك في رمضان. كله جاهز." |

**Headline length:** 2–6 words. If it needs more, it's a sub-headline, not a headline.

---

## Production Checklist

Before any Hvar leaflet goes to print or is distributed:

- [ ] All text is RTL-correct — checked with a native Arabic reader, not just automated tools
- [ ] No emojis anywhere — including social icons, which must be SVG
- [ ] Typography is exclusively Cairo + Inter + JetBrains Mono
- [ ] Color values have been verified against brand palette (not approximate Photoshop eyedropper matches)
- [ ] If Chef Sara's image or name appears, licensing is confirmed
- [ ] Price (if present) is stated once, clearly, in Inter — no urgency treatment
- [ ] CTA links to the correct product page, not just hvarstore.com homepage
- [ ] QR code (if present) has been tested on both iOS and Android
- [ ] A native Egyptian Arabic speaker has read the copy aloud — if it sounds awkward, it is awkward
- [ ] The leaflet was tested at 50% zoom — this is how someone glances at a WhatsApp image

---

*Leaflets section version: 1.0 — Written 2026-06-06. Part of Compass v1.0.*
