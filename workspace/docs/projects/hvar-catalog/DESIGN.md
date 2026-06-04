---
version: alpha
name: Hvar-Catalog
description: >
  A premium, Arabic-first product catalog for Hvar small appliances — kitchen
  electronics (blenders, irons, vacuum cleaners, fryers, mixers) sold across
  Egypt. The design is confident and editorial: a bold red brand voltage
  (#ef4444) against clean white/light-gray canvases, with gradient accent
  bars, diamond-shaped brand marks, and glass-morphism cards. Motion is part
  of the language — float animations, shimmer loading states, pulse-glow CTAs,
  slide-up reveals. Arabic typography uses Almarai (geometric display weight
  800-900 for headlines) and Tajawal (rounded body weight 300-500 for copy).
  Dark mode inverts the canvas to slate-900 while keeping the red brand heat.
  The system is designed for emotional purchase decisions — photography-first
  product tiles, badge-tagged promotions (جديد/حار/خصم), and merchant-facing
  dealer stats that speak to both retail customers and B2B buyers.

colors:
  # ── Brand Core (Red) ──
  brand-50: "#fef2f2"
  brand-100: "#fee2e2"
  brand-200: "#fecaca"
  brand-300: "#fca5a5"
  brand-400: "#f87171"
  brand-500: "#ef4444"
  brand-600: "#dc2626"
  brand-700: "#b91c1c"
  brand-800: "#991b1b"
  brand-900: "#7f1d1d"
  brand-950: "#450a0a"
  primary: "#ef4444"
  primary-gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
  primary-active: "#dc2626"
  primary-deep: "#b91c1c"
  primary-soft: "#fee2e2"
  primary-on: "#ffffff"

  # ── Secondary (Pink accent) ──
  secondary-500: "#ec4899"
  secondary-600: "#db2777"
  secondary-gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"

  # ── Accent (Green for success/new badges) ──
  accent-500: "#22c55e"
  accent-600: "#16a34a"
  accent-gradient: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)"

  # ── Surfaces ──
  canvas: "#ffffff"
  canvas-soft: "#f8fafc"
  canvas-warm: "#fefcfb"
  canvas-inverse: "#0f172a"
  surface-card: "#ffffff"
  surface-card-soft: "rgba(255, 255, 255, 0.9)"
  surface-glass: "rgba(255, 255, 255, 0.1)"
  surface-glass-dark: "rgba(0, 0, 0, 0.1)"
  surface-glass-card: "rgba(255, 255, 255, 0.8)"
  surface-overlay: "rgba(0, 0, 0, 0.45)"
  surface-skeleton: "#f3f4f6"
  surface-skeleton-dark: "#374151"

  # ── Dark Mode Surfaces ──
  dark-canvas: "#0f172a"
  dark-surface: "#1e293b"
  dark-surface-soft: "#334155"
  dark-surface-card: "rgba(30, 41, 59, 0.95)"
  dark-glass: "rgba(0, 0, 0, 0.1)"

  # ── Text ──
  ink: "#0f172a"
  ink-secondary: "#475569"
  ink-muted: "#94a3b8"
  ink-disabled: "#cbd5e1"
  ink-inverse: "#f8fafc"
  ink-inverse-muted: "#94a3b8"
  ink-gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"

  # ── Dark Mode Text ──
  dark-ink: "#f8fafc"
  dark-ink-secondary: "#cbd5e1"
  dark-ink-muted: "#64748b"

  # ── Structural ──
  hairline: "#e2e8f0"
  hairline-soft: "#f1f5f9"
  hairline-strong: "#cbd5e1"
  divider-gradient: "linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)"

  # ── Status / Semantic (complementary to brand red) ──
  success: "#22c55e"
  success-soft: "#dcfce7"
  success-on: "#ffffff"
  warning: "#f59e0b"
  warning-soft: "#fef3c7"
  warning-on: "#ffffff"
  danger: "#ef4444"
  danger-soft: "#fee2e2"
  danger-on: "#ffffff"
  info: "#3b82f6"
  info-soft: "#dbeafe"
  info-on: "#ffffff"

  # ── Premium Effects ──
  glow-red: "rgba(239, 68, 68, 0.3)"
  glow-red-strong: "rgba(239, 68, 68, 0.4)"
  shadow-red-soft: "rgba(239, 68, 68, 0.08)"
  shadow-red-medium: "rgba(239, 68, 68, 0.12)"
  shadow-red-strong: "rgba(239, 68, 68, 0.16)"

  # ── Badge Gradients ──
  badge-new: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
  badge-hot: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
  badge-discount: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
  badge-featured: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
  badge-merchant: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"

typography:
  # Almarai for display/headings (geometric, strong)
  # Tajawal for body (rounded, readable)
  # Both have full Arabic glyph support

  hero:
    fontFamily: "'Almarai', 'Tajawal', sans-serif"
    fontSize: 56px
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: -0.02em
  display-xl:
    fontFamily: "'Almarai', 'Tajawal', sans-serif"
    fontSize: 48px
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: -0.02em
  display-lg:
    fontFamily: "'Almarai', 'Tajawal', sans-serif"
    fontSize: 40px
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: -0.02em
  display-md:
    fontFamily: "'Almarai', 'Tajawal', sans-serif"
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: -0.01em
  display-sm:
    fontFamily: "'Almarai', 'Tajawal', sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.01em
  headline:
    fontFamily: "'Almarai', 'Tajawal', sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.01em
  title:
    fontFamily: "'Almarai', 'Tajawal', sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: 0
  title-sm:
    fontFamily: "'Almarai', 'Tajawal', sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0
  body-lg:
    fontFamily: "'Tajawal', 'Almarai', sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body:
    fontFamily: "'Tajawal', 'Almarai', sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "'Tajawal', 'Almarai', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "'Tajawal', 'Almarai', sans-serif"
    fontSize: 12px
    fontWeight: 300
    lineHeight: 1.4
    letterSpacing: 0
  fine-print:
    fontFamily: "'Tajawal', 'Almarai', sans-serif"
    fontSize: 10px
    fontWeight: 300
    lineHeight: 1.3
    letterSpacing: 0

  # ── Brand Typography ──
  brand-hero:
    fontFamily: "'Almarai', serif"
    fontSize: 40px
    fontWeight: 900
    lineHeight: 1
    letterSpacing: -0.02em
  brand-display:
    fontFamily: "'Almarai', serif"
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.01em
  brand-wordmark:
    fontFamily: "'Almarai', serif"
    fontSize: 24px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.01em

  # ── Price / Financial ──
  price-lg:
    fontFamily: "'Tajawal', 'Almarai', sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  price:
    fontFamily: "'Tajawal', 'Almarai', sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0
  price-sm:
    fontFamily: "'Tajawal', 'Almarai', sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  price-original:
    fontFamily: "'Tajawal', 'Almarai', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.3
    textDecoration: line-through
    color: "{colors.ink-muted}"

  # ── SKU / Code ──
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

spacing:
  xxs: 2px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 20px
  xxxl: 24px
  section: 48px
  section-lg: 64px
  section-xl: 80px
  page: 40px

  # Product Grid
  grid-gap: 24px
  grid-gap-sm: 16px
  grid-gap-lg: 32px

rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  2xl: 24px
  3xl: 32px
  pill: 9999px
  full: 9999px

shadow:
  none: none
  sm: "0 1px 2px 0 rgba(0,0,0,0.05)"
  DEFAULT: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)"
  md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)"
  lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)"
  xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
  2xl: "0 25px 50px -12px rgba(0,0,0,0.25)"
  3xl: "0 35px 60px -15px rgba(0,0,0,0.3)"
  soft: "0 2px 15px rgba(239,68,68,0.08)"
  medium: "0 4px 25px rgba(239,68,68,0.12)"
  strong: "0 8px 40px rgba(239,68,68,0.16)"
  glow: "0 0 30px rgba(239,68,68,0.3)"
  glow-premium: "0 0 40px rgba(239,68,68,0.4)"
  glass: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1)"

breakpoints:
  mobile: 640px
  tablet: 768px
  desktop: 1024px
  wide: 1280px
  hd: 1536px

components:
  # ── HVAR Brand Diamond ──
  brand-diamond:
    backgroundColor: "{colors.primary-gradient}"
    width: 2.4rem
    height: 2.6rem
    rounded: "{rounded.lg}"
    icon: "H"
    iconColor: "{colors.primary-on}"
    iconWeight: 900
    iconSize: 2rem
    shadow: "0 4px 8px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
    transform: "rotate(-45deg) scaleX(-1)"
    hoverTransform: "rotate(-45deg) scaleX(-1) scale(1.05)"
    hoverShadow: "0 8px 16px rgba(239,68,68,0.4)"

  # ── Buttons ──
  button-primary:
    backgroundColor: "{colors.primary-gradient}"
    textColor: "{colors.primary-on}"
    typography: "{typography.body}"
    fontWeight: 700
    rounded: "{rounded.xl}"
    padding: 12px 24px
    minHeight: 48px
    shadow: "{shadow.md}"
    hoverShadow: "{shadow.xl}"
    hoverTransform: "translateY(-2px) scale(1.05)"
    activeTransform: "translateY(0)"
    focusRing: "4px solid rgba(239,68,68,0.5)"
    overflow: hidden
    beforeContent: "''"
    beforeGradient: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
    beforePosition: "top:0; left:-100%; width:100%; height:100%"
    beforeHoverLeft: "100%"
  button-secondary:
    backgroundColor: "{colors.surface-card-soft}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    typography: "{typography.body}"
    fontWeight: 600
    rounded: "{rounded.xl}"
    padding: 12px 24px
    minHeight: 48px
    hoverBackground: "{colors.brand-50}"
    hoverBorder: "{colors.brand-300}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    fontWeight: 600
    rounded: "{rounded.xl}"
    padding: 10px 20px
    minHeight: 40px
    hoverBackground: "{colors.brand-50}"
    hoverColor: "{colors.brand-600}"
  button-icon:
    backgroundColor: "rgba(255,255,255,0.9)"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.full}"
    size: 40px
    shadow: "{shadow.md}"
    hoverShadow: "{shadow.lg}"
    hoverColor: "{colors.primary}"
    hoverBorder: "{colors.brand-300}"
    darkBackground: "rgba(51,65,85,0.9)"
    darkBorder: "rgba(71,85,105,0.5)"

  # ── Cards ──
  product-card:
    backgroundColor: "{colors.surface-card-soft}"
    backdropFilter: "blur(4px)"
    rounded: "{rounded['2xl']}"
    shadow: "{shadow.xl}"
    border: "1px solid rgba(255,255,255,0.2)"
    padding: 16px
    hoverShadow: "{shadow['2xl']}"
    hoverTransform: "translateY(-4px) scale(1.02)"
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    beforeContent: "''"
    beforeHeight: "2px"
    beforeGradient: "{colors.primary-gradient}"
    beforeScaleX: 0
    beforeHoverScaleX: 1
    darkBackground: "rgba(30,41,59,0.9)"
    darkBorder: "rgba(51,65,85,0.5)"
  stat-card:
    backgroundColor: "{colors.surface-card-soft}"
    backdropFilter: "blur(4px)"
    rounded: "{rounded.xl}"
    padding: 20px
    shadow: "{shadow.md}"
    iconRounded: "{rounded.xl}"
    iconSize: 48px
    iconShadow: "{shadow.md}"

  # ── Badges ──
  badge-new:
    background: "{colors.badge-new}"
    textColor: "{colors.primary-on}"
    typography: "{typography.caption}"
    fontWeight: 700
    rounded: "{rounded.pill}"
    padding: 4px 12px
    shadow: "0 2px 4px rgba(0,0,0,0.1)"
  badge-hot:
    background: "{colors.badge-hot}"
    textColor: "{colors.primary-on}"
    typography: "{typography.caption}"
    fontWeight: 700
    rounded: "{rounded.pill}"
    padding: 4px 12px
    shadow: "0 2px 4px rgba(0,0,0,0.1)"
  badge-discount:
    background: "{colors.badge-discount}"
    textColor: "{colors.primary-on}"
    typography: "{typography.caption}"
    fontWeight: 700
    rounded: "{rounded.pill}"
    padding: 4px 12px
    shadow: "0 2px 4px rgba(0,0,0,0.1)"
  badge-featured:
    background: "{colors.badge-featured}"
    textColor: "#111827"
    typography: "{typography.caption}"
    fontWeight: 700
    rounded: "{rounded.pill}"
    padding: 4px 12px
  badge-tag:
    backgroundColor: "{colors.brand-50}"
    textColor: "{colors.brand-600}"
    typography: "{typography.caption}"
    fontWeight: 600
    rounded: "{rounded.md}"
    padding: 2px 8px

  # ── Product Image ──
  product-image:
    rounded: "{rounded.xl}"
    aspectRatio: "1/1"
    objectFit: "cover"
    backgroundColor: "{colors.canvas-soft}"
    transition: "all 0.5s ease-out"
    hoverScale: 1.1
    hoverBrightness: 1.1
    loadingBackground: "{colors.surface-skeleton}"
    loadingAnimation: "shimmer 1.5s infinite"

  # ── Section Divider ──
  section-divider:
    height: 2px
    background: "{colors.divider-gradient}"
    accentSize: 8px
    accentBackground: "{colors.primary-gradient}"
    accentRounded: "{rounded.full}"

  # ── Header / Nav ──
  header:
    backgroundColor: "rgba(255,255,255,0.9)"
    backdropFilter: "blur(20px)"
    borderBottom: "1px solid rgba(229,231,235,0.3)"
    height: 64px
    sticky: true
    scrolledBackground: "rgba(255,255,255,0.95)"
    scrolledShadow: "{shadow.lg}"
    darkBackground: "rgba(15,23,42,0.9)"
    darkScrolledBackground: "rgba(15,23,42,0.95)"
  nav-link:
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body-sm}"
    fontWeight: 500
    hoverColor: "{colors.primary}"
    hoverScale: 1.05
    underlineGradient: "{colors.primary-gradient}"
    underlineHeight: 2px
  nav-dropdown:
    backgroundColor: "rgba(255,255,255,0.95)"
    backdropFilter: "blur(20px)"
    rounded: "{rounded['2xl']}"
    shadow: "{shadow.xl}"
    border: "1px solid rgba(229,231,235,0.5)"
    padding: 16px
    darkBackground: "rgba(30,41,59,0.95)"
    darkBorder: "rgba(51,65,85,0.5)"

  # ── Category Display ──
  category-chip:
    background: "linear-gradient(135deg, {colors.brand-50} 0%, {colors.brand-100} 100%)"
    textColor: "{colors.brand-700}"
    rounded: "{rounded.xl}"
    padding: 12px 16px
    minWidth: 120px
    hoverTransform: "scale(1.05)"
    hoverShadow: "{shadow.medium}"
    iconSize: 40px
    iconRounded: "{rounded.lg}"

  # ── Hero Section ──
  hero:
    minHeight: "calc(100vh - 4rem)"
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)"
    darkBackground: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
    patternSize: 64px
    patternOpacity: 0.03
    patternColor: "rgba(239,68,68,0.03)"

  # ── Modal / Quick View ──
  modal-overlay:
    backgroundColor: "{colors.surface-overlay}"
    backdropFilter: "blur(4px)"
  modal-card:
    backgroundColor: "{colors.surface-card-soft}"
    backdropFilter: "blur(20px)"
    rounded: "{rounded['2xl']}"
    shadow: "{shadow['2xl']}"
    border: "1px solid rgba(255,255,255,0.4)"
    padding: 24px
    maxWidth: 480px

  # ── Skeleton / Loading ──
  skeleton-card:
    backgroundColor: "{colors.surface-skeleton}"
    rounded: "{rounded.xl}"
    animation: "shimmer 1.5s infinite"
    backgroundGradient: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)"
    darkBackgroundGradient: "linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%)"

  # ── Glass Effect ──
  glass:
    background: "rgba(255,255,255,0.1)"
    backdropFilter: "blur(20px)"
    border: "1px solid rgba(255,255,255,0.2)"
  glass-dark:
    background: "rgba(0,0,0,0.1)"
    backdropFilter: "blur(20px)"
    border: "1px solid rgba(255,255,255,0.1)"
  glass-card:
    background: "rgba(255,255,255,0.8)"
    backdropFilter: "blur(20px)"
    border: "1px solid rgba(255,255,255,0.3)"
