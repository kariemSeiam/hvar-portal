---
version: alpha
name: Hvar-POS
description: >
  A no-nonsense POS and business management system designed for Egyptian commerce.
  Built around fast visual scanning — status badges tell the story before the
  eyes reach the text. Dual Arabic/English with full RTL support. Three density
  modes: POS terminal uses large touch-optimized targets for cashiers; admin
  panel runs dense data tables for power users; storefront reads clean and
  trustworthy. The system is data-heavy by nature — tables of orders, products,
  stock movements, payments — so the design recedes and the data speaks. Color
  carries semantic weight: green is financial success (paid, completed), amber
  is pending action, red is failure or cancellation, blue is informational (in
  progress, syncing). Every interactive element has a visible focus state and
  meets WCAG AA contrast.

colors:
  # ── Brand ──
  brand-900: "#0d2b1d"
  brand-800: "#14452f"
  brand-700: "#1b5e40"
  brand-600: "#227851"
  brand-500: "#2a9d66"
  brand-400: "#44b77e"
  brand-300: "#6ecc9b"
  brand-200: "#a0e0bc"
  brand-100: "#d0f0e0"
  brand-50: "#eafaf3"
  primary: "#227851"
  primary-focus: "#1b5e40"
  primary-active: "#14452f"
  primary-soft: "#eafaf3"
  on-primary: "#ffffff"

  # ── Surface & Canvas ──
  canvas: "#ffffff"
  canvas-soft: "#f8f9fa"
  canvas-muted: "#f0f1f3"
  canvas-strong: "#e4e6ea"
  canvas-inverse: "#1a1d23"
  surface: "#ffffff"
  surface-soft: "#fafbfc"
  surface-hover: "#f3f4f6"
  surface-card: "#ffffff"
  surface-elevated: "#ffffff"
  surface-overlay: "rgba(0, 0, 0, 0.45)"
  surface-skeleton: "#e4e6ea"

  # ── Ink / Text ──
  ink: "#1a1d23"
  ink-secondary: "#4a4d55"
  ink-muted: "#767a85"
  ink-disabled: "#b0b3bb"
  ink-inverse: "#ffffff"
  ink-inverse-muted: "#a0a4b0"
  ink-placeholder: "#9ca0ab"

  # ── Structural ──
  hairline: "#e4e6ea"
  hairline-soft: "#eaecf0"
  hairline-strong: "#cdd0d7"
  border-input: "#cdd0d7"
  border-input-focus: "#227851"
  divider: "#e4e6ea"

  # ── Status / Semantic ──
  # Success  → paid, completed, delivered, approved, active
  success: "#16a34a"
  success-soft: "#dcfce7"
  success-deep: "#15803d"
  success-on: "#ffffff"

  # Warning  → pending, awaiting, processing, partially-paid
  warning: "#d97706"
  warning-soft: "#fef3c7"
  warning-deep: "#b45309"
  warning-on: "#ffffff"

  # Danger / Error → failed, cancelled, rejected, refunded, expired
  danger: "#dc2626"
  danger-soft: "#fce4e4"
  danger-deep: "#b91c1c"
  danger-on: "#ffffff"

  # Info / Processing → syncing, in-progress, in-transit, draft
  info: "#2563eb"
  info-soft: "#dbeafe"
  info-deep: "#1d4ed8"
  info-on: "#ffffff"

  # Neutral / Inactive  → draft, unused, offline
  neutral: "#6b7280"
  neutral-soft: "#f3f4f6"
  neutral-deep: "#4b5563"
  neutral-on: "#ffffff"

  # ── POS Terminal Specific ──
  pos-canvas: "#1a1d23"
  pos-surface: "#252830"
  pos-surface-hover: "#2f323c"
  pos-hairline: "#383b45"
  pos-ink: "#ffffff"
  pos-ink-muted: "#9ca0ab"
  pos-cart-surface: "#1e2128"
  pos-cart-highlight: "#2a9d66"
  pos-keypad: "#2f323c"
  pos-keypad-hover: "#3b3e48"
  pos-keypad-action: "#227851"
  pos-keypad-danger: "#dc2626"

  # ── Money / Financial ──
  money-positive: "#16a34a"
  money-negative: "#dc2626"
  money-zero: "#6b7280"
  money-credit: "#2563eb"

  # ── Scrollbar ──
  scrollbar-track: "#f0f1f3"
  scrollbar-thumb: "#cdd0d7"
  scrollbar-thumb-hover: "#a0a4b0"

typography:
  # ── Display / Titles ──
  display-lg:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.5px
  display:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.3px
  display-sm:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.2px

  # ── Headings ──
  heading-lg:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  heading:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  heading-sm:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0

  # ── Body ──
  body-lg:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

  # ── Financial / Tabular ──
  money-lg:
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.3px
    fontVariant: tabular-nums
  money:
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.2px
    fontVariant: tabular-nums
  money-sm:
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.1px
    fontVariant: tabular-nums
  money-tabular:
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
    fontVariant: tabular-nums

  # ── Code / Barcode ──
  code:
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  code-sm:
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

  # ── Button ──
  button-lg:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  button:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  button-sm:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0

  # ── POS Terminal ──
  pos-price:
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.3px
    fontVariant: tabular-nums
  pos-product-name:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0
  pos-qty:
    fontFamily: "'Inter', 'Cairo', system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0
    fontVariant: tabular-nums
  pos-key:
    fontFamily: "'Cairo', 'Inter', system-ui, -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0

  # ── Arabic-Specific Adjustments ──
  # Cairo font handles Arabic natively with proper letter-spacing ignored for RTL

spacing:
  xxs: 2px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 20px
  xxxl: 24px
  section: 32px
  page: 40px

  # POS terminal uses XL spacing for touch targets
  pos-gap: 8px
  pos-padding: 16px
  pos-key-size: 56px
  pos-cart-min-height: 48px

rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  pill: 9999px

shadow:
  none: none
  xs: "0 1px 2px rgba(0,0,0,0.04)"
  sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"
  md: "0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)"
  lg: "0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)"
  xl: "0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04)"
  overlay: "0 25px 50px rgba(0,0,0,0.12)"
  pos-elevated: "0 8px 24px rgba(0,0,0,0.25)"

breakpoints:
  mobile: 480px
  tablet: 768px
  desktop: 1024px
  wide: 1280px
  hd: 1440px

components:
  # ── Buttons ──
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    minHeight: 40px
    focusOutline: "2px solid {colors.primary}"
    focusOffset: 2px
    loading: "{colors.brand-300}"
  button-primary-lg:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-lg}"
    rounded: "{rounded.md}"
    padding: 14px 28px
    minHeight: 48px
  button-primary-sm:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.sm}"
    padding: 6px 12px
    minHeight: 32px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    minHeight: 40px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    minHeight: 40px
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.danger-on}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    minHeight: 40px
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.success-on}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 10px 20px
    minHeight: 40px
  button-icon:
    backgroundColor: transparent
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    size: 36px
    hoverBackground: "{colors.surface-hover}"

  # ── POS Terminal Buttons ──
  pos-key-num:
    backgroundColor: "{colors.pos-keypad}"
    textColor: "{colors.pos-ink}"
    typography: "{typography.pos-key}"
    rounded: "{rounded.md}"
    minHeight: 56px
    minWidth: 56px
    activeBackground: "{colors.pos-keypad-hover}"
  pos-key-action:
    backgroundColor: "{colors.pos-keypad-action}"
    textColor: "{colors.on-primary}"
    typography: "{typography.pos-key}"
    rounded: "{rounded.md}"
    minHeight: 56px
    minWidth: 56px
  pos-key-danger:
    backgroundColor: "{colors.pos-keypad-danger}"
    textColor: "{colors.on-primary}"
    typography: "{typography.pos-key}"
    rounded: "{rounded.md}"
    minHeight: 56px
    minWidth: 56px
  pos-checkout:
    backgroundColor: "{colors.pos-keypad-action}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-lg}"
    rounded: "{rounded.md}"
    minHeight: 56px
    width: "100%"

  # ── Status Badges ──
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success-deep}"
    typography: "{typography.body-sm}"
    fontWeight: 600
    rounded: "{rounded.pill}"
    padding: 2px 10px
  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning-deep}"
    typography: "{typography.body-sm}"
    fontWeight: 600
    rounded: "{rounded.pill}"
    padding: 2px 10px
  badge-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-deep}"
    typography: "{typography.body-sm}"
    fontWeight: 600
    rounded: "{rounded.pill}"
    padding: 2px 10px
  badge-info:
    backgroundColor: "{colors.info-soft}"
    textColor: "{colors.info-deep}"
    typography: "{typography.body-sm}"
    fontWeight: 600
    rounded: "{rounded.pill}"
    padding: 2px 10px
  badge-neutral:
    backgroundColor: "{colors.neutral-soft}"
    textColor: "{colors.neutral-deep}"
    typography: "{typography.body-sm}"
    fontWeight: 600
    rounded: "{rounded.pill}"
    padding: 2px 10px

  # ── Data Table ──
  table:
    backgroundColor: "{colors.surface}"
    headerBackground: "{colors.canvas-soft}"
    headerText: "{colors.ink-muted}"
    headerTypography: "{typography.body-sm}"
    headerWeight: 600
    bodyTypography: "{typography.body}"
    bodyText: "{colors.ink}"
    borderColor: "{colors.hairline}"
    borderWidth: 1px
    cellPadding: 12px 16px
    rowHover: "{colors.surface-hover}"
    rowStriped: "{colors.surface-soft}"
    rounded: "{rounded.lg}"
  table-compact:
    backgroundColor: "{colors.surface}"
    headerBackground: "{colors.canvas-soft}"
    headerText: "{colors.ink-muted}"
    headerTypography: "{typography.caption}"
    headerWeight: 600
    bodyTypography: "{typography.body-sm}"
    bodyText: "{colors.ink}"
    borderColor: "{colors.hairline-soft}"
    borderWidth: 1px
    cellPadding: 8px 12px
    rowHover: "{colors.surface-hover}"
    rowStriped: "{colors.surface-soft}"
    rounded: "{rounded.sm}"

  # ── Data Card (summary cards on dashboard) ──
  stat-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 20px
    shadow: "{shadow.sm}"
    titleTypography: "{typography.caption}"
    titleColor: "{colors.ink-muted}"
    valueTypography: "{typography.display-sm}"
    valueColor: "{colors.ink}"

  # ── POS Cart Item ──
  pos-cart-item:
    backgroundColor: "{colors.pos-cart-surface}"
    rounded: "{rounded.md}"
    padding: 10px 12px
    borderBottom: "1px solid {colors.pos-hairline}"
    productNameTypography: "{typography.pos-product-name}"
    productNameColor: "{colors.pos-ink}"
    priceTypography: "{typography.money-sm}"
    priceColor: "{colors.pos-ink}"
    qtyTypography: "{typography.pos-qty}"
    qtyColor: "{colors.pos-ink}"
    minHeight: 48px

  # ── Form Elements ──
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.border-input}"
    rounded: "{rounded.md}"
    padding: 10px 12px
    minHeight: 40px
    typography: "{typography.body}"
    placeholderColor: "{colors.ink-placeholder}"
    focusBorder: "{colors.border-input-focus}"
    focusOutline: "2px solid {colors.primary-soft}"
    disabledBackground: "{colors.canvas-soft}"
    disabledText: "{colors.ink-disabled}"
  input-sm:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.border-input}"
    rounded: "{rounded.sm}"
    padding: 6px 10px
    minHeight: 32px
    typography: "{typography.body-sm}"
    focusBorder: "{colors.border-input-focus}"
  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.border-input}"
    rounded: "{rounded.md}"
    padding: 10px 12px
    minHeight: 40px
    typography: "{typography.body}"
    focusBorder: "{colors.border-input-focus}"

  # ── Modal / Dialog ──
  modal:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    shadow: "{shadow.overlay}"
    overlay: "{colors.surface-overlay}"
    padding: 24px
    headerTypography: "{typography.display-sm}"
    headerColor: "{colors.ink}"
    bodyTypography: "{typography.body}"
    bodyColor: "{colors.ink-secondary}"

  # ── Navigation ──
  sidebar:
    backgroundColor: "{colors.canvas-inverse}"
    textColor: "{colors.ink-inverse}"
    textColorMuted: "{colors.ink-inverse-muted}"
    activeBackground: "{colors.primary}"
    activeText: "{colors.on-primary}"
    hoverBackground: "rgba(255,255,255,0.06)"
    width: 240px
    itemHeight: 40px
    itemPadding: 0 16px
    typography: "{typography.body-sm}"
    fontWeight: 500
  sidebar-collapsed:
    width: 56px
  topbar:
    backgroundColor: "{colors.surface}"
    borderBottom: "1px solid {colors.hairline}"
    height: 56px
    padding: 0 24px

  # ── Empty State ──
  empty-state:
    padding: 48px 24px
    iconColor: "{colors.ink-disabled}"
    titleTypography: "{typography.heading}"
    titleColor: "{colors.ink-muted}"
    bodyTypography: "{typography.body-sm}"
    bodyColor: "{colors.ink-disabled}"

  # ── Skeleton / Loading ──
  skeleton:
    backgroundColor: "{colors.surface-skeleton}"
    rounded: "{rounded.sm}"
    animation: "pulse 1.5s ease-in-out infinite"
