---
title: "Wilson Egypt — Egyptian Gold E-commerce Platform"
version: production-ready
description: "Wilson مصر — bilingual (AR/EN) home appliances e-commerce with Egyptian Gold identity. React 18 + Vite 6 + Tailwind CSS + Flask backend. Dark/light modes, RTL, hand-drawn doodle backgrounds. Live at wilson-eg.com"

colors:
  # ═══ BRAND — Egyptian Gold ═══
  - id: gold-50
    value: "#FFFBEB"
    type: color
    category: brand
    description: "Cream Gold — lightest tint for subtle backgrounds"
  - id: gold-100
    value: "#FFF1C7"
    type: color
    category: brand
    description: "Light Gold — hover surfaces, section backgrounds"
  - id: gold-200
    value: "#FDE68A"
    type: color
    category: brand
    description: "Soft Gold — accent borders, badges"
  - id: gold-300
    value: "#FCD34D"
    type: color
    category: brand
    description: "Pale Gold — medium accent"
  - id: gold-400
    value: "#FBBF24"
    type: color
    category: brand
    description: "Bright Gold — hover states, emphasis"
  - id: gold-500
    value: "#FEB636"
    type: color
    category: brand
    description: "BRAND GOLD — CTAs, logo, primary actions, hero accents"
  - id: gold-600
    value: "#D97706"
    type: color
    category: brand
    description: "Deep Gold — active state, text on light backgrounds"
  - id: gold-700
    value: "#B45309"
    type: color
    category: brand
    description: "Rich Gold — deep hover on dark"
  - id: gold-800
    value: "#92400E"
    type: color
    category: brand
    description: "Dark Gold — accent depth"
  - id: gold-950
    value: "#451A03"
    type: color
    category: brand
    description: "Bronze — deepest brand tone, near black"

  # ═══ SEMANTIC ═══
  - id: ui-success
    value: "#10B981"
    type: color
    category: semantic
    description: "Emerald — stock available, positive states"
  - id: ui-warning
    value: "#F59E0B"
    type: color
    category: semantic
    description: "Amber — alerts, sale badges, low stock"
  - id: ui-danger
    value: "#EF4444"
    type: color
    category: semantic
    description: "Red — errors, out of stock, destructive"
  - id: ui-info
    value: "#3B82F6"
    type: color
    category: semantic
    description: "Blue — information, indicators"

  # ═══ BADGE ═══
  - id: badge-new
    value: "#7C3AED"
    type: color
    category: badge
    description: "New product — purple"
  - id: badge-sale
    value: "#DC2626"
    type: color
    category: badge
    description: "Sale — red"
  - id: badge-bestseller
    value: "#F59E0B"
    type: color
    category: badge
    description: "Bestseller — amber"
  - id: badge-low-stock
    value: "#D97706"
    type: color
    category: badge
    description: "Low stock — deep amber"

  # ═══ SURFACE ═══
  - id: surface-page-light
    value: "hsl(42 18% 97%)"
    type: color
    category: surface
    description: "Page background — Desert Luxe: papyrus cream"
  - id: surface-page-dark
    value: "hsl(240 10% 5%)"
    type: color
    category: surface
    description: "Page background — Night Luxe: deep warm charcoal"
  - id: surface-card-light
    value: "hsl(42 18% 97%)"
    type: color
    category: surface
    description: "Card background — light mode (same as page)"
  - id: surface-card-dark
    value: "hsl(240 8% 8%)"
    type: color
    category: surface
    description: "Card background — dark mode"

  # ═══ INK ═══
  - id: ink-primary-light
    value: "hsl(28 18% 16%)"
    type: color
    category: ink
    description: "Primary text — light: warm charcoal"
  - id: ink-primary-dark
    value: "hsl(42 18% 95%)"
    type: color
    category: ink
    description: "Primary text — dark: ivory"
  - id: ink-muted-light
    value: "hsl(28 12% 44%)"
    type: color
    category: ink
    description: "Muted text — light"
  - id: ink-muted-dark
    value: "hsl(38 12% 68%)"
    type: color
    category: ink
    description: "Muted text — dark"

  # ═══ BORDER ═══
  - id: border-light
    value: "hsl(38 8% 90%)"
    type: color
    category: border
    description: "Divider/card border — light mode"
  - id: border-dark
    value: "hsl(240 6% 15%)"
    type: color
    category: border
    description: "Divider/card border — dark mode"
  - id: border-gold
    value: "hsl(38 99% 60%)"
    type: color
    category: border
    description: "Gold border — focus rings, active card states"

  # ═══ SHADOWS (Gold-tinted) ═══
  - id: shadow-gold
    value: "0 0 25px 5px hsl(38 99% 60% / 0.25)"
    type: box-shadow
    category: shadow
    description: "Gold glow — primary buttons, CTAs"
  - id: shadow-gold-cta
    value: "0 2px 12px hsl(38 99% 60% / 0.25)"
    type: box-shadow
    category: shadow
    description: "Gold CTA shadow"
  - id: shadow-card
    value: "0 4px 6px -1px rgba(0,0,0,0.05)"
    type: box-shadow
    category: shadow
    description: "Card shadow — elevated elements"

typography:
  - id: display
    value: "Cairo"
    type: fontFamily
    category: display
    description: "Arabic display — Cairo 800-900, Playfair Display for English hero"
  - id: body
    value: "Cairo"
    type: fontFamily
    category: body
    description: "Arabic body — Cairo (primary), Tajawal fallback"
  - id: english
    value: "Inter"
    type: fontFamily
    category: body
    description: "English text — Inter 400-700"
  - id: heading-hero
    value: "clamp(2.5rem, 5vw + 1rem, 4.5rem)"
    type: fontSize
    category: heading
    description: "Hero — fluid 2.5-4.5rem, Cairo 800/Inter 800, leading 1.1"
  - id: heading-h1
    value: "clamp(2rem, 4vw + 0.5rem, 3.5rem)"
    type: fontSize
    category: heading
    description: "H1 — fluid 2-3.5rem, Cairo 700/Inter 700"
  - id: heading-h2
    value: "clamp(1.5rem, 3vw + 0.5rem, 2.5rem)"
    type: fontSize
    category: heading
    description: "H2 — fluid 1.5-2.5rem, Cairo 700/Inter 700"
  - id: heading-h3
    value: "clamp(1.25rem, 2vw + 0.5rem, 2rem)"
    type: fontSize
    category: heading
    description: "H3 — fluid 1.25-2rem, Cairo 600/Inter 600"
  - id: body-base
    value: "clamp(1rem, 1.5vw, 1.125rem)"
    type: fontSize
    category: body
    description: "Body — fluid 1-1.125rem, Cairo 400/Inter 400, leading 1.6"

# ═══ PATTERN INNOVATIONS (from Wilson Design) ═══
patterns:
  - id: doodle-bg
    type: pattern
    description: "Hand-drawn appliance doodles as background — 22 SVG elements (fridge, stove, kettle, blender, vacuum, TV, water cooler, mixer, washing machine, iron) scattered across viewport, 0.22 opacity, theme-aware stroke colors (warm brown+gold light / gold+ivory dark), optional float animation"
    files: "ApplianceDoodleBg.tsx"
  - id: gold-mesh
    type: pattern
    description: "Subtle gold gradient mesh overlay on hero — radial gradient from center-top, 8% gold at center → transparent"
    css: ".gold-mesh-hero::after"
  - id: grain-overlay
    type: pattern
    description: "CSS SVG noise texture (fractalNoise filter) as pseudo-element overlay, 4% opacity light / 6% dark, mix-blend-mode overlay"
    css: ".grain-overlay::before"
  - id: grid-bg
    type: pattern
    description: "Background grids — dots, lines, mesh, hex, cross patterns via CSS vars --grid-dot, --grid-line, --grid-size. Theme-aware (light=silver, dark=gold)"
  - id: menu-drawer-3d
    type: pattern
    description: "3D door-swing animation for mobile menu — RTL: right hinge rotateY(12deg), LTR: left hinge rotateY(-12deg). Cubic-bezier(0.22,1,0.36,1)"
    keyframes: "menuDrawerOpenRTL, menuDrawerOpenLTR"
  - id: product-card-shine
    type: pattern
    description: "Shine effect on product card hover — diagonal gradient sweep that translates from -100% to 100% on hover"
    css: ".product-card-creative::after"
  - id: cta-trust-line
    type: pattern
    description: "Trust line under primary CTA — small text showing warranty, service, delivery info"
    css: ".cta-trust-line"
  - id: hero-viewport
    type: pattern
    description: "Product viewport in hero — framed card with border, grain overlay, auto-cycling slides, subtle breathe animation 20s infinite"
    css: ".hero-wilson-viewport"
  - id: category-chips-stepped
    type: pattern
    description: "Creative stepped category layout — rows of chips with varying lengths, no horizontal scroll"
    css: ".category-chips-creative"
  - id: why-strip
    type: pattern
    description: "Editorial 3-pillar strip — horizontal strip with accent bar (4px gold left border), numbered badges, hover state"
    css: ".why-strip-item"
  - id: service-stepper
    type: pattern
    description: "Horizontal connected stepper for service process — centered dot with line through all steps, gradient gold line"
    css: ".service-steps-horizontal"
  - id: cart-fab
    type: pattern
    description: "Fixed gold cart FAB — 52px circle, gold background, icon, badge count. Mobile only (hidden desktop)"
    css: ".cart-fab"
  - id: cta-horizontal-bar
    type: pattern
    description: "CTA bar for product detail — horizontal strip with quantity stepper + gold add-to-cart + WhatsApp inquiry button"
    css: ".product-detail-cta-bar"

components:
  - id: doodle-bg
    type: component
    description: "ApplianceDoodleBg — hand-drawn SVG doodle background, 22 appliance illustrations, theme-aware gold/brown strokes, 0.22 opacity, optional float animation"
    props:
      - name: "variant"
        values: ["gold", "white", "mix"]
      - name: "animated"
        type: "boolean"
      - name: "opacity"
        type: "number"
  - id: product-card
    type: component
    description: "Wilson ProductCard — gold hover glow, shine effect, badge support, quantity stepper, added-in check animation"
  - id: hero-carousel
    type: component
    description: "Hero carousel with vision image filtering (blur/saturate/brightness), scroll hint chevrons, mobile-first sizing"
  - id: category-chip
    type: component
    description: "Gold-accented category chips — 44px touch target, rounded-full, gold border on hover"
  - id: cart-fab
    type: component
    description: "Mobile cart FAB — gold circle, cart icon, badge count, fixed bottom"
  - id: stepper
    type: component
    description: "Quantity stepper — +/- buttons with tabular-nums value display, 44px touch targets"
---
