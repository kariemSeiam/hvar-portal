# Hvar Brand Digital Footprint — Design & Tech Analysis

> **Source:** Brand research report (2026-05-31)
> **Focus:** Website tech stack, UX patterns, social-commerce model, and the gap between the brand and the software we've documented.

---

## The Full Picture

We've documented three **software systems** (Hvar-POS, Hvar-Catalog, Hvar-OLD) that serve an **appliance brand** selling choppers and blenders to Egyptian households. This study connects them.

```
           HVAR BUSINESS (Appliance Brand)
                   │
     ┌─────────────┼─────────────┐
     │             │             │
  hvarstore.com  hvarbrand.com  Social Media
  (Dukan SaaS)  (EasyOrders)    FB/IG/TT
     │                          │
     └──────────┬───────────────┘
                │
         Orders / Customers / Stock
                │
     ┌──────────┴──────────┐
     │                     │
  Hvar-POS              Hvar-OLD
  (POS terminal)    (Admin dashboard)
     │                     │
     └──────────┬──────────┘
                │
          Hvar-Catalog
      (Consumer product display)
```

## Dukan Platform Analysis

Hvarstore.com runs on **Dukan (دكان)** — a hosted Arabic e-commerce SaaS.

### What Dukan Provides
- Arabic-first store builder with RTL themes
- COD + payment gateway integration
- Shipping zone management (per-governorate)
- Social commerce links (FB/IG/TT)
- White-label option (footer shows "HVAR" not "دكان")

### What Dukan Doesn't Provide
- Full control over backend logic
- Custom API layer (no documented public API)
- True multi-store management
- Custom checkout flows
- Advanced inventory management across warehouses

### Implication for the Software We Built
The POS, Catalog, and OLD dashboard **don't connect to Dukan**. They're independent software systems. This means:
- Orders from hvarstore.com don't automatically flow into the POS or OLD
- The POS and OLD likely operate on a separate order database
- Hvar-Catalog is a **separate** consumer catalog, not the live hvarstore.com

**Key insight:** There are TWO tech ecosystems:
1. **Live commerce** — Dukan storefront handling real customer orders
2. **Software systems** — POS/Catalog/OLD being built independently

## Social-Commerce Model

Hvar's sales funnel:

```
Social Content (FB/IG/TT)
  Chefs, demos, reviews, offers
        │
        ▼
   hvarstore.com
  Product page → Cart → Checkout
        │
        ▼
   COD / Card / Installments
        │
        ▼
   Courier delivery
  (free, inspect before pay)
        │
        ▼
   14-day return window
   + 2-3yr warranty
```

This is a **pure DTC social-commerce playbook** — no middlemen, no physical retail,
no third-party marketplaces. Every EGP of margin stays with the brand.

## UX Observations

### Strengths (from research)
- RTL-optimized storefront (Dukan handles this well)
- Clear discount anchoring (strikethrough pricing)
- Installment badges visible on product pages
- Free shipping as a trust signal
- WhatsApp wholesale funnel

### Weaknesses
- Zero on-site reviews on most products (social proof gap)
- No FAQ/guides/recipe content (SEO gap)
- No product comparison feature visible
- Two storefronts create confusion
- No loyalty/rewards program visible
- No post-purchase email/SMS nurture

## Design Language Comparison

The brand identity (social-commerce appliance seller) and the software we built (POS/Catalog/OLD) have **divergent design languages**:

| Aspect | Brand (hvarstore.com) | Hvar-Catalog (our build) | Hvar-OLD (our build) |
|--------|----------------------|------------------------|---------------------|
| Primary color | Dukan theme (unknown) | Red (#ef4444) | Rose (#f43f5e) |
| Tone | Commercial, urgency | Premium, emotional | Professional, data |
| Purpose | Sell products | Showcase products | Operate business |
| RTL | ✅ Native | ✅ | ✅ |
| Mobile-first | ✅ (Dukan responsive) | ✅ | ✅ (sidebar collapse) |

**What's missing:** The brand identity (green? blue? teal?) hasn't been extracted from hvarstore.com itself — Dukan blocks automated access.

## What We Need to See (Gaps)

To fully connect the brand to the software:

| Gap | Why | How to Fill |
|-----|-----|-------------|
| hvarstore.com live screenshots | Need actual brand colors, fonts, feel | Manual screenshot capture |
| Dukan theme CSS | Understand actual brand design tokens | Inspect live page manually |
| Order data structure | Connect POS/OLD to real order flow | Database schema from Dukan or manual |
| Customer database | Does POS use same customers as Dukan? | Interview / data audit |
| Payment flow integration | Does our POS handle ValU/Souhoola? | Code audit of POS payment modules |
| Product SKU alignment | Do Catalog products match Dukan products? | Compare Catalog data vs live site |
