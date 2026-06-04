---
title: "HUB-MCRM — Service CRM for Hvar"
version: alpha
description: "HUB-MCRM is the service CRM layer for the Hvar ecosystem — call center operations (ERP + Bosta), hub workflows (replacement, maintenance, return, sell), stock management, and customer 360° views. Arabic-first RTL, PWA-ready, QR scan, Bosta integration. Live: mcrm.hvarstore.com"

colors:
  # ═══ BRAND — Rose Primary (⬆ evolved from Hvar-OLD) ═══
  - id: brand-red-50
    value: "#fff1f2"
    type: color
    category: brand
    description: "Brand rose — lightest tint for subtle backgrounds and hover surfaces"
  - id: brand-red-100
    value: "#ffe4e6"
    type: color
    category: brand
    description: "Brand rose — light tint for hover backgrounds"
  - id: brand-red-200
    value: "#fecdd3"
    type: color
    category: brand
    description: "Brand rose — soft accent border"
  - id: brand-red-300
    value: "#fda4af"
    type: color
    category: brand
    description: "Brand rose — medium accent for disabled states"
  - id: brand-red-400
    value: "#fb7185"
    type: color
    category: brand
    description: "Brand rose — hover state for primary buttons"
  - id: brand-red-500
    value: "#f43f5e"
    type: color
    category: brand
    description: "Brand rose — main primary actions, CTAs, active links"
  - id: brand-red-600
    value: "#e11d48"
    type: color
    category: brand
    description: "Brand rose — strong primary, gradient end, active state"
  - id: brand-red-700
    value: "#be123c"
    type: color
    category: brand
    description: "Brand rose — deep hover state on dark"
  - id: brand-red-800
    value: "#9f1239"
    type: color
    category: brand
    description: "Brand rose — dark accent for depth"
  - id: brand-red-900
    value: "#881337"
    type: color
    category: brand
    description: "Brand rose — deepest brand tone"
  - id: brand-red-950
    value: "#4c0519"
    type: color
    category: brand
    description: "Brand rose — near-black brand accent"

  # ═══ SECONDARY — Blue (Info & Data) ═══
  - id: brand-blue-50
    value: "#f0f9ff"
    type: color
    category: secondary
    description: "Blue — lightest info background"
  - id: brand-blue-500
    value: "#0ea5e9"
    type: color
    category: secondary
    description: "Blue — secondary actions, info icons"
  - id: brand-blue-600
    value: "#0284c7"
    type: color
    category: secondary
    description: "Blue — info badge, active secondary"
  - id: brand-blue-700
    value: "#0369a1"
    type: color
    category: secondary
    description: "Blue — pressed secondary, link hover"

  # ═══ ACCENTS ═══
  - id: accent-green-500
    value: "#22c55e"
    type: color
    category: accent
    description: "Green — success states, completed status"
  - id: accent-amber-500
    value: "#f97316"
    type: color
    category: accent
    description: "Amber — warning, maintenance status"
  - id: accent-purple-500
    value: "#a855f7"
    type: color
    category: accent
    description: "Purple — premium, call center analytics"
  - id: accent-red-500
    value: "#ef4444"
    type: color
    category: accent
    description: "Red — danger, errors, critical alerts"

  # ═══ SEMANTIC — UI Colors ═══
  - id: ui-success-500
    value: "#22c55e"
    type: color
    category: semantic
    description: "UI Success — completed, green badges"
  - id: ui-warning-500
    value: "#f97316"
    type: color
    category: semantic
    description: "UI Warning — pending, in-progress, amber badges"
  - id: ui-danger-500
    value: "#ef4444"
    type: color
    category: semantic
    description: "UI Danger — errors, cancellations, critical"
  - id: ui-info-500
    value: "#3b82f6"
    type: color
    category: semantic
    description: "UI Info — informational indicators, blue"

  # ═══ STATUS — Hub Scanning Operative ═══
  - id: status-shipping
    value: "#8b5cf6"
    type: color
    category: status
    description: "Shipping — purple, Bosta tracking status"
  - id: status-maintenance
    value: "#f97316"
    type: color
    category: status
    description: "Maintenance — amber, in workshop"
  - id: status-completed
    value: "#10b981"
    type: color
    category: status
    description: "Completed — teal-green, ticket closed"
  - id: status-failed
    value: "#ef4444"
    type: color
    category: status
    description: "Failed — red, ticket failed"
  - id: status-pending
    value: "#64748b"
    type: color
    category: status
    description: "Pending — slate, waiting action"
  - id: status-processing
    value: "#3b82f6"
    type: color
    category: status
    description: "Processing — blue, being worked"
  - id: status-active
    value: "#22c55e"
    type: color
    category: status
    description: "Active — green, call session live"
  - id: status-busy
    value: "#f59e0b"
    type: color
    category: status
    description: "Busy — amber, agent occupied"
  - id: status-offline
    value: "#6b7280"
    type: color
    category: status
    description: "Offline — gray, agent logged out"

  # ═══ SURFACE ═══
  - id: surface-page-light
    value: "#f9fafb"
    type: color
    category: surface
    description: "Page background — light mode"
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

  # ═══ INK ═══
  - id: ink-primary-light
    value: "#111827"
    type: color
    category: ink
    description: "Primary text — light mode (gray-900)"
  - id: ink-primary-dark
    value: "#f9fafb"
    type: color
    category: ink
    description: "Primary text — dark mode (gray-50)"
  - id: ink-secondary-light
    value: "#4b5563"
    type: color
    category: ink
    description: "Secondary text — light mode (gray-600)"
  - id: ink-secondary-dark
    value: "#9ca3af"
    type: color
    category: ink
    description: "Secondary text — dark mode (gray-400)"
  - id: ink-muted-light
    value: "#9ca3af"
    type: color
    category: ink
    description: "Muted text — light mode (gray-400)"

  # ═══ BORDER ═══
  - id: border-light
    value: "#e5e7eb"
    type: color
    category: border
    description: "Divider/card border — light mode"
  - id: border-dark
    value: "#374151"
    type: color
    category: border
    description: "Divider/card border — dark mode"
  - id: border-brand
    value: "#f43f5e"
    type: color
    category: border
    description: "Brand border — focus rings, active states"

  # ═══ SHADOW TINTS ═══
  - id: shadow-red
    value: "0 4px 14px 0 rgba(244,63,94,0.2)"
    type: box-shadow
    category: shadow
    description: "Red shadow tint — primary buttons"
  - id: shadow-blue
    value: "0 4px 14px 0 rgba(14,165,233,0.2)"
    type: box-shadow
    category: shadow
    description: "Blue shadow tint — info elements"
  - id: shadow-green
    value: "0 4px 14px 0 rgba(34,197,94,0.2)"
    type: box-shadow
    category: shadow
    description: "Green shadow tint — success elements"
  - id: shadow-amber
    value: "0 4px 14px 0 rgba(249,115,22,0.2)"
    type: box-shadow
    category: shadow
    description: "Amber shadow tint — warning elements"
  - id: shadow-purple
    value: "0 4px 14px 0 rgba(168,85,247,0.2)"
    type: box-shadow
    category: shadow
    description: "Purple shadow tint — premium elements"
  - id: shadow-brand-red
    value: "0 4px 14px 0 rgba(244,63,94,0.25)"
    type: box-shadow
    category: shadow
    description: "Brand-red deeper shadow"

typography:
  - id: display
    value: "Cairo"
    type: fontFamily
    category: display
    description: "Display font — Cairo, Tajawal fallback"
  - id: body
    value: "Cairo"
    type: fontFamily
    category: body
    description: "Body font — Cairo (primary), Tajawal fallback"
  - id: heading-h1
    value: "clamp(2.25rem, 2rem + 0.6vw, 2.5rem)"
    type: fontSize
    category: heading
    description: "H1 — fluid 2.25-2.5rem, Cairo 700, leading 1.2"
  - id: heading-h2
    value: "clamp(1.875rem, 1.7rem + 0.5vw, 2.1rem)"
    type: fontSize
    category: heading
    description: "H2 — fluid 1.875-2.1rem, Cairo 700"
  - id: heading-h3
    value: "clamp(1.5rem, 1.4rem + 0.4vw, 1.7rem)"
    type: fontSize
    category: heading
    description: "H3 — fluid 1.5-1.7rem, Cairo 700"
  - id: heading-h4
    value: "clamp(1.25rem, 1.2rem + 0.3vw, 1.4rem)"
    type: fontSize
    category: heading
    description: "H4 — fluid 1.25-1.4rem, Cairo 700"
  - id: body-base
    value: "clamp(1rem, 0.95rem + 0.2vw, 1.1rem)"
    type: fontSize
    category: body
    description: "Body — fluid 1-1.1rem, Cairo 400, leading 1.6"
  - id: body-small
    value: "clamp(0.875rem, 0.8rem + 0.15vw, 0.9rem)"
    type: fontSize
    category: body
    description: "Small body — fluid 0.875-0.9rem"
  - id: body-xs
    value: "clamp(0.75rem, 0.7rem + 0.1vw, 0.8rem)"
    type: fontSize
    category: body
    description: "Extra small — fluid 0.75-0.8rem"
  - id: body-large
    value: "clamp(1.125rem, 1.05rem + 0.25vw, 1.2rem)"
    type: fontSize
    category: body
    description: "Large body — fluid 1.125-1.2rem"
  - id: mono
    value: "Roboto Mono, monospace"
    type: fontFamily
    category: mono
    description: "Monospace — tracking numbers, codes, numbers"

spacing:
  - id: space-1
    value: "clamp(0.25rem, 0.2rem + 0.1vw, 0.3rem)"
    type: spacing
    description: "1 unit — 4px fluid"
  - id: space-2
    value: "clamp(0.5rem, 0.4rem + 0.2vw, 0.6rem)"
    type: spacing
    description: "2 unit — 8px fluid"
  - id: space-4
    value: "clamp(1rem, 0.8rem + 0.4vw, 1.2rem)"
    type: spacing
    description: "4 unit — 16px fluid (base inset)"
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
    description: "16 unit — 64px fluid"
  - id: space-20
    value: "clamp(5rem, 4rem + 2vw, 6rem)"
    type: spacing
    description: "20 unit — 80px fluid"

radii:
  - id: radius-sm
    value: "clamp(0.125rem, 0.1rem + 0.05vw, 0.15rem)"
    description: "Small — tags, chips"
  - id: radius-md
    value: "clamp(0.375rem, 0.3rem + 0.15vw, 0.45rem)"
    description: "Medium — buttons, inputs"
  - id: radius-lg
    value: "clamp(0.5rem, 0.4rem + 0.2vw, 0.6rem)"
    description: "Large — cards, modals"
  - id: radius-xl
    value: "clamp(0.75rem, 0.6rem + 0.3vw, 0.9rem)"
    description: "XL — drawers, panels"
  - id: radius-2xl
    value: "clamp(1rem, 0.8rem + 0.4vw, 1.2rem)"
    description: "2XL — containers"
  - id: radius-3xl
    value: "clamp(1.5rem, 1.2rem + 0.6vw, 1.8rem)"
    description: "3XL — large cards, scan frames"
  - id: radius-full
    value: "9999px"
    description: "Full — avatars, circular badges"

components:
  - id: button
    type: component
    description: "Primary action button — brand-rose bg, white text, 6 variants, 5 sizes, micro-interactions"
    props:
      - name: "variant"
        values: ["primary", "secondary", "outline", "ghost", "danger", "success"]
      - name: "size"
        values: ["xs", "sm", "md", "lg", "xl"]
    states:
      - "default — brand-red-600 bg, white text, rounded-xl"
      - "hover — translateY(-1px), shadow-up"
      - "active — translateY(0), scale-98"
      - "disabled — opacity-50, pointer-events-none"

  - id: badge
    type: component
    description: "Status badge — 6 variants for service ticket states, hub scanning statuses"
    props:
      - name: "variant"
        values: ["success", "warning", "danger", "info", "primary", "secondary"]
      - name: "size"
        values: ["sm", "md", "lg"]

  - id: status-chip
    type: component
    description: "Small inline status indicator — colored dot + label for call center agent states"
    props:
      - name: "status"
        values: ["active", "busy", "offline", "pending", "processing", "completed"]

  - id: status-indicator
    type: component
    description: "Pulsing status dot — live call session indicator, scanning state"
    props:
      - name: "status"
        values: ["live", "scanning", "idle", "error"]

  - id: service-status-badge
    type: component
    description: "Service ticket status (R/M/T/S) with Arabic labels and color mapping"
    props:
      - name: "type"
        values: ["replacement", "maintenance", "return", "sell"]

  - id: input
    type: component
    description: "Arabic-optimized input — Cairo font, RTL padding, focus ring brand-blue"
    props:
      - name: "variant"
        values: ["default", "error"]
      - name: "size"
        values: ["sm", "md", "lg"]
    states:
      - "default — border-gray-300, arabic-input utility class"
      - "focus — ring-brand-blue-500, border-brand-blue-500"

  - id: modal
    type: component
    description: "Overlay modal — backdrop fade, centered, animated slide-up"
    slots:
      - "backdrop — fixed inset-0 bg-black/20 z-40, backdrop-blur-sm"
      - "content — bg-white dark:bg-gray-800, rounded-2xl, shadow-xl, max-h scrollbar-hide"

  - id: empty-state
    type: component
    description: "Centered empty state — icon, title, description, optional CTA"
    props:
      - name: "icon"
        type: "lucide icon"
      - name: "title"
        type: "string"
      - name: "description"
        type: "string"
      - name: "actionLabel"
        type: "string"

  - id: call-session-fab
    type: component
    description: "Global floating action button for active call session — persists across routes"
    behavior:
      - "rendered at App root, survives route changes"
      - "shows when activeCallSession.order OR activeCallSession.customerContext exist"
      - "end call, timer, customer info"

  - id: global-navigation
    type: component
    description: "Top navigation bar — hub, services, stock, customer service tabs with nested sub-tabs"
    props:
      - name: "items"
        type: "array"
      - name: "activeTab"
        type: "string"

  - id: governorate-search-select
    type: component
    description: "Governorate + district search/select with Arabic name support and ERP ID resolution"

  - id: theme-toggle
    type: component
    description: "Dark/light mode toggle — persisted in localStorage, respects system preference"

  - id: error-boundary
    type: component
    description: "React error boundary with fallback UI and retry action"

  - id: pagination-controls
    type: component
    description: "Page-based pagination with Arabic labels, page size selector"
---
