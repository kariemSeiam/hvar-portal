# HVAR System UI/UX Patterns Documentation

## Executive Summary

The HVAR (Customer Management System) is an Arabic-first, RTL-optimized admin dashboard built with React, Tailwind CSS, and a modern component library. This document captures comprehensive UI/UX patterns observed across the codebase.

---

## 1. User Flow Patterns

### 1.1 Navigation Structure

The application uses a **sidebar + header + content** layout pattern with the following hierarchy:

```
App (ThemeProvider + AuthProvider + Router)
└── Layout (Protected Route Wrapper)
    ├── Sidebar (Fixed, Collapsible)
    ├── Header (Fixed at top)
    │   └── Content Area (Scrollable)
    └── FloatingActionButton (Optional)
```

**Route Structure:**
| Route | Page | Purpose |
|-------|------|---------|
| `/login` | LoginPage | Authentication |
| `/` | DashboardPage | System overview |
| `/customers` | CustomersPage | Customer list |
| `/customers/:phone` | CustomerDetailPage | Customer details |
| `/ai-customers/:phone` | AICustomersPage | AI-powered analytics |
| `/customer-service` | CustomerServicePage | Service center |
| `/customer-service/requests` | ServiceRequestsPage | Request management |
| `/customer-service/requests/new` | ServiceRequestForm | Create request |
| `/customer-service/requests/:id` | RequestDetailPage | Request details |
| `/customer-service/requests/:id/edit` | ServiceRequestForm | Edit request |
| `/call-center` | CallCenterPage | Call management |
| `/analytics` | AnalyticsPage | Reports & analytics |

### 1.2 Navigation Categories

The sidebar groups navigation into semantic categories:

| Category | Arabic Label | Items |
|----------|--------------|-------|
| Main | الرئيسية | Dashboard |
| Customer Management | إدارة العملاء | Customers, AI Analytics |
| Customer Service | خدمة العملاء | Service Center, Requests |
| Call Center | مركز الاتصال | Call Center |
| Reports | التقارير والتحليلات | Analytics |

### 1.3 User Journey Patterns

**Primary Journeys:**

1. **Authentication Flow:**
   - User visits `/login`
   - Enters credentials (email + password)
   - On success: redirected to dashboard `/`
   - On failure: inline error message displayed

2. **Customer Lookup Flow:**
   - Navigate to Customers page
   - Search by name or phone
   - Apply filters (segment, revenue, date)
   - Click customer row to view details
   - Optionally access AI analytics

3. **Service Request Flow:**
   - Navigate to Service Center
   - Create new request or view existing
   - Fill multi-section form
   - Submit or save draft

### 1.4 Information Architecture

**Page Hierarchy:**
```
Dashboard (Overview)
├── Stats Cards (4)
├── Recent Requests Table
└── Quick Actions (5)

Customers Page
├── Analytics Cards (4 main + 6 segment)
├── Search & Filters
└── Customer List (Table/Grid)

Customer Detail Page
├── Customer Header (Avatar, Name, Segment, Phones)
├── Stats Tabs (All, Delivered, Returned, Fulfilled, Pending, Failed)
└── Order Cards with Timeline

Service Requests Page
├── Header with View Toggle
├── Search & Advanced Filters
├── Requests List (Table/Grid)
└── Pagination
```

---

## 2. Interaction Patterns

### 2.1 Button Behaviors and States

**Button Variants:**
| Variant | Usage | Visual Style |
|---------|-------|--------------|
| `primary` | Primary actions (Submit, Save) | Red background (#e11d48) |
| `secondary` | Secondary actions | Blue background |
| `outline` | Tertiary actions, navigation | Transparent with border |
| `ghost` | Subtle actions, icon buttons | Transparent, no border |
| `danger` | Destructive actions | Red background |
| `success` | Positive confirmations | Green background |

**Button Sizes:**
| Size | Padding | Font Size | Use Case |
|------|---------|-----------|----------|
| `xs` | px-2 py-1 | 0.75rem | Compact inline actions |
| `sm` | px-3 py-1.5 | 0.875rem | Table actions, form buttons |
| `md` | px-4 py-2 | 0.875rem | Default buttons |
| `lg` | px-5 py-2.5 | 1rem | Primary CTAs |
| `xl` | px-6 py-3 | 1rem | Hero actions |

**Button States:**
- **Default**: Normal appearance
- **Hover**: Background darkens, subtle shadow
- **Focus**: 2px ring with brand-red-500
- **Disabled**: 50% opacity, pointer-events-none
- **Loading**: Spinner icon, opacity-80, pointer-events-none

**Button with Icons:**
```jsx
<Button leftIcon={<Plus size={16} />}>إضافة</Button>
<Button rightIcon={<ArrowLeft size={16} />}>العودة</Button>
```

### 2.2 Form Interactions

**Input Field Structure:**
- Label (required fields marked with red asterisk)
- Input with optional icons (leftIcon, rightIcon)
- Helper text or error message

**Input States:**
| State | Border Color | Text Color | Behavior |
|-------|--------------|------------|----------|
| Default | gray-300 | gray-900 | Standard |
| Focus | brand-red-500 | gray-900 | 1px ring |
| Error | red-500 | red-900 | Shows error message |
| Disabled | gray-300 | gray-500 | opacity-60, cursor-not-allowed |

**Validation Pattern:**
- Real-time validation on blur
- Error clears on input change
- Form-level validation on submit
- Arabic error messages

**Special Input Behaviors:**
- Password field: Toggle visibility with eye icon
- Phone field: `dir="ltr"` for number display
- Date/Time: Native pickers with RTL support

### 2.3 Modal and Dialog Patterns

**Modal Structure:**
```jsx
{isOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl">
      <div className="p-4 border-b">Header + Close Button</div>
      <div className="p-4">Content</div>
      <div className="p-4 border-t">Footer Actions</div>
    </div>
  </div>
)}
```

**Modal Types:**
1. **Search/Lookup Modal** - Customer search with results table
2. **Confirmation Dialog** - Delete, reset actions
3. **Form Modal** - Quick create/edit

**Modal Interactions:**
- Click overlay to close
- Escape key to close
- Focus trapped within modal
- Scroll lock on body

### 2.4 Loading and Error States

**Loading Patterns:**

1. **Spinner** - Default loading indicator
```jsx
<div className="w-8 h-8 border-4 border-t-brand-red-600 border-gray-200 rounded-full animate-spin"></div>
```

2. **Skeleton Loading** - Card placeholders
```jsx
<div className="animate-pulse">
  <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3"></div>
  <div className="w-16 h-4 bg-gray-200 rounded mb-2"></div>
</div>
```

3. **Button Loading** - Inline spinner with text
```jsx
{isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
<span>{isLoading ? 'جاري الحفظ...' : 'حفظ'}</span>
```

**Error State Patterns:**

1. **Inline Error** - Form field errors
```jsx
{error && <p className="text-red-500 text-sm">{error}</p>}
```

2. **Error Card** - Page-level errors
```jsx
<div className="text-center py-8">
  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
  <h2>خطأ في تحميل البيانات</h2>
  <Button onClick={retry}>إعادة المحاولة</Button>
</div>
```

3. **Toast/Alert** - Temporary notifications
```jsx
<div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-md p-4">
  <AlertCircle className="text-red-400" />
  <p className="text-red-800">{errorMessage}</p>
</div>
```

**Empty State Pattern:**
```jsx
<div className="text-center py-12">
  <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  <h3>لا توجد بيانات</h3>
  <p>وصف الحالة الفارغة</p>
  <Button>إضافة جديد</Button>
</div>
```

---

## 3. Data Visualization

### 3.1 Dashboard Layouts

**Dashboard Page Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ Welcome Message + Description                               │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ Stat Card 1 │ Stat Card 2 │ Stat Card 3 │ Stat Card 4     │
│ (Pending)   │ (Calls)     │ (Customers) │ (Reports)       │
├─────────────┴─────────────┴─────────────┴─────────────────┤
│ Recent Service Requests Table                              │
│ (Compact table with status badges)                         │
├─────────────────────────────────────────────────────────────┤
│ Quick Actions Grid (5 cards)                               │
│ [New Request] [Log Call] [New Customer] [Call List] [Report]│
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Stats Cards Design

**Standard Stats Card:**
```jsx
<Card className="p-6">
  <div className="flex justify-between items-start">
    <div>
      <p className="text-sm text-gray-500">Label</p>
      <h3 className="text-3xl font-semibold">
        {value}
        <span className="text-sm font-normal text-gray-500">
          من {total}
        </span>
      </h3>
    </div>
    <div className="rounded-full p-2 bg-{color}-100">
      <Icon className="w-6 h-6 text-{color}-600" />
    </div>
  </div>
  <div className="mt-4">
    <Button variant="outline" size="sm" className="w-full">
      عرض الكل
    </Button>
  </div>
</Card>
```

**Gradient Stats Card (Segment Analytics):**
```jsx
<div className="bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 
  dark:from-purple-900/20 dark:via-purple-800/20 dark:to-pink-900/20 
  p-4 rounded-xl border border-purple-200 shadow-sm 
  hover:shadow-lg transition-all group relative overflow-hidden">
  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-200/50 to-transparent rounded-bl-full"></div>
  <div className="flex flex-col items-center text-center">
    <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
      <Icon className="w-5 h-5 text-purple-600" />
    </div>
    <h3 className="font-bold text-purple-900">Label</h3>
    <div className="text-lg font-bold">{count}</div>
    <div className="text-xs text-purple-600">{percentage}%</div>
  </div>
</Card>
```

### 3.3 Table Patterns

**Standard Table Layout:**
```jsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th className="px-4 py-3 text-right text-sm font-semibold">Column</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      {items.map(item => (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <td className="px-4 py-3">Content</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Table Features:**
- Sortable columns (click header to toggle sort)
- Row selection (checkbox in first column)
- Bulk actions bar (appears when items selected)
- Sticky header on scroll
- Responsive: converts to cards on mobile

**Sortable Header:**
```jsx
<th className="cursor-pointer hover:bg-gray-100" onClick={() => handleSort('field')}>
  <div className="flex items-center gap-2">
    Column Name
    {sortBy === 'field' && (
      sortDir === 'ASC' ? <ChevronUp /> : <ChevronDown />
    )}
  </div>
</th>
```

### 3.4 Status Badges

**StatusBadge Component:**
```jsx
const StatusBadge = ({ status }) => {
  const styles = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'معلّق' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'قيد التنفيذ' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'مكتمل' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'ملغي' },
    on_hold: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'متوقف' },
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};
```

**Priority Badges:**
| Level | Color | Label |
|-------|-------|-------|
| 1 | Green | منخفضة |
| 2 | Blue | متوسطة |
| 3 | Amber | عالية |
| 4 | Red | عاجلة |

**Segment Badges:**
| Segment | Color |
|---------|-------|
| VIP | Purple |
| Champion | Blue |
| Loyal | Green |
| Regular | Yellow |
| Recent | Indigo |
| At Risk | Red |

---

## 4. Mobile Experience

### 4.1 Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Default | <640px | Mobile (full width) |
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large screens |

### 4.2 Mobile Navigation

**Sidebar Behavior:**
- Desktop (lg+): Fixed sidebar, 264px width (collapsed: 80px)
- Mobile: Hidden by default, overlay when opened
- Toggle: Hamburger menu in header

**Mobile Overlay:**
```jsx
{isMobileMenuOpen && (
  <div 
    className="fixed inset-0 bg-black/20 z-40 lg:hidden"
    onClick={() => setIsMobileMenuOpen(false)}
  />
)}
```

**Sidebar Animation:**
```jsx
className={cn(
  // Mobile positioning
  isMobileMenuOpen 
    ? 'translate-x-0' 
    : direction === 'rtl' 
      ? 'translate-x-full' 
      : '-translate-x-full',
  // Desktop always visible
  'lg:translate-x-0'
)}
```

### 4.3 Touch Interactions

**Mobile-Friendly Patterns:**
- Minimum touch target: 44x44px
- Buttons have adequate padding
- Swipe to dismiss (modals, notifications)
- Pull-to-refresh capability

**Mobile Cards View:**
Instead of tables, mobile shows card-based layouts:
```jsx
<div className="lg:hidden">
  {items.map(item => (
    <div className="border rounded-xl p-4 hover:shadow-md transition-shadow">
      {/* Card content */}
    </div>
  ))}
</div>

<div className="hidden lg:block">
  {/* Table view */}
</div>
```

### 4.4 Mobile-Specific Patterns

**Responsive Header:**
```jsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <h1>Title</h1>
  <div className="flex gap-2">
    <Button className="w-full sm:w-auto">Action</Button>
  </div>
</div>
```

**Responsive Grid:**
```jsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>
```

**Responsive Filters:**
```jsx
<div className="flex flex-col lg:flex-row gap-4">
  <Input className="flex-1" />
  <Button className="w-full lg:w-auto">Filter</Button>
</div>
```

---

## 5. Arabic UX Patterns

### 5.1 RTL Layout Handling

**Theme Provider Setup:**
```jsx
const ThemeProvider = ({ defaultDirection = 'rtl' }) => {
  const [direction, setDirection] = useState(() => 
    localStorage.getItem('direction') || defaultDirection
  );
  
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = direction === 'rtl' ? 'ar' : 'en';
  }, [direction]);
};
```

**RTL-Specific CSS:**
```css
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .ml-auto {
  margin-left: 0;
  margin-right: auto;
}
```

**Logical Properties:**
- Use `start`/`end` instead of `left`/`right`
- Use `ps-` (padding-start), `pe-` (padding-end)
- Use `ms-` (margin-start), `me-` (margin-end)

**Icon Direction Handling:**
```jsx
{collapsed
  ? (direction === 'rtl' ? <ChevronLeft /> : <ChevronRight />)
  : (direction === 'rtl' ? <ChevronRight /> : <ChevronLeft />)
}
```

### 5.2 Arabic Content Density

**Typography Scale:**
Arabic text typically requires slightly larger font sizes:
```css
font-size: {
  'sm': ['clamp(0.8rem, 0.8rem + 0.1vw, 0.9rem)', { lineHeight: '1.4' }],
  'base': ['clamp(1rem, 0.95rem + 0.2vw, 1.1rem)', { lineHeight: '1.5' }],
}
```

**Line Height:**
- Arabic requires more line height (1.5 - 1.8)
- Headings: 1.2 - 1.4

**Character Limits:**
- Labels: 20-30 characters max
- Descriptions: 100-150 characters
- Truncate with ellipsis for overflow

### 5.3 Typography Hierarchy

**Font Stack:**
```css
font-family: {
  'cairo': ['Cairo', 'sans-serif'],    /* Headings */
  'tajawal': ['Tajawal', 'sans-serif'], /* Body */
  'sans': ['Tajawal', 'Cairo', 'sans-serif'],
  'display': ['Cairo', 'Tajawal', 'sans-serif'],
}
```

**Heading Scale:**
| Level | Size | Weight | Use |
|-------|------|--------|-----|
| H1 | 2xl-3xl | 700-800 | Page titles |
| H2 | xl-2xl | 700 | Section headers |
| H3 | lg-xl | 600-700 | Card headers |
| H4 | base-lg | 600 | Sub-sections |

### 5.4 Form Field Arrangements

**RTL Form Patterns:**
- Labels right-aligned
- Input text right-aligned
- Icons positioned correctly (right side)
- Phone/email fields: `dir="ltr"` for input

**Required Field Indicator:**
```jsx
<label className="after:content-['*'] after:mr-0.5 after:text-red-500">
  الحقل المطلوب
</label>
```

**Icon Positioning:**
```jsx
<div className="relative">
  <Icon className="absolute right-3 top-1/2 -translate-y-1/2" />
  <Input className="pr-10" /> {/* Padding for RTL icon */}
</div>
```

---

## 6. Admin Panel UX

### 6.1 Sidebar Navigation

**Sidebar States:**
1. **Expanded** (264px): Full navigation with labels, descriptions, badges
2. **Collapsed** (80px): Icons only with tooltips
3. **Mobile** (288px): Overlay with full content

**Navigation Item Structure:**
```jsx
<Link className={cn(
  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
  isActive
    ? 'bg-brand-red-50 text-brand-red-700'
    : 'text-gray-600 hover:bg-gray-50'
)}>
  <div className="w-7 h-7 flex items-center justify-center">
    {icon}
  </div>
  <div className="flex-1">
    <div className="font-medium text-sm">{name}</div>
    <div className="text-xs text-gray-500">{description}</div>
  </div>
  {badge && (
    <span className="px-2 py-0.5 text-xs bg-brand-red-100 text-brand-red-700 rounded-full">
      {badge}
    </span>
  )}
</Link>
```

**Sidebar Footer:**
- Theme toggle (light/dark)
- Logout button
- Collapsed state: Icon-only buttons

### 6.2 CRUD Operations Flow

**Create Pattern:**
1. Click "New" button (FAB or header action)
2. Navigate to form page
3. Fill multi-section form
4. Validate on submit
5. Success: Navigate to list or detail
6. Error: Show inline errors

**Read Pattern:**
1. Navigate to list page
2. Search/filter to find item
3. Click row to view detail
4. Detail page shows full information

**Update Pattern:**
1. From detail page, click "Edit"
2. Navigate to edit form (same form as create)
3. Pre-populated with existing data
4. Submit updates
5. Success: Return to detail page

**Delete Pattern:**
1. Click delete action (in dropdown or detail page)
2. Confirmation modal appears
3. Confirm deletion
4. Success: Return to list with success message

### 6.3 Search and Filtering

**Search Pattern:**
```jsx
<div className="relative flex-1">
  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
  <Input
    placeholder="البحث بالاسم أو رقم الهاتف..."
    className="pr-12 py-3"
    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
  />
</div>
```

**Filter Panel Pattern:**
```jsx
{showFilters && (
  <div className="border-t pt-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Select label="Status" options={statusOptions} />
      <Select label="Priority" options={priorityOptions} />
      <Input type="date" label="From Date" />
      <Input type="date" label="To Date" />
    </div>
    <div className="flex gap-2 mt-4">
      <Button onClick={applyFilters}>تطبيق</Button>
      <Button variant="outline" onClick={clearFilters}>مسح</Button>
    </div>
  </div>
)}
```

**Active Filters Display:**
```jsx
{getActiveFiltersCount() > 0 && (
  <span className="bg-brand-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
    {getActiveFiltersCount()}
  </span>
)}
```

### 6.4 Bulk Actions

**Selection Pattern:**
```jsx
<input
  type="checkbox"
  checked={selectedItems.length === items.length}
  onChange={handleSelectAll}
  className="rounded border-gray-300 text-brand-red-600"
/>
```

**Bulk Actions Bar:**
```jsx
{selectedRequests.length > 0 && (
  <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <span>تم تحديد {selectedRequests.length} طلب</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">تحديث الحالة</Button>
        <Button variant="outline" size="sm">تصدير</Button>
        <Button variant="ghost" size="sm" onClick={() => setSelectedRequests([])}>
          <X />
        </Button>
      </div>
    </div>
  </div>
)}
```

### 6.5 View Toggle (Table/Grid)

```jsx
<div className="flex items-center bg-gray-100 rounded-lg p-1">
  <button
    onClick={() => setViewMode('table')}
    className={cn(
      'p-2 rounded-md transition-all',
      viewMode === 'table' 
        ? 'bg-white text-gray-900 shadow-sm' 
        : 'text-gray-500 hover:text-gray-700'
    )}
  >
    <List className="w-4 h-4" />
  </button>
  <button
    onClick={() => setViewMode('grid')}
    className={cn(
      'p-2 rounded-md transition-all',
      viewMode === 'grid' 
        ? 'bg-white text-gray-900 shadow-sm' 
        : 'text-gray-500 hover:text-gray-700'
    )}
  >
    <Grid3X3 className="w-4 h-4" />
  </button>
</div>
```

---

## 7. Component Library Reference

### 7.1 Core Components

| Component | File | Purpose |
|-----------|------|---------|
| Button | `Button.jsx` | All button variants |
| Input | `Input.jsx` | Text inputs with icons |
| Card | `Card.jsx` | Container with variants |
| Badge | `Badge.jsx` | Status indicators |
| StatusBadge | `StatusBadge.jsx` | Request status display |
| FloatingActionButton | `FloatingActionButton.jsx` | FAB component |

### 7.2 Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| Layout | `Layout.jsx` | Main page wrapper |
| Sidebar | `Sidebar.jsx` | Navigation sidebar |
| Header | `Header.jsx` | Top header bar |
| Logo | `Logo.jsx` | Brand logo |
| ThemeProvider | `ThemeProvider.jsx` | Theme/direction context |

### 7.3 Utility Functions

**cn() - Class Name Combiner:**
```js
export const cn = (...classes) => classes.filter(Boolean).join(' ');
```

**getButtonClasses() - Button Styling:**
```js
export const getButtonClasses = (variant = 'primary', size = 'md') => {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size]);
};
```

---

## 8. Animation and Transitions

### 8.1 Transition Durations

| Speed | Duration | Use Case |
|-------|----------|----------|
| Fast | 150ms | Button hover, focus states |
| Normal | 250ms | Modal open/close |
| Slow | 350ms | Page transitions |

### 8.2 Animation Classes

**Custom Animations:**
```css
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
.animate-slide-up { animation: slideUp 0.3s ease-out; }
.animate-slide-right { animation: slideRight 0.3s ease-out; }
.animate-slide-left { animation: slideLeft 0.3s ease-out; }
.animate-pulse { animation: pulse 2s infinite ease-in-out; }
.animate-float { animation: float 3s infinite ease-in-out; }
```

**Hover Effects:**
```jsx
className="hover:shadow-md transform-gpu transition-all duration-200 hover:-translate-y-1"
```

---

## 9. Accessibility Patterns

### 9.1 Focus Management

- Focus ring: 2px solid brand-red-500
- Focus offset: 2px
- Skip links for keyboard navigation
- Focus trap in modals

### 9.2 ARIA Labels

```jsx
<button aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
  {icon}
</button>

<nav aria-label="Main navigation">
  {/* Nav items */}
</nav>

<main aria-label="تفاصيل العميل">
  {/* Content */}
</main>
```

### 9.3 Screen Reader Support

- Semantic HTML (header, nav, main, section, article)
- Meaningful link text
- Alt text for images
- Table headers with scope

---

## 10. Dark Mode

### 10.1 Implementation

Dark mode uses class-based toggle with Tailwind:
```jsx
// ThemeProvider
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
```

### 10.2 Color Mapping

| Element | Light | Dark |
|---------|-------|------|
| Background | gray-50 | gray-900 |
| Card | white | gray-800 |
| Text Primary | gray-900 | white |
| Text Secondary | gray-600 | gray-400 |
| Border | gray-200 | gray-700 |
| Input BG | white | gray-800 |

### 10.3 Pattern

```jsx
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
  <p className="text-gray-900 dark:text-white">Content</p>
</div>
```

---

## 11. Best Practices Summary

### 11.1 Do's

1. **Always use RTL-aware properties** when positioning elements
2. **Provide Arabic labels** for all interactive elements
3. **Use semantic HTML** for accessibility
4. **Implement loading states** for async operations
5. **Show error messages** in Arabic
6. **Use consistent spacing** via Tailwind's spacing scale
7. **Test dark mode** for all new components
8. **Make tables responsive** with card views on mobile

### 11.2 Don'ts

1. **Don't hardcode left/right** positioning
2. **Don't mix LTR text** without `dir="ltr"` wrapper
3. **Don't skip empty states** - always design for no data
4. **Don't forget loading states** for data fetching
5. **Don't use tiny touch targets** on mobile (< 44px)
6. **Don't hide important actions** in collapsed sidebar on mobile

---

## 12. File Reference

| File Path | Purpose |
|-----------|---------|
| `/src/App.jsx` | Main app, routing, auth guard |
| `/src/components/layout/Layout.jsx` | Page layout wrapper |
| `/src/components/layout/Sidebar.jsx` | Navigation sidebar |
| `/src/components/layout/Header.jsx` | Top header |
| `/src/components/ui/Button.jsx` | Button component |
| `/src/components/ui/Input.jsx` | Input component |
| `/src/components/ui/Card.jsx` | Card component |
| `/src/components/ui/StatusBadge.jsx` | Status badge |
| `/src/components/ui/FloatingActionButton.jsx` | FAB |
| `/src/components/ui/ThemeProvider.jsx` | Theme/direction provider |
| `/src/pages/DashboardPage.jsx` | Dashboard page |
| `/src/pages/CustomersPage.jsx` | Customers list |
| `/src/pages/CustomerDetailPage.jsx` | Customer detail |
| `/src/pages/customer-service/ServiceRequestsPage.jsx` | Requests list |
| `/src/pages/customer-service/ServiceRequestForm.jsx` | Request form |
| `/src/pages/analytics/AnalyticsPage.jsx` | Analytics page |
| `/src/pages/auth/LoginPage.jsx` | Login page |
| `/src/utils/tailwind.js` | Tailwind utilities |
| `/tailwind.config.js` | Tailwind configuration |
| `/src/index.css` | Global styles |
