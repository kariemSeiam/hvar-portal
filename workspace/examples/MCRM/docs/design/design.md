# HVAR Design System Reference

## Design Philosophy

The HVAR design system is built on principles of **clarity, consistency, and user-centricity**. It prioritizes:

- **Arabic RTL First**: Designed primarily for Arabic users with full RTL support
- **Modern & Clean**: Minimal, professional aesthetic with purposeful use of space
- **Accessibility**: WCAG 3 compliant with proper contrast ratios and focus states
- **Performance**: Optimized animations, GPU-accelerated transforms, and efficient rendering
- **Responsive**: Fluid typography and spacing that adapts seamlessly across devices
- **Dark Mode**: Full support with carefully crafted color palettes

---

## Color System

### Brand Colors

#### Primary Brand Red
The primary brand color used for main actions, highlights, and brand identity.

```css
--color-brand-red-50: #fff1f2
--color-brand-red-100: #ffe4e6
--color-brand-red-200: #fecdd3
--color-brand-red-300: #fda4af
--color-brand-red-400: #fb7185
--color-brand-red-500: #f43f5e  /* Primary */
--color-brand-red-600: #e11d48  /* Hover states */
--color-brand-red-700: #be123c
--color-brand-red-800: #9f1239
--color-brand-red-900: #881337
--color-brand-red-950: #4c0519
```

**Usage:**
- Primary buttons: `bg-brand-red-600`
- Hover states: `bg-brand-red-700`
- Active links: `text-brand-red-600`
- Focus rings: `focus:ring-brand-red-500`
- Badges: `bg-brand-red-100 text-brand-red-800`

#### Secondary Brand Blue
Used for secondary actions and informational elements.

```css
--color-brand-blue-50: #f0f9ff
--color-brand-blue-500: #0ea5e9  /* Secondary */
--color-brand-blue-600: #0284c7  /* Hover */
```

**Usage:**
- Secondary buttons: `bg-brand-blue-500`
- Info badges: `bg-brand-blue-100 text-brand-blue-800`
- Links: `text-brand-blue-600`

### Semantic Colors

#### Success (Green)
```css
--color-success-50: #f0fdf4
--color-success-500: #22c55e
--color-success-700: #15803d
```

#### Warning (Amber)
```css
--color-warning-50: #fff7ed
--color-warning-500: #f97316
--color-warning-700: #c2410c
```

#### Error/Danger (Red)
```css
--color-error-50: #fef2f2
--color-error-500: #ef4444
--color-error-700: #b91c1c
```

#### Info (Blue)
```css
--color-info-50: #eff6ff
--color-info-500: #3b82f6
--color-info-700: #1d4ed8
```

### Neutral Colors (Gray Scale)

```css
--color-gray-50: #f9fafb   /* Light backgrounds */
--color-gray-100: #f3f4f6  /* Subtle backgrounds */
--color-gray-200: #e5e7eb  /* Borders, dividers */
--color-gray-300: #d1d5db
--color-gray-400: #9ca3af  /* Placeholder text */
--color-gray-500: #6b7280  /* Secondary text */
--color-gray-600: #4b5563  /* Body text */
--color-gray-700: #374151
--color-gray-800: #1f2937  /* Dark mode cards */
--color-gray-900: #111827  /* Dark mode background */
--color-gray-950: #030712
```

### Background Colors

```css
--color-bg-light: #f9fafb        /* Light mode background */
--color-bg-dark: #111827         /* Dark mode background */
--color-bg-card-light: #ffffff   /* Light mode cards */
--color-bg-card-dark: #1f2937    /* Dark mode cards */
```

**Usage Pattern:**
```jsx
<div className="bg-white dark:bg-gray-800">
  {/* Content */}
</div>
```

---

## Typography

### Font Families

**Primary (Headings):** `Cairo` - Bold, modern Arabic font for headings
**Secondary (Body):** `Tajawal` - Clean, readable Arabic font for body text

```css
--font-family-primary: 'Cairo', 'Tajawal', sans-serif;
--font-family-secondary: 'Tajawal', 'Cairo', sans-serif;
```

**Tailwind Classes:**
- `font-cairo` - For headings
- `font-tajawal` - For body text
- `font-sans` - Default (Tajawal, Cairo)
- `font-display` - For display text (Cairo, Tajawal)

### Font Sizes (Fluid Typography)

All font sizes use `clamp()` for responsive scaling:

```css
/* Headings */
h1: clamp(2rem, 1.8rem + 1vw, 3rem)           /* 32px - 48px */
h2: clamp(1.7rem, 1.5rem + 1vw, 2.5rem)       /* 27px - 40px */
h3: clamp(1.4rem, 1.3rem + 0.5vw, 1.8rem)      /* 22px - 29px */
h4: clamp(1.2rem, 1.1rem + 0.5vw, 1.5rem)      /* 19px - 24px */
h5: clamp(1.1rem, 1rem + 0.3vw, 1.3rem)        /* 18px - 21px */
h6: clamp(1rem, 0.95rem + 0.2vw, 1.1rem)       /* 16px - 18px */

/* Body Text */
text-xs: clamp(0.7rem, 0.7rem + 0.1vw, 0.8rem)
text-sm: clamp(0.8rem, 0.8rem + 0.1vw, 0.9rem)
text-base: clamp(1rem, 0.95rem + 0.2vw, 1.1rem)
text-lg: clamp(1.1rem, 1.05rem + 0.25vw, 1.2rem)
text-xl: clamp(1.2rem, 1.15rem + 0.3vw, 1.35rem)
```

**Usage:**
```jsx
<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
  Page Title
</h1>
<p className="text-base text-gray-600 dark:text-gray-400">
  Body text content
</p>
```

### Font Weights

- `font-light`: 300
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700
- `font-extrabold`: 800

### Line Heights

- Headings: `1.2` - `1.3` (tight)
- Body: `1.5` (comfortable reading)
- Small text: `1.4`

---

## Spacing System

### Fluid Spacing Scale

All spacing uses `clamp()` for responsive scaling:

```css
--space-1: clamp(0.25rem, 0.2rem + 0.1vw, 0.3rem)   /* 4px - 5px */
--space-2: clamp(0.5rem, 0.4rem + 0.2vw, 0.6rem)     /* 8px - 10px */
--space-3: clamp(0.75rem, 0.6rem + 0.3vw, 0.9rem)     /* 12px - 14px */
--space-4: clamp(1rem, 0.8rem + 0.4vw, 1.2rem)       /* 16px - 19px */
--space-5: clamp(1.25rem, 1rem + 0.5vw, 1.5rem)     /* 20px - 24px */
--space-6: clamp(1.5rem, 1.2rem + 0.6vw, 1.8rem)    /* 24px - 29px */
--space-8: clamp(2rem, 1.6rem + 0.8vw, 2.4rem)      /* 32px - 38px */
--space-10: clamp(2.5rem, 2rem + 1vw, 3rem)         /* 40px - 48px */
--space-12: clamp(3rem, 2.4rem + 1.2vw, 3.6rem)    /* 48px - 58px */
```

**Tailwind Classes:**
- `p-4` = padding: 1rem (16px base)
- `m-6` = margin: 1.5rem (24px base)
- `gap-4` = gap: 1rem (16px base)

**Usage Pattern:**
```jsx
<div className="p-6 mb-4">
  {/* Consistent spacing */}
</div>
```

---

## Border Radius

### Fluid Border Radius

```css
--radius-sm: clamp(0.125rem, 0.1rem + 0.05vw, 0.15rem)    /* 2px - 2.4px */
--radius-md: clamp(0.375rem, 0.3rem + 0.15vw, 0.45rem)   /* 6px - 7px */
--radius-lg: clamp(0.5rem, 0.4rem + 0.2vw, 0.6rem)        /* 8px - 10px */
--radius-xl: clamp(0.75rem, 0.6rem + 0.3vw, 0.9rem)       /* 12px - 14px */
--radius-2xl: clamp(1rem, 0.8rem + 0.4vw, 1.2rem)         /* 16px - 19px */
--radius-full: 9999px                                      /* Full circle */
```

**Usage:**
- Buttons: `rounded-md` or `rounded-lg`
- Cards: `rounded-lg` or `rounded-xl`
- Badges: `rounded-full`
- Inputs: `rounded-md`

---

## Shadows

### Shadow Scale

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

**Usage:**
- Cards: `shadow-sm` or `shadow-md`
- Elevated cards: `shadow-lg`
- Modals: `shadow-xl` or `shadow-2xl`
- Hover effects: `hover:shadow-md` or `hover:shadow-lg`

### Brand Shadows

```css
--shadow-brand: 0 4px 6px -1px rgba(244, 63, 94, 0.1), 0 2px 4px -1px rgba(244, 63, 94, 0.06)
```

**Usage:**
```jsx
<div className="shadow-brand">
  {/* Brand-colored shadow */}
</div>
```

---

## Transitions & Animations

### Transition Durations

```css
--transition-fast: 150ms
--transition-normal: 250ms
--transition-slow: 350ms
```

### Transition Easing

```css
--transition-ease: cubic-bezier(0.4, 0, 0.2, 1)        /* Standard ease */
--transition-bounce: cubic-bezier(0.175, 0.885, 0.32, 1.275)  /* Bounce effect */
```

### Standard Transitions

**Buttons:**
```jsx
className="transition-all duration-200"
```

**Cards:**
```jsx
className="transition-all duration-300"
```

**Hover Effects:**
```jsx
className="transition-colors duration-150"
```

### Animation Classes

```css
.animate-fade-in        /* Fade in */
.animate-slide-up       /* Slide up from bottom */
.animate-slide-right    /* Slide from left (RTL: from right) */
.animate-slide-left     /* Slide from right (RTL: from left) */
.animate-pulse          /* Pulse animation */
.animate-float          /* Float animation */
.animate-scale-in       /* Scale in */
.animate-bounce-in     /* Bounce in */
```

**Usage:**
```jsx
<div className="animate-fade-in">
  {/* Content */}
</div>
```

### Micro-interactions

**Hover Scale:**
```jsx
className="hover-scale-102 hover:scale-102"
```

**Active Scale:**
```jsx
className="active-scale-98 active:scale-[0.98]"
```

**Transform GPU:**
```jsx
className="transform-gpu"  /* GPU acceleration */
```

---

## Component Patterns

### Buttons

#### Button Variants

```jsx
// Primary (Brand Red)
<Button variant="primary">Primary Action</Button>

// Secondary (Brand Blue)
<Button variant="secondary">Secondary Action</Button>

// Outline
<Button variant="outline">Outline Button</Button>

// Ghost
<Button variant="ghost">Ghost Button</Button>

// Danger
<Button variant="danger">Delete</Button>

// Success
<Button variant="success">Confirm</Button>
```

#### Button Sizes

```jsx
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
```

#### Button States

```jsx
<Button disabled>Disabled</Button>
<Button isLoading>Loading...</Button>
<Button fullWidth>Full Width</Button>
```

#### Button with Icons

```jsx
<Button leftIcon={<Icon />}>With Left Icon</Button>
<Button rightIcon={<Icon />}>With Right Icon</Button>
```

**Base Classes:**
```css
/* Primary Button */
bg-brand-red-600 text-white hover:bg-brand-red-700
focus:ring-2 focus:ring-brand-red-500 focus:ring-offset-2
transition-all duration-200
rounded-md
```

### Cards

#### Card Variants

```jsx
// Default
<Card>Content</Card>

// Elevated
<Card variant="elevated">Content</Card>

// Flat
<Card variant="flat">Content</Card>

// Transparent
<Card variant="transparent">Content</Card>
```

#### Card Padding

```jsx
<Card padding="none">No Padding</Card>
<Card padding="sm">Small Padding</Card>
<Card padding="default">Default Padding</Card>
<Card padding="lg">Large Padding</Card>
```

#### Card with Hover

```jsx
<Card hover>Hoverable Card</Card>
<Card isClickable>Clickable Card</Card>
```

#### Card Structure

```jsx
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>
    Main content
  </Card.Content>
  <Card.Footer>
    Footer actions
  </Card.Footer>
</Card>
```

**Base Classes:**
```css
bg-white dark:bg-gray-800
border border-gray-200 dark:border-gray-700
rounded-lg
shadow-sm
transition-all duration-300
```

### Inputs

#### Basic Input

```jsx
<Input
  label="Label"
  placeholder="Placeholder"
  error="Error message"
  helperText="Helper text"
  required
/>
```

#### Input with Icons

```jsx
<Input
  leftIcon={<Search />}
  rightIcon={<Icon />}
/>
```

#### Input States

```jsx
<Input disabled />
<Input error="Error message" />
```

**Base Classes:**
```css
border border-gray-300 dark:border-gray-600
rounded-md
px-4 py-2
focus:border-brand-red-500
focus:ring-1 focus:ring-brand-red-500
transition-all duration-150
```

### Badges

#### Badge Variants

```jsx
<Badge variant="default">Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
```

#### Badge Sizes

```jsx
<Badge size="xs">Extra Small</Badge>
<Badge size="sm">Small</Badge>
<Badge size="md">Medium (default)</Badge>
<Badge size="lg">Large</Badge>
```

#### Status Badge

```jsx
<StatusBadge status="pending" />
<StatusBadge status="completed" />
<StatusBadge status="cancelled" />
```

**Base Classes:**
```css
inline-flex items-center
px-2.5 py-0.5
rounded-full
text-xs font-medium
```

---

## Layout Patterns

### Page Structure

```jsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  {/* Header */}
  <header className="bg-white dark:bg-gray-900 border-b">
    {/* Header content */}
  </header>
  
  {/* Main Content */}
  <main className="container mx-auto px-4 py-6">
    {/* Page content */}
  </main>
</div>
```

### Container Widths

```jsx
<div className="container mx-auto">Default Container</div>
<div className="max-w-7xl mx-auto">Large Container</div>
<div className="max-w-8xl mx-auto">Extra Large Container</div>
```

### Grid Layouts

```jsx
// Responsive Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>

// Stats Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Stat cards */}
</div>
```

### Flex Layouts

```jsx
// Horizontal
<div className="flex items-center justify-between">
  {/* Content */}
</div>

// Vertical
<div className="flex flex-col gap-4">
  {/* Content */}
</div>

// Centered
<div className="flex items-center justify-center">
  {/* Content */}
</div>
```

---

## Modal Patterns

### Standard Modal Structure

```jsx
{isOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      {/* Modal Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Modal Title
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* Modal Content */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] scrollbar-hide">
        {/* Content */}
      </div>
      
      {/* Modal Footer */}
      <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={onConfirm}>Confirm</Button>
      </div>
    </div>
  </div>
)}
```

### Modal Sizes

```jsx
// Small
max-w-md

// Medium (default)
max-w-2xl

// Large
max-w-4xl

// Extra Large
max-w-5xl

// Full Width (with padding)
max-w-full mx-4
```

---

## Form Patterns

### Form Structure

```jsx
<form onSubmit={handleSubmit} className="space-y-6">
  {/* Form Fields */}
  <Input
    label="Field Label"
    name="fieldName"
    value={formData.fieldName}
    onChange={handleChange}
    error={errors.fieldName}
    required
  />
  
  {/* Form Actions */}
  <div className="flex items-center justify-end gap-3 pt-4 border-t">
    <Button variant="outline" type="button" onClick={onCancel}>
      Cancel
    </Button>
    <Button variant="primary" type="submit" isLoading={loading}>
      Submit
    </Button>
  </div>
</form>
```

### Form Sections

```jsx
<div className="space-y-6">
  {/* Section 1 */}
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
      Section Title
    </h3>
    {/* Fields */}
  </div>
  
  {/* Divider */}
  <div className="border-t border-gray-200 dark:border-gray-700"></div>
  
  {/* Section 2 */}
  <div className="space-y-4">
    {/* Fields */}
  </div>
</div>
```

---

## Table Patterns

### Standard Table

```jsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="bg-gray-50 dark:bg-gray-800/50 text-right">
        <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
          Column Header
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
        <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">
          Cell Content
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Table in Card

```jsx
<Card>
  <div className="overflow-x-auto">
    <table className="w-full">
      {/* Table content */}
    </table>
  </div>
</Card>
```

---

## Empty States

### Standard Empty State

```jsx
<EmptyState
  icon={Search}
  title="لا توجد نتائج"
  description="لم يتم العثور على نتائج تطابق معايير البحث المحددة"
  primaryAction={
    <Button variant="primary" onClick={handleAction}>
      Create New
    </Button>
  }
/>
```

### Empty State Variants

```jsx
<EmptyState variant="default" />
<EmptyState variant="search" />
<EmptyState variant="create" />
<EmptyState variant="error" />
```

---

## Loading States

### Spinner

```jsx
<Loading variant="spinner" size="md" color="primary" />
```

### Loading Variants

```jsx
<Loading variant="spinner" />
<Loading variant="dots" />
<Loading variant="pulse" />
<Loading variant="skeleton" />
<Loading variant="card-skeleton" />
<Loading variant="table-skeleton" />
```

### Loading Wrapper

```jsx
<LoadingWrapper loading={isLoading} variant="spinner" text="جاري التحميل...">
  {/* Content */}
</LoadingWrapper>
```

### Page Loading

```jsx
<PageLoading text="جاري تحميل الصفحة..." showLogo />
```

---

## RTL Support

### Direction Handling

The system uses `dir="rtl"` on the HTML element, managed by ThemeProvider.

### RTL-Aware Classes

```jsx
// Use logical properties
className="start-0 end-auto"  // Instead of left/right

// Or use Tailwind RTL variants
className="ltr:ml-4 rtl:mr-4"
className="ltr:text-left rtl:text-right"
```

### Icon Positioning

```jsx
// Icons adapt automatically with RTL
<Button leftIcon={<Icon />}>Text</Button>
// In RTL: icon appears on right
// In LTR: icon appears on left
```

### Text Alignment

```jsx
// Default RTL alignment
<div className="text-right">  // RTL default
  {/* Content */}
</div>

// LTR override
<div className="text-left" dir="ltr">
  {/* English content */}
</div>
```

---

## Dark Mode

### Dark Mode Classes

All components support dark mode using the `dark:` prefix:

```jsx
<div className="bg-white dark:bg-gray-800">
  <h1 className="text-gray-900 dark:text-white">Title</h1>
  <p className="text-gray-600 dark:text-gray-400">Text</p>
</div>
```

### Dark Mode Patterns

```jsx
// Backgrounds
bg-white dark:bg-gray-800          // Cards
bg-gray-50 dark:bg-gray-900        // Page background

// Text
text-gray-900 dark:text-white      // Primary text
text-gray-600 dark:text-gray-400   // Secondary text
text-gray-500 dark:text-gray-400   // Muted text

// Borders
border-gray-200 dark:border-gray-700

// Shadows (lighter in dark mode)
shadow-md dark:shadow-lg
```

### Theme Toggle

```jsx
const { theme, toggleTheme } = useTheme();

<button onClick={toggleTheme}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

---

## Responsive Design

### Breakpoints

```css
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X Extra large devices */
```

### Responsive Patterns

```jsx
// Mobile-first approach
<div className="
  grid 
  grid-cols-1           /* Mobile: 1 column */
  md:grid-cols-2        /* Tablet: 2 columns */
  lg:grid-cols-3        /* Desktop: 3 columns */
  gap-4
">

// Responsive padding
<div className="px-4 md:px-6 lg:px-8">

// Responsive text
<h1 className="text-xl md:text-2xl lg:text-3xl">

// Responsive visibility
<div className="hidden md:block">  /* Hidden on mobile, visible on tablet+ */
<div className="block md:hidden">  /* Visible on mobile, hidden on tablet+ */
```

---

## Accessibility

### Focus States

All interactive elements have visible focus states:

```css
focus:outline-none
focus:ring-2
focus:ring-brand-red-500
focus:ring-offset-2
```

### ARIA Labels

```jsx
<button
  aria-label="Close modal"
  onClick={onClose}
>
  <X />
</button>
```

### Semantic HTML

```jsx
// Use semantic elements
<header>, <main>, <nav>, <section>, <article>, <aside>, <footer>

// Proper heading hierarchy
<h1>Page Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection Title</h3>
```

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Escape key closes modals
- Enter/Space activates buttons

---

## Performance Optimizations

### GPU Acceleration

```jsx
className="transform-gpu"  /* Enable GPU acceleration */
```

### Will Change

```jsx
className="will-change-transform"  /* Hint browser about transforms */
```

### Backface Visibility

```jsx
className="backface-hidden"  /* Optimize 3D transforms */
```

### Scrollbar Hiding

```jsx
className="scrollbar-hide overflow-y-auto"  /* Hide scrollbar, maintain scroll */
```

---

## Best Practices

### 1. Consistent Spacing

Always use the spacing scale:
```jsx
// ✅ Good
<div className="p-4 mb-6 gap-4">

// ❌ Bad
<div className="p-[17px] mb-[23px]">
```

### 2. Color Usage

Always use semantic color names:
```jsx
// ✅ Good
className="bg-brand-red-600 text-white"

// ❌ Bad
className="bg-[#e11d48]"
```

### 3. Dark Mode Support

Always include dark mode variants:
```jsx
// ✅ Good
className="bg-white dark:bg-gray-800"

// ❌ Bad
className="bg-white"
```

### 4. RTL Support

Use logical properties or RTL variants:
```jsx
// ✅ Good
className="ltr:ml-4 rtl:mr-4"

// ❌ Bad
className="ml-4"  // Breaks in RTL
```

### 5. Transitions

Use consistent transition durations:
```jsx
// ✅ Good
className="transition-colors duration-150"

// ❌ Bad
className="transition-all duration-[237ms]"
```

### 6. Component Composition

Use existing components:
```jsx
// ✅ Good
<Button variant="primary">Action</Button>

// ❌ Bad
<button className="bg-red-600 text-white px-4 py-2 rounded">
  Action
</button>
```

### 7. Responsive Design

Mobile-first approach:
```jsx
// ✅ Good
className="text-sm md:text-base lg:text-lg"

// ❌ Bad
className="text-lg md:text-base"
```

---

## Utility Classes

### Text Utilities

```jsx
.text-balance    /* Balanced text wrapping */
.text-pretty     /* Pretty text wrapping */
.line-clamp-1    /* Single line clamp */
.line-clamp-2    /* Two line clamp */
.line-clamp-3    /* Three line clamp */
```

### Scrollbar Utilities

```jsx
.scrollbar-hide           /* Hide scrollbar */
.custom-scrollbar         /* Custom scrollbar styling */
```

### Glass Effect

```jsx
.glass-effect    /* Glass morphism effect */
.glass           /* Glass background */
```

### Gradient Text

```jsx
.gradient-text   /* Gradient text effect */
```

---

## Animation Guidelines

### When to Animate

- **Page transitions**: Fade in (300ms)
- **Modal appearance**: Scale + fade (300ms)
- **Hover effects**: Color/scale (150ms)
- **Loading states**: Pulse/spin (continuous)
- **Notifications**: Slide in (300ms)

### Animation Performance

- Use `transform` and `opacity` for animations
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Prefer CSS animations over JavaScript

### Reduced Motion

The system respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Naming Conventions

### File Naming

- Components: `PascalCase.jsx` (e.g., `Button.jsx`)
- Utilities: `camelCase.js` (e.g., `tailwind.js`)
- Pages: `PascalCase.jsx` (e.g., `DashboardPage.jsx`)

### Component Structure

```jsx
// 1. Imports
import React from 'react';
import { Button } from '../ui';

// 2. Component definition
const ComponentName = ({ prop1, prop2 }) => {
  // 3. State & hooks
  const [state, setState] = useState();
  
  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 5. Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 7. Export
export default ComponentName;
```

---

## Common Patterns

### Page Layout

```jsx
const Page = () => {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Page Title
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Page description
        </p>
      </div>
      
      {/* Page Content */}
      <div className="space-y-6">
        {/* Content sections */}
      </div>
    </div>
  );
};
```

### Card Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} hover>
      {/* Card content */}
    </Card>
  ))}
</div>
```

### Filter Bar

```jsx
<div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
  <Input
    placeholder="Search..."
    leftIcon={<Search />}
    className="flex-1"
  />
  <Button variant="outline" leftIcon={<Filter />}>
    Filters
  </Button>
</div>
```

### Action Bar

```jsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
    Section Title
  </h2>
  <div className="flex items-center gap-2">
    <Button variant="outline">Secondary</Button>
    <Button variant="primary" leftIcon={<Plus />}>
      Primary Action
    </Button>
  </div>
</div>
```

---

## Design Tokens Summary

### Colors
- **Primary**: Brand Red (#e11d48)
- **Secondary**: Brand Blue (#0ea5e9)
- **Success**: Green (#22c55e)
- **Warning**: Amber (#f97316)
- **Error**: Red (#ef4444)
- **Info**: Blue (#3b82f6)

### Typography
- **Heading Font**: Cairo (Bold)
- **Body Font**: Tajawal (Regular)
- **Base Size**: 16px (1rem)
- **Line Height**: 1.5 (body), 1.2-1.3 (headings)

### Spacing
- **Base Unit**: 4px (0.25rem)
- **Scale**: 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32...
- **Fluid**: All spacing uses clamp() for responsiveness

### Borders
- **Width**: 1px (default)
- **Radius**: 6px (md), 8px (lg), 12px (xl)
- **Color**: gray-200 (light), gray-700 (dark)

### Shadows
- **Small**: Subtle elevation
- **Medium**: Card elevation
- **Large**: Modal elevation
- **XL**: High elevation

---

## Quick Reference

### Most Used Classes

```jsx
// Layout
"flex items-center justify-between"
"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
"container mx-auto px-4 py-6"

// Cards
"bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4"

// Buttons
"bg-brand-red-600 text-white hover:bg-brand-red-700 rounded-md px-4 py-2 transition-colors"

// Text
"text-gray-900 dark:text-white"
"text-gray-600 dark:text-gray-400"
"text-sm font-medium"

// Spacing
"mb-4 p-6 gap-4"

// Responsive
"hidden md:block"
"text-sm md:text-base lg:text-lg"
```

---

This design system ensures consistency, accessibility, and maintainability across all pages and components in the HVAR application.

