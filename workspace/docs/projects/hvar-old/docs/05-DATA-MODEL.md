# Data Model

> Constants, enums, state machines, types, and validation rules.

---

## Constants

**File:** `src/constants/index.js`

All enums, config, and state machines in one file. Key sections:

### Order State Machine

```js
ORDER_STATES = {
  DELIVERED:          { code: 45, label: 'تم التوصيل', color: 'success' },
  RETURNED_BUSINESS:  { code: 46, label: 'مرتجع للعمل', color: 'warning' },
  RETURNED_FULFILLED: { code: 46, label: 'مرتجع', color: 'warning' },
  TERMINATED:         { code: 48, label: 'ملغي', color: 'danger' },
  PICKUP_REQUESTED:   { code: 10, label: 'طلب استلام', color: 'info' },
  AT_WAREHOUSE:       { code: 24, label: 'في المستودع', color: 'info' },
  IN_TRANSIT:         { code: 30, label: 'قيد النقل', color: 'info' },
  EXCEPTION:          { code: 47, label: 'استثناء', color: 'danger' },
  LOST:               { code: 100, label: 'مفقود', color: 'danger' },
  DAMAGED:            { code: 101, label: 'تالف', color: 'danger' },
}
```

### Business Categories (Value Tiers)

```js
BUSINESS_CATEGORIES = {
  PREMIUM_HIGH:   { label: 'عالي الجودة',   color: 'success', minValue: 5000 },
  HIGH_VALUE:     { label: 'قيمة عالية',     color: 'primary', minValue: 1500, maxValue: 5000 },
  STANDARD_VALUE: { label: 'قيمة عادية',      color: 'info',   minValue: 500, maxValue: 1500 },
  LOW_VALUE:      { label: 'قيمة منخفضة',     color: 'warning', minValue: 1, maxValue: 500 },
  ZERO_COD:       { label: 'بدون دفع',        color: 'secondary', value: 0 },
  SMALL_REFUND:   { label: 'استرداد صغير',   color: 'warning', minValue: -500, maxValue: 0 },
  LARGE_REFUND:   { label: 'استرداد كبير',   color: 'danger', maxValue: -500 },
  MAX_VALUE:      { label: 'أعلى قيمة',       color: 'success', minValue: 10000 },
}
```

### Customer Segments

```js
CUSTOMER_SEGMENTS = {
  VIP:      { label: 'VIP',      color: 'success', description: 'عملاء VIP' },
  CHAMPION: { label: 'Champion', color: 'primary', description: 'عملاء مميزون' },
  LOYAL:    { label: 'Loyal',    color: 'info',    description: 'عملاء مخلصون' },
  REGULAR:  { label: 'Regular',  color: 'warning', description: 'عملاء عاديون' },
  RECENT:   { label: 'Recent',   color: 'secondary', description: 'عملاء جدد' },
  AT_RISK:  { label: 'At Risk',  color: 'danger', description: 'عملاء معرضون للخطر' },
}
```

### Service Action Types & Statuses

```js
SERVICE_ACTION_TYPES = {
  MAINTENANCE:  { label: 'صيانة',    color: 'primary' },
  REPLACEMENT:  { label: 'استبدال',  color: 'warning' },
  REFUND:       { label: 'استرداد',  color: 'danger' },
  INSPECTION:   { label: 'فحص',      color: 'info' },
  PICKUP:       { label: 'استلام',   color: 'secondary' },
}

SERVICE_ACTION_STATUSES = {
  PENDING:     { label: 'في الانتظار', color: 'warning' },
  IN_PROGRESS: { label: 'قيد التنفيذ', color: 'primary' },
  COMPLETED:   { label: 'مكتمل',        color: 'success' },
  CANCELLED:   { label: 'ملغي',        color: 'danger' },
  ON_HOLD:     { label: 'معلق',        color: 'secondary' },
}
```

### Maintenance Statuses

```js
MAINTENANCE_STATUSES = {
  SCHEDULED:   { label: 'مجدول',       color: 'info' },
  IN_PROGRESS: { label: 'قيد التنفيذ', color: 'primary' },
  COMPLETED:   { label: 'مكتمل',        color: 'success' },
  CANCELLED:   { label: 'ملغي',        color: 'danger' },
  OVERDUE:     { label: 'متأخر',        color: 'danger' },
}
```

### Stock Movement Types

```js
STOCK_MOVEMENT_TYPES = {
  ALLOCATION:  { label: 'تخصيص',  color: 'primary' },
  USAGE:       { label: 'استخدام', color: 'warning' },
  RETURN:      { label: 'إرجاع',   color: 'success' },
  TRANSFER:    { label: 'نقل',     color: 'info' },
  ADJUSTMENT:  { label: 'تعديل',   color: 'secondary' },
  DAMAGE:      { label: 'تلف',     color: 'danger' },
  LOSS:        { label: 'فقدان',   color: 'danger' },
}
```

---

## Configuration

### API

```js
API_CONFIG = {
  BASE_URL: 'http://192.168.1.202:5000',  // Override via VITE_API_URL
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
}
```

### Pagination

```js
PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 1000,
}
```

### Storage Keys

```js
STORAGE_KEYS = {
  AUTH_TOKEN: 'hvar_auth_token',
  USER_DATA: 'hvar_user_data',
  THEME: 'hvar_theme',
  SIDEBAR_COLLAPSED: 'hvar_sidebar_collapsed',
}
```

---

## Validation Rules

```js
VALIDATION_RULES = {
  PHONE:    /^(\+20|0)?1[0125][0-9]{8}$/,     // Egyptian mobile
  EMAIL:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
}
```

All error messages in Arabic.

---

## Format Utility

**File:** `src/utils/format.js` — 25+ format functions

| Function | Input | Output |
|----------|-------|--------|
| `formatCurrency(amount)` | `1991.26` | `١٬٩٩١٫٢٦ ج.م` |
| `formatNumber(1234)` | `1234` | `١٬٢٣٤` |
| `formatPercentage(12.5)` | `12.5` | `12.5%` |
| `formatDate(date)` | ISO string | Arabic locale date |
| `formatRelativeTime(date)` | ISO string | `منذ 3 ساعات` |
| `formatPhone(phone)` | `01234567890` | `012 3456 7890` |
| `formatTrackingNumber(tracking)` | `ABC123DEF456` | `ABCD-123D-EF45` |
| `formatOrderState(45)` | `45` | `تم التوصيل` |
| `formatOrderType(10)` | `10` | `إرسال` |
| `formatBusinessCategory('high_value')` | `high_value` | `قيمة عالية` |
| `formatCustomerSegment('vip')` | `vip` | `VIP` |
| `formatServiceActionType('maintenance')` | `maintenance` | `صيانة` |
| `formatMaintenanceStatus('scheduled')` | `scheduled` | `مجدول` |
| `formatPriority(3)` | `3` | `عالية` |
| `formatFileSize(2048)` | `2048` | `2 KB` |
| `formatDuration(3661)` | `3661` | `1 ساعة 1 دقيقة` |

---

## Tailwind Utility

**File:** `src/utils/tailwind.js`

```js
cn(...classes)                    // Filter + join class names
getButtonClasses(variant, size)   // Generate button classes
getBadgeClasses(variant, size)    // Generate badge classes
getCardClasses(variant)           // Generate card classes
getAnimationClasses(animation)    // Animation utility
```
