---
title: "Hvar — Customer Management System"
version: alpha
description: "HVAR is a comprehensive Arabic-first, RTL enterprise operations dashboard for logistics, warehousing, call centers, customer service, maintenance, and field service management. Designed for the Egyptian market. Built for operators, call center agents, managers, and field technicians."

colors:
  # ═══ BRAND — Primary Identity (Rose-based) ═══
  - id: brand-50
    value: "#fff1f2"
    type: color
    category: brand
    description: "Brand rose — lightest tint for subtle backgrounds"
  - id: brand-100
    value: "#ffe4e6"
    type: color
    category: brand
    description: "Brand rose — light tint for hover surfaces"
  - id: brand-200
    value: "#fecdd3"
    type: color
    category: brand
    description: "Brand rose — soft accent border"
  - id: brand-300
    value: "#fda4af"
    type: color
    category: brand
    description: "Brand rose — medium accent, disabled states"
  - id: brand-400
    value: "#fb7185"
    type: color
    category: brand
    description: "Brand rose — hover state for primary buttons"
  - id: brand-500
    value: "#f43f5e"
    type: color
    category: brand
    description: "Brand rose — main primary actions, CTAs, active links"
  - id: brand-600
    value: "#e11d48"
    type: color
    category: brand
    description: "Brand rose — strong primary, gradient end, active states"
  - id: brand-700
    value: "#be123c"
    type: color
    category: brand
    description: "Brand rose — deep press state, hover on dark"
  - id: brand-800
    value: "#9f1239"
    type: color
    category: brand
    description: "Brand rose — dark accent for depth"
  - id: brand-900
    value: "#881337"
    type: color
    category: brand
    description: "Brand rose — deepest brand tone"
  - id: brand-950
    value: "#4c0519"
    type: color
    category: brand
    description: "Brand rose — near-black brand accent"

  # ═══ SECONDARY — Blue (Analytics & Info) ═══
  - id: secondary-50
    value: "#f0f9ff"
    type: color
    category: secondary
    description: "Blue — lightest info background"
  - id: secondary-500
    value: "#0ea5e9"
    type: color
    category: secondary
    description: "Blue — secondary actions, info icons"
  - id: secondary-600
    value: "#0284c7"
    type: color
    category: secondary
    description: "Blue — info badge, active secondary"
  - id: secondary-700
    value: "#0369a1"
    type: color
    category: secondary
    description: "Blue — pressed secondary, link hover"

  # ═══ ACCENTS ═══
  - id: accent-green-500
    value: "#22c55e"
    type: color
    category: accent
    description: "Green — success states, delivered badges"
  - id: accent-amber-500
    value: "#f97316"
    type: color
    category: accent
    description: "Amber — warning states, pending badges"
  - id: accent-purple-500
    value: "#a855f7"
    type: color
    category: accent
    description: "Purple — analytics highlights, premium badges"
  - id: accent-red-500
    value: "#ef4444"
    type: color
    category: accent
    description: "Red — danger, error, deletion, critical alerts"

  # ═══ SEMANTIC — Status Colors ═══
  - id: success-500
    value: "#22c55e"
    type: color
    category: semantic
    description: "Success — delivered, completed, green badges"
  - id: success-700
    value: "#15803d"
    type: color
    category: semantic
    description: "Success — dark text on success badges"
  - id: warning-500
    value: "#f97316"
    type: color
    category: semantic
    description: "Warning — pending, in-progress, amber badges"
  - id: warning-700
    value: "#c2410c"
    type: color
    category: semantic
    description: "Warning — dark text on warning badges"
  - id: danger-500
    value: "#ef4444"
    type: color
    category: semantic
    description: "Danger — errors, cancellations, critical badges"
  - id: danger-700
    value: "#b91c1c"
    type: color
    category: semantic
    description: "Danger — dark text on danger badges"
  - id: info-500
    value: "#3b82f6"
    type: color
    category: semantic
    description: "Info — informational badges, blue indicators"

  # ═══ SURFACE — Canvas & Cards ═══
  - id: surface-page-light
    value: "#f9fafb"
    type: color
    category: surface
    description: "Page background — light mode (gray-50)"
  - id: surface-page-dark
    value: "#111827"
    type: color
    category: surface
    description: "Page background — dark mode (gray-900)"
  - id: surface-card-light
    value: "#ffffff"
    type: color
    category: surface
    description: "Card background — light mode"
  - id: surface-card-dark
    value: "#1f2937"
    type: color
    category: surface
    description: "Card background — dark mode (gray-800)"
  - id: surface-sidebar-light
    value: "#ffffff"
    type: color
    category: surface
    description: "Sidebar background — light mode"
  - id: surface-sidebar-dark
    value: "#111827"
    type: color
    category: surface
    description: "Sidebar background — dark mode (gray-900)"
  - id: surface-header-light
    value: "#ffffff/95"
    type: color
    category: surface
    description: "Header background — light mode with glass"

  # ═══ INK — Text ═══
  - id: ink-primary-light
    value: "#1e293b"
    type: color
    category: ink
    description: "Primary text — light mode (gray-800)"
  - id: ink-primary-dark
    value: "#f1f5f9"
    type: color
    category: ink
    description: "Primary text — dark mode (gray-100)"
  - id: ink-secondary-light
    value: "#475569"
    type: color
    category: ink
    description: "Secondary text — light mode (gray-600)"
  - id: ink-secondary-dark
    value: "#94a3b8"
    type: color
    category: ink
    description: "Secondary text — dark mode (gray-400)"
  - id: ink-muted-light
    value: "#9ca3af"
    type: color
    category: ink
    description: "Muted placeholder — light mode (gray-400)"
  - id: ink-muted-dark
    value: "#6b7280"
    type: color
    category: ink
    description: "Muted placeholder — dark mode (gray-500)"

  # ═══ BORDER — Hairlines ═══
  - id: border-light
    value: "#e5e7eb"
    type: color
    category: border
    description: "Card/divider border — light mode (gray-200)"
  - id: border-dark
    value: "#374151"
    type: color
    category: border
    description: "Card/divider border — dark mode (gray-700)"
  - id: border-hover-light
    value: "#f43f5e/40"
    type: color
    category: border
    description: "Border hover — brand-500 with opacity"

  # ═══ BADGE — Status Backgrounds ═══
  - id: badge-success-bg-light
    value: "#dcfce7"
    type: color
    category: badge
    description: "Success badge bg — light mode (green-100)"
  - id: badge-success-bg-dark
    value: "#052e16"
    type: color
    category: badge
    description: "Success badge bg — dark mode (green-950)"
  - id: badge-warning-bg-light
    value: "#ffedd5"
    type: color
    category: badge
    description: "Warning badge bg — light mode (amber-100)"
  - id: badge-warning-bg-dark
    value: "#431407"
    type: color
    category: badge
    description: "Warning badge bg — dark mode (amber-950)"
  - id: badge-danger-bg-light
    value: "#fee2e2"
    type: color
    category: badge
    description: "Danger badge bg — light mode (red-100)"
  - id: badge-danger-bg-dark
    value: "#450a0a"
    type: color
    category: badge
    description: "Danger badge bg — dark mode (red-950)"
  - id: badge-info-bg-light
    value: "#dbeafe"
    type: color
    category: badge
    description: "Info badge bg — light mode (blue-100)"

  # ═══ SHADOW — Colored Glows ═══
  - id: shadow-brand-red
    value: "0 4px 14px 0 rgba(244,63,94,0.2)"
    type: box-shadow
    category: shadow
    description: "Red shadow tint — buttons, primary elements"
  - id: shadow-brand-blue
    value: "0 4px 14px 0 rgba(14,165,233,0.2)"
    type: box-shadow
    category: shadow
    description: "Blue shadow tint — info/secondary elements"
  - id: shadow-brand-green
    value: "0 4px 14px 0 rgba(34,197,94,0.2)"
    type: box-shadow
    category: shadow
    description: "Green shadow tint — success elements"
  - id: shadow-brand-amber
    value: "0 4px 14px 0 rgba(249,115,22,0.2)"
    type: box-shadow
    category: shadow
    description: "Amber shadow tint — warning elements"
  - id: shadow-brand-purple
    value: "0 4px 14px 0 rgba(168,85,247,0.2)"
    type: box-shadow
    category: shadow
    description: "Purple shadow tint — premium/analytics elements"

typography:
  - id: display
    value: "Cairo"
    type: fontFamily
    category: display
    description: "Display/heading font — Cairo, Tajawal fallback"
  - id: body
    value: "Tajawal"
    type: fontFamily
    category: body
    description: "Body font — Tajawal, Cairo fallback"
  - id: heading-h1
    value: "clamp(2rem, 1.8rem + 1vw, 3rem)"
    type: fontSize
    category: heading
    description: "H1 — fluid 2rem-3rem, Cairo 700, line-height 1.2"
  - id: heading-h2
    value: "clamp(1.7rem, 1.5rem + 1vw, 2.5rem)"
    type: fontSize
    category: heading
    description: "H2 — fluid 1.7rem-2.5rem, Cairo 700"
  - id: heading-h3
    value: "clamp(1.4rem, 1.3rem + 0.5vw, 1.8rem)"
    type: fontSize
    category: heading
    description: "H3 — fluid 1.4rem-1.8rem, Cairo 700"
  - id: heading-h4
    value: "clamp(1.2rem, 1.1rem + 0.5vw, 1.5rem)"
    type: fontSize
    category: heading
    description: "H4 — fluid 1.2rem-1.5rem, Cairo 700"
  - id: body-base
    value: "clamp(1rem, 0.95rem + 0.2vw, 1.1rem)"
    type: fontSize
    category: body
    description: "Body — fluid 1rem-1.1rem, Tajawal 400, leading 1.5"
  - id: body-small
    value: "clamp(0.8rem, 0.8rem + 0.1vw, 0.9rem)"
    type: fontSize
    category: body
    description: "Small body — fluid 0.8rem-0.9rem, Tajawal 400"
  - id: body-xs
    value: "clamp(0.7rem, 0.7rem + 0.1vw, 0.8rem)"
    type: fontSize
    category: body
    description: "Extra small — fluid 0.7rem-0.8rem, Tajawal 400"
  - id: body-large
    value: "clamp(1.1rem, 1.05rem + 0.25vw, 1.2rem)"
    type: fontSize
    category: body
    description: "Large body — fluid 1.1rem-1.2rem, Tajawal 400"
  - id: label
    value: "Tajawal"
    type: fontFamily
    category: label
    description: "Labels, badges, small UI — Tajawal 500"
  - id: mono
    value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas"
    type: fontFamily
    category: mono
    description: "Monospace — SKUs, tracking numbers, codes"

spacing:
  - id: space-1
    value: "clamp(0.25rem, 0.2rem + 0.1vw, 0.3rem)"
    type: spacing
    description: "1 unit — 4px fluid"
  - id: space-2
    value: "clamp(0.5rem, 0.4rem + 0.2vw, 0.6rem)"
    type: spacing
    description: "2 unit — 8px fluid"
  - id: space-3
    value: "clamp(0.75rem, 0.6rem + 0.3vw, 0.9rem)"
    type: spacing
    description: "3 unit — 12px fluid"
  - id: space-4
    value: "clamp(1rem, 0.8rem + 0.4vw, 1.2rem)"
    type: spacing
    description: "4 unit — 16px fluid (base inset)"
  - id: space-5
    value: "clamp(1.25rem, 1rem + 0.5vw, 1.5rem)"
    type: spacing
    description: "5 unit — 20px fluid"
  - id: space-6
    value: "clamp(1.5rem, 1.2rem + 0.6vw, 1.8rem)"
    type: spacing
    description: "6 unit — 24px fluid"
  - id: space-8
    value: "clamp(2rem, 1.6rem + 0.8vw, 2.4rem)"
    type: spacing
    description: "8 unit — 32px fluid (section gap)"
  - id: space-10
    value: "clamp(2.5rem, 2rem + 1vw, 3rem)"
    type: spacing
    description: "10 unit — 40px fluid"
  - id: space-12
    value: "clamp(3rem, 2.4rem + 1.2vw, 3.6rem)"
    type: spacing
    description: "12 unit — 48px fluid"
  - id: space-16
    value: "clamp(4rem, 3.2rem + 1.6vw, 4.8rem)"
    type: spacing
    description: "16 unit — 64px fluid (page section)"
  - id: space-20
    value: "clamp(5rem, 4rem + 2vw, 6rem)"
    type: spacing
    description: "20 unit — 80px fluid"

radii:
  - id: radius-sm
    value: "clamp(0.125rem, 0.1rem + 0.05vw, 0.15rem)"
    description: "Small — 2px fluid (tags, chips)"
  - id: radius-md
    value: "clamp(0.375rem, 0.3rem + 0.15vw, 0.45rem)"
    description: "Medium — 6px fluid (buttons, inputs)"
  - id: radius-lg
    value: "clamp(0.5rem, 0.4rem + 0.2vw, 0.6rem)"
    description: "Large — 8px fluid (cards, modals)"
  - id: radius-xl
    value: "clamp(0.75rem, 0.6rem + 0.3vw, 0.9rem)"
    description: "XL — 12px fluid (drawers, panels)"
  - id: radius-2xl
    value: "clamp(1rem, 0.8rem + 0.4vw, 1.2rem)"
    description: "2XL — 16px fluid (containers)"
  - id: radius-full
    value: "9999px"
    description: "Full — avatars, circular badges, pill buttons"

shadows:
  - id: shadow-sm
    value: "0 1px 2px 0 rgba(0,0,0,0.05)"
    description: "Subtle — cards on canvas"
  - id: shadow-md
    value: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)"
    description: "Medium — elevated cards, dropdowns"
  - id: shadow-lg
    value: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)"
    description: "Large — modals, dialogs"
  - id: shadow-xl
    value: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
    description: "XL — side panels, overlays"
  - id: shadow-2xl
    value: "0 25px 50px -12px rgba(0,0,0,0.25)"
    description: "2XL — full-screen overlays"
  - id: shadow-inner-light
    value: "inset 0 2px 4px 0 rgba(0,0,0,0.06)"
    description: "Inner — pressed inputs, depressed buttons"
  - id: shadow-inner-dark
    value: "inset 0 2px 4px 0 rgba(255,255,255,0.06)"
    description: "Inner dark — pressed inputs in dark mode"

breakpoints:
  - id: sm
    value: "640px"
    description: "Small — mobile landscape"
  - id: md
    value: "768px"
    description: "Medium — tablet portrait"
  - id: lg
    value: "1024px"
    description: "Large — desktop, sidebar collapse threshold"
  - id: xl
    value: "1280px"
    description: "XL — desktop wide, full layout"
  - id: 2xl
    value: "1536px"
    description: "2XL — ultrawide"

components:
  # ═══ BUTTON ═══
  - id: button-primary
    type: component
    description: "Primary action button — brand-rose gradient bg, white text, 4 variants of shadow (none + red tint) based on context"
    props:
      - name: "variant"
        values: ["primary", "secondary", "outline", "ghost", "danger", "success"]
      - name: "size"
        values: ["xs", "sm", "md", "lg", "xl"]
    states:
      - "default — bg-brand-red-600, text-white"
      - "hover — bg-brand-red-700"
      - "active — scale-98 micro-interaction"
      - "disabled — opacity-50, pointer-events-none"
      - "loading — spinner + opacity-80"

  - id: button-outline
    type: component
    description: "Outline button — transparent bg, brand border, brand text"
    props:
      - name: "size"
        values: ["xs", "sm", "md", "lg", "xl"]
    states:
      - "default — border-gray-300, text-gray-700"
      - "hover — bg-gray-50"
      - "dark — border-gray-600, text-gray-200, dark:hover:bg-gray-800"

  - id: button-ghost
    type: component
    description: "Ghost button — no border, minimal hover background"
    props:
      - name: "size"
        values: ["xs", "sm", "md"]
    states:
      - "default — bg-transparent, text-gray-700"
      - "hover — bg-gray-100"
      - "dark — text-gray-200, dark:hover:bg-gray-800"

  # ═══ CARD ═══
  - id: card-default
    type: component
    description: "Default info card — white bg, gray border, soft shadow, RTL padding"
    slots:
      - "header (optional) — title, action button"
      - "body — content with internal padding 4-6"
      - "footer (optional) — actions, links"
    states:
      - "default — bg-white dark:bg-gray-800, border-gray-200 dark:border-gray-700"
      - "hover — shadow-up + -translate-y-1 (card-hover variant)"
      - "flat — no shadow, thin border"
      - "elevated — shadow-md"

  - id: card-stats
    type: component
    description: "Statistics stat card — icon circle top-left, metric number, label, footer link"
    props:
      - name: "icon"
        type: "lucide icon"
        required: true
      - name: "iconColor"
        values: ["brand-red", "brand-blue", "green", "purple", "amber"]
      - name: "value"
        type: "string"
        required: true
      - name: "sublabel"
        type: "string"
      - name: "action"
        type: "link | button"
    pattern: "rounded-full icon p-3 in inverse-100 of icon color, metric number text-3xl, link to full page"

  # ═══ SIDEBAR ═══
  - id: sidebar
    type: component
    description: "Collapsible left-side navigation — fixed, full height, animated width transition 300ms"
    props:
      - name: "collapsed"
        values: [true, false]
        default: true
      - name: "isMobileMenuOpen"
        values: [true, false]
    states:
      - "expanded — w-64, shows labels, descriptions, badges"
      - "collapsed — w-20, shows icons only, minified badges"
      - "mobile — w-72 overlay, slides from right (RTL)"
    sections:
      - "header — HVAR shield logo + system name"
      - "navigation — 7 categories with animated items"
      - "footer — theme toggle + logout"
    behavior:
      - "collapsed by default on desktop <1280px"
      - "hover triggers -translate-x-0 from -translate-x-full"
      - "nav item active — brand-rose-50 bg + brand-rose-700 text"

  # ═══ HEADER ═══
  - id: header
    type: component
    description: "Sticky top header — glass-morphism bg/blur, dynamic title+breadcrumbs, notification bell, profile dropdown"
    slots:
      - "left — mobile hamburger + page title + subtitle + breadcrumbs"
      - "right — custom actions, notification bell (red dot), profile avatar with dropdown"
    behavior:
      - "backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 (glass)"
      - "sticky top-0 z-50"
      - "notification dropdown — 320px menu, empty state 'لا توجد إشعارات جديدة'"
      - "profile dropdown — avatar, name, email, role badge, settings, theme toggle, logout"

  # ═══ BADGE ═══
  - id: badge-status
    type: component
    description: "Status badge — small rounded-full pill for order/service states"
    props:
      - name: "variant"
        values: ["success", "warning", "danger", "info", "primary", "secondary", "default"]
      - name: "size"
        values: ["xs", "sm", "md", "lg"]
    pattern: "inline-flex items-center rounded-full font-medium"
    states:
      - "success — bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      - "warning — bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      - "danger — bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      - "info — bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"

  # ═══ INPUT ═══
  - id: input-text
    type: component
    description: "Text input — full width, gray border, RTL-compatible padding, focus ring brand-rose"
    props:
      - name: "variant"
        values: ["default", "error"]
      - name: "size"
        values: ["sm", "md", "lg"]
    states:
      - "default — border-gray-300 dark:border-gray-700"
      - "focus — ring-brand-red-500 border-brand-red-500"
      - "error — border-red-500, focus:ring-red-500"
      - "disabled — opacity-50"

  # ═══ TABLE ═══
  - id: table
    type: component
    description: "Data table — responsive, hover rows, RTL text alignment"
    slots:
      - "thead — bg-gray-50 dark:bg-gray-800/50, text-right, font-medium"
      - "tbody — divide-y, dark:divide-gray-700"
    states:
      - "row — hover:bg-gray-50 dark:hover:bg-gray-800/50"
      - "row clickable — cursor-pointer"
    pattern: "overflow-x-auto, scrollbar-hide, min-w-full"

  # ═══ MODAL ═══
  - id: modal
    type: component
    description: "Overlay modal — backdrop-blur, centered, animated fade-in"
    slots:
      - "backdrop — fixed inset-0 bg-black/20 z-40"
      - "content — bg-white dark:bg-gray-800, rounded-xl, shadow-xl, max-h scrollbar-hide"
    behavior:
      - "close on backdrop click"
      - "close on Escape"
      - "focus trap (manual)"
      - "z-50 overlay"

  # ═══ COLLAPSIBLE FILTER BAR ═══
  - id: collapsible-filter-bar
    type: component
    description: "Expandable filter bar — toggles open/closed, contains date/state/text/range filters, badge count"
    props:
      - name: "activeFilters"
        type: "number"
        description: "Active filter count shown as badge on toggle button"
      - name: "collapsed"
        default: true
    behavior:
      - "collapse transition with brand-rose icon change"
      - "filter groups arranged in responsive grid"

  # ═══ EMPTY STATE ═══
  - id: empty-state
    type: component
    description: "Empty state placeholder — centered icon, title, description, optional CTA"
    props:
      - name: "icon"
        type: "lucide icon"
      - name: "title"
        type: "string"
      - name: "description"
        type: "string"
      - name: "actionLabel"
        type: "string"
      - name: "actionLink"
        type: "string"
    pattern: "flex flex-col items-center justify-center py-12 text-center"

  # ═══ FLOATING ACTION BUTTON ═══
  - id: fab
    type: component
    description: "Floating action button — fixed bottom-right (RTL: bottom-left), brand-rose gradient, shadow-xl, hover scale"
    props:
      - name: "icon"
        type: "lucide icon"
      - name: "onClick"
        type: "function"
    states:
      - "default — bg-brand-red-600, shadow-xl, hover:scale-110"
      - "active — scale-95"

  # ═══ LOGIN FORM ═══
  - id: login-form
    type: component
    description: "Authentication form — role-based login with demo credentials, 3 role options"
    slots:
      - "header — HVAR shield logo + system name + subtitle"
      - "form — identifier, password, role selector dropdown"
      - "role selector — call-center, operator, manager with Arabic labels"
      - "actions — submit button + loading state"
    behavior:
      - "identifier can be email, phone, or username"
      - "3 demo roles with hardcoded credentials"
      - "stores auth in localStorage (token, user_data, role)"
      - "redirects to dashboard on success"

  # ═══ LOADING ═══
  - id: page-loading
    type: component
    description: "Full-page loading state — centered spinner, optional text"
    props:
      - name: "text"
        default: "جاري تحميل الصفحة..."
      - name: "showLogo"
        default: true
    pattern: "min-h-screen flex items-center justify-center"

  # ═══ TEAM MEMBER CARD ═══
  - id: team-member-card
    type: component
    description: "Team member profile card — avatar with role gradient, name, role badge, stats"
    props:
      - name: "layout"
        values: ["vertical", "horizontal"]
    slots:
      - "avatar — bg-gradient-to-br from-brand-red-500 to-brand-red-700"
      - "info — name, role, contact"
      - "stats — metrics row"
      - "actions — call, message, edit"

  # ═══ ORDER STATUS BADGE ═══
  - id: order-status-badge
    type: component
    description: "Specialized order state badge — maps order state codes to Arabic labels with deterministic colors"
    props:
      - name: "stateCode"
        type: "number"
        values: [10, 24, 30, 45, 46, 47, 48, 100, 101]
      - name: "size"
        values: ["sm", "md"]
    pattern: "Maps ORDER_STATES constant: 45=delivered(green), 46=returned(amber), 48=cancelled(red), 24=warehouse(blue)"

  # ═══ BUSINESS CATEGORY BADGE ═══
  - id: business-category-badge
    type: component
    description: "Order business value category badge — maps amount ranges to tier labels"
    props:
      - name: "value"
        type: "number"
    pattern: "premium_high(≥5000)=success, high_value(1500-5000)=primary, standard(500-1500)=info, low(<500)=warning, zero=secondary, large_refund(< -500)=danger"

  # ═══ FINANCIAL BADGE ═══
  - id: financial-badge
    type: component
    description: "Financial status indicator — COD amount, fees, refunds with color-coded text"
    props:
      - name: "amount"
        type: "number"
      - name: "type"
        values: ["cod", "fees", "refund", "total"]

  # ═══ LAYOUT — Main Shell ═══
  - id: layout
    type: component
    description: "Main application shell — sidebar + header + scrollable content area"
    slots:
      - "sidebar — fixed, animated width, h-screen"
      - "content — flex-1, overflow-auto scrollbar-hide, dynamic padding based on sidebar state"
    behavior:
      - "content width adjusts: ps-16 when collapsed, ps-64 when expanded"
      - "dynamic page title from route map"
      - "supports FAB injection"

  # ═══ ICON PATTERNS ═══
  - id: icon-circle
    type: component
    description: "Circular icon container — brand-colored bg with inverse icon"
    props:
      - name: "color"
        values: ["brand-red", "brand-blue", "green", "purple", "amber"]
      - name: "size"
        values: ["sm", "md", "lg"]
    pattern: "rounded-full p-2 (sm) / p-3 (md) / p-4 (lg), bg-{color}-100 dark:bg-{color}-900/30, icon text-{color}-600 dark:text-{color}-400"

  # ═══ SKELETON ═══
  - id: skeleton
    type: component
    description: "Loading placeholder — pulsing gray blocks matching content shape"
    props:
      - name: "variant"
        values: ["text", "card", "table-row", "avatar", "chart"]

---
