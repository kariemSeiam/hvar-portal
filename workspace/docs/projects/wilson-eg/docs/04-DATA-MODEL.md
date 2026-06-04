# Data Model

> Wilson Egypt — database schema and product data structure.

---

## Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Customers and admins | `id`, `phone`, `name`, `email`, `password_hash`, `role`, `created_at` |
| `products` | All appliances | `id`, `name_ar`, `name_en`, `slug`, `category`, `base_price`, `discount_price`, `rating`, `stock_status`, `specs` (JSON), `features_ar` (JSON), `features_en` (JSON), `description_ar`, `description_en`, `warranty_years`, `energy_rating` |
| `product_variants` | Product SKU variants | `id`, `product_id`, `specs` (JSON), `price_modifier`, `in_stock`, `quantity` |
| `variant_images` | Product images | `id`, `variant_id`, `image_url`, `sort_order` |
| `categories` | Product categories | `id`, `name_ar`, `name_en`, `slug`, `icon` |
| `orders` | Customer orders | `id`, `user_id`, `status`, `total`, `payment_method`, `address_id`, `notes`, `created_at` |
| `order_items` | Order line items | `id`, `order_id`, `variant_id`, `quantity`, `unit_price` |
| `order_tracking` | Order status history | `id`, `order_id`, `status`, `note`, `created_at` |
| `addresses` | Customer addresses | `id`, `user_id`, `name`, `phone`, `street`, `city`, `governorate`, `is_default` |
| `favorites` | Wishlist items | `id`, `user_id`, `product_id` |
| `coupons` | Discount coupons | `id`, `code`, `discount_type` (percentage/fixed), `discount_value`, `min_order`, `max_uses`, `expires_at` |
| `coupon_users` | Coupon usage per user | `id`, `coupon_id`, `user_id`, `used_at` |
| `coupon_usage` | Coupon usage tracking | `id`, `coupon_id`, `order_id`, `used_at` |
| `offer_slides` | Hero carousel | `id`, `title_ar`, `title_en`, `subtitle_ar`, `subtitle_en`, `image_url`, `cta_text`, `cta_link`, `sort_order`, `is_active` |

---

## Product Categories

```typescript
const categories = {
  refrigerators_freezers: {
    name_ar: 'الثلاجات والفريزرات',
    name_en: 'Refrigerators & Freezers',
    icon: 'Refrigerator'
  },
  stoves_ovens: {
    name_ar: 'البوتاجازات والأفران',
    name_en: 'Stoves & Ovens',
    icon: 'Flame'
  },
  water_coolers: {
    name_ar: 'مبردات المياه',
    name_en: 'Water Coolers',
    icon: 'Droplets'
  },
  vacuum_cleaners: {
    name_ar: 'المكانس الكهربائية',
    name_en: 'Vacuum Cleaners',
    icon: 'Wind'
  },
  small_appliances: {
    name_ar: 'الأجهزة الصغيرة',
    name_en: 'Small Appliances',
    icon: 'Blender',
    subcategories: ['mixers', 'blenders', 'choppers', 'kettles', 'ovens_toasters']
  }
}
```

---

## Product Inventory (26 Products)

| Model | Arabic Name | Category | Price | Warranty |
|-------|-------------|----------|-------|----------|
| WF240 | ديب فريزر ويلسن WF240 | Freezers | 10,300 | 5 years |
| WF340 | ديب فريزر ويلسن WF340 | Freezers | 11,700 | 5 years |
| W-ST90MS | كوك برو امان كامل استانلس | Stoves | 18,085 | 5 years |
| W-ST90MB | كوك برو امان كامل اسود | Stoves | 17,830 | 5 years |
| W-ST90FB | فلام ماكس فانشورى اسود | Stoves | 12,085 | 5 years |
| W-ST90C | فلام ماكس غرف استانلس | Stoves | 12,425 | 5 years |
| W-ST90FS | فلام ماكس فانشورى استانلس | Stoves | 12,350 | 5 years |
| Wdb 1001 | مبرد مياه مع حافظة داخلية أسود | Water Coolers | 5,900 | 2 years |
| Wdb 1002 | مبرد مياه مع ثلاجة داخلية أسود | Water Coolers | 6,400 | 2 years |
| Wv 2500 | مكنسة كهربائية 2500 وات | Vacuums | 4,500 | 2 years |
| Wv 2100 | مكنسة كهربائية 2100 وات | Vacuums | 3,900 | 2 years |
| WK800 | عجان ويلسن 7.5 لتر | Mixers | 6,475 | 2 years |
| Wo503 | فرن كهربائي 3 مفاتيح | Ovens | 3,550 | 2 years |
| Wo504 | فرن كهربائي 4 مفاتيح | Ovens | 4,100 | 2 years |
| Wv 1300 | كبة ويلسن | Choppers | 1,350 | 2 years |
| WK500 | كاتل ويلسن | Kettles | 1,250 | 2 years |
| WH1300 | هاند بليندر WH1300 | Blenders | 2,250 | 2 years |
| WH1200 | هاند بليندر WH1200 | Blenders | 1,490 | 2 years |

---

## Price Analysis

| Category | Min | Max | Avg |
|----------|-----|-----|-----|
| Freezers | 10,300 | 11,700 | 11,000 |
| Stoves | 12,085 | 18,085 | 14,416 |
| Water Coolers | 5,900 | 6,500 | 6,200 |
| Vacuums | 3,900 | 4,500 | 4,200 |
| Small Appliances | 1,100 | 6,475 | 2,671 |

**Total range:** EGP 1,100 - EGP 18,085

---

## Order States

```typescript
enum OrderStatus {
  pending = 'pending',
  confirmed = 'confirmed',
  processing = 'processing',
  shipped = 'shipped',
  delivered = 'delivered',
  cancelled = 'cancelled',
  returned = 'returned'
}
```

---

## Business Rules

```yaml
products:
  warranty_major_appliances: 5 years  # freezers, stoves
  warranty_small_appliances: 2 years  # kettles, blenders, etc.
  warranty_type: full                 # parts + labor included

delivery:
  free: true
  free_installation: true
  response_time_hours: 48

payment:
  default: cod
  methods:
    - cod
    - card

pricing:
  discount_style: true  # show regular price + discounted price
  currency: EGP
```
