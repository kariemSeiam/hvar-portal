# Wilson Egypt - Deep Study & Analysis

## Executive Summary

**Wilson (ويلسن)** is an Egyptian home appliances brand focused on delivering quality products designed specifically for Egyptian homes. This document consolidates all extracted data for building the production e-commerce platform.

---

## 1. Company Profile

| Attribute | Value |
|-----------|-------|
| **Brand Name** | Wilson (ويلسن) |
| **Country** | Egypt |
| **Industry** | Home Appliances |
| **Currency** | EGP (Egyptian Pound) |
| **Primary Language** | Arabic (RTL) |
| **Secondary Language** | English |
| **Tagline** | "صُنع للبيت المصري" (Made for Egyptian Homes) |

---

## 2. Product Catalog Analysis

### 2.1 Categories Structure

| ID | Arabic Name | English Name | Slug | Product Count |
|----|-------------|--------------|------|---------------|
| 30 | بوتوجازات ويلسون | Wilson Stoves | `stoves` | 6 |
| 34 | اجهزة منزلية | Home Appliances | `home_appliances` | 8 |
| 33 | مبردات مياه | Water Coolers | `water_coolers` | 6 |
| 32 | مكنسة ويلسون | Vacuum Cleaners | `vacuum_cleaners` | 2 |
| 31 | شاشات ويلسن | Wilson TVs | `tvs` | 1+ |

**Recommended Category Structure for New Site:**

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
};
```

### 2.2 Product Inventory (26 Products)

#### Freezers (2 Products)

| Model | Arabic Name | Price (EGP) | Capacity | Status |
|-------|-------------|-------------|----------|--------|
| WF240 | ديب فريزر ويلسن افقي WF240 | 10,300 | 240L | In Stock |
| WF340 | ديب فريزر ويلسن افقي WF340 | 11,700 | 340L | In Stock |

**Common Features:**
- LG Motor
- Modern English design
- Internal lighting
- Temperature control
- Front control panel
- Integrated handle with lock
- Defrost drain outlet
- CFC-free
- Works in hot climates
- 60mm insulation thickness
- **Warranty: 5 years**

#### Stoves (7 Products)

| Model | Arabic Name | Price (EGP) | Status |
|-------|-------------|-------------|--------|
| W-ST90MS | كوك برو امان كامل استانلس | 18,085 | In Stock |
| W-ST90MB | كوك برو امان كامل اسود سطح استانلس | 17,830 | In Stock |
| W-ST90FB | فلام ماكس فانشورى اسود سطح استانلس | 12,085 | In Stock |
| W-ST90C | فلام ماكس غرف استانلس | 12,425 | In Stock |
| W-ST90FS | فلام ماكس فانشورى استانلس | 12,350 | In Stock |
| W-ST90HMB | كوك زون نصف امان اسود | 14,200 | Out of Stock |
| W-ST90HMS | كوك زون نصف امان استاتلس | 14,535 | Out of Stock |

**Common Specs:**
- Dimensions: 60x90 cm
- 5 gas burners (copper, Turkish design)
- Turbo fan oven
- Dual tempered glass
- **Warranty: 5 years**

**Price Range:** EGP 12,085 - EGP 18,085

#### Water Coolers (4 Products)

| Model | Arabic Name | Price (EGP) | Regular | Status |
|-------|-------------|-------------|---------|--------|
| Wdb 1001 | مبرد مياه مع حافظة داخلية أسود | 5,900 | 6,200 | In Stock |
| Wdb 1002 | مبرد مياه مع ثلاجة داخلية أسود | 6,400 | 6,700 | In Stock |
| Wds 1001 | مبرد مياه بحافظه داخليه سيلفر | 6,000 | 6,300 | Out of Stock |
| Wds 1002 | مبرد مياه بثلاجة داخلية سيلفر | 6,500 | 6,800 | Out of Stock |

**Common Specs:**
- Power: 360W/580W heating, 580W/95W cooling
- Hot tank: 1L / Cold tank: 3.25L
- 3 taps (Cold, Room, Hot)
- Stainless steel inner tank
- LED indicators
- Safety shut-off switches

#### Vacuum Cleaners (2 Products)

| Model | Arabic Name | Price (EGP) | Regular | Rating |
|-------|-------------|-------------|---------|--------|
| Wv 2500 | مكنسة كهربائية 2500 وات | 4,500 | 4,700 | 4.57 |
| Wv 2100 | مكنسة كهربائية 2100 وات | 3,900 | 4,100 | 4.27 |

**Features:**
- 3.5L dust container
- HEPA filter
- 360° rotation head
- Long power cord
- Silver matte coating

#### Small Appliances (8 Products)

| Model | Arabic Name | Category | Price (EGP) | Regular |
|-------|-------------|----------|-------------|---------|
| WK800 | عجان ويلسن 7.5 لتر | Mixer | 6,475 | 6,500 |
| Wo503 | فرن كهربائي 3 مفاتيح | Oven | 3,550 | 3,800 |
| Wo504 | فرن كهربائي 4 مفاتيح | Oven | 4,100 | 4,300 |
| Wv 1300 | كبة ويلسن | Chopper | 1,350 | 1,500 |
| WK500 | كاتل ويلسن | Kettle | 1,250 | 1,350 |
| - | مضرب بيض فردي | Beater | 1,100 | 1,200 |
| - | مضرب البيض بالعجان | Beater | 2,200 | 2,250 |
| WH1300 | هاند بليندر WH1300 | Blender | 2,250 | 2,400 |
| WH1200 | هاند بليندر WH1200 | Blender | 1,490 | 1,550 |

### 2.3 Price Analysis

| Category | Min Price | Max Price | Avg Price |
|----------|-----------|-----------|-----------|
| Freezers | 10,300 | 11,700 | 11,000 |
| Stoves | 12,085 | 18,085 | 14,416 |
| Water Coolers | 5,900 | 6,500 | 6,200 |
| Vacuum Cleaners | 3,900 | 4,500 | 4,200 |
| Small Appliances | 1,100 | 6,475 | 2,671 |

**Total Price Range:** EGP 1,100 - EGP 18,085

---

## 3. Product Specifications Schema

### 3.1 Common Specification Fields

```typescript
interface ProductSpecs {
  // Identification
  model: string;
  sku?: string;

  // Dimensions & Capacity
  dimensions?: string;        // "60x90 cm"
  capacity?: string;          // "340L", "7.5L", "3.5L dust"

  // Power
  power?: string;             // "2500W", "1700W"
  voltage?: string;           // "220V", "180-260V"
  motor?: string;             // "LG", "Copper"

  // Materials
  materials?: string[];       // ["Stainless steel 304", "Copper"]

  // Features
  features?: string[];

  // Warranty
  warranty_years: number;
  warranty_type: 'full' | 'compressor' | 'motor';
}

// Category-specific extensions
interface StoveSpecs extends ProductSpecs {
  burners: string;            // "5 gas burners (copper, Turkish design)"
  oven_type: string;          // "Turbo fan, dual tempered glass"
  control: string;            // "Digital touch timer"
  safety: string;             // "Full safety for burners and oven"
}

interface FreezerSpecs extends ProductSpecs {
  insulation_thickness: string;  // "60mm"
  internal_lighting: boolean;
  temperature_control: boolean;
  defrost_drain: boolean;
  cfc_free: boolean;
}

interface VacuumSpecs extends ProductSpecs {
  dust_capacity: string;      // "3.5L"
  filter_type: string;        // "HEPA"
  rotation_angle: string;     // "360 degree"
}

interface WaterCoolerSpecs extends ProductSpecs {
  hot_tank_capacity: string;  // "1L"
  cold_tank_capacity: string; // "3.25L"
  taps: number;               // 3
  has_fridge: boolean;
}
```

---

## 4. Brand Positioning Analysis

### 4.1 Unique Selling Points

1. **Egyptian Design Focus**
   - Products designed for Egyptian climate
   - Voltage tolerance (handles fluctuations)
   - Heat and humidity resistant
   - Family-sized capacities

2. **Quality Components**
   - LG motors in freezers
   - Copper burners in stoves
   - 304 Stainless steel (food-grade)
   - HEPA filters in vacuums

3. **Strong Warranty**
   - 5 years standard warranty on major appliances
   - 2 years on small appliances
   - Full coverage including parts and labor

4. **Value Pricing**
   - 35% cheaper than Samsung equivalent
   - Higher specs than Toshiba
   - Regular discount pricing

### 4.2 Competitive Advantages

| Feature | Wilson | Competitors |
|---------|--------|-------------|
| Warranty | 5 years | 1-2 years |
| Voltage Range | 180-260V | 220-240V |
| Service Response | 48 hours | 5-7 days |
| Free Installation | Yes | Extra charge |
| Free Delivery | Yes | Varies |

---

## 5. Technical Infrastructure

### 5.1 Current Platform

- **CMS**: WordPress + WooCommerce
- **Theme**: Astra
- **Language**: Arabic (RTL)
- **API**: WordPress REST API + WooCommerce REST API

### 5.2 API Endpoints Available

**Public (No Auth):**
- `/wc/store/v1/products` - List products
- `/wc/store/v1/products/{id}` - Single product
- `/wc/store/v1/cart` - Cart operations
- `/wc/store/v1/checkout` - Checkout

**Protected (API Keys Required):**
- `/wc/v3/products` - Products CRUD
- `/wc/v3/orders` - Orders management
- `/wc/v3/customers` - Customers
- `/wc/v3/coupons` - Coupons
- `/wc/v3/reports` - Analytics

### 5.3 Pages Structure

| Page | Slug | Purpose |
|------|------|---------|
| My Account | `/my-account` | User dashboard |
| Checkout | `/checkout` | Order completion |
| Basket | `/basket` | Cart view |
| Shop | `/shop` | Product listing |
| Products | `/products` | Category view |
| Contact | `/contact` | Contact form |

---

## 6. Product Data Migration Plan

### 6.1 Data Mapping

| Source (WooCommerce) | Target (Wilson API) |
|---------------------|---------------------|
| `id` | `legacy_id` (for reference) |
| `name` | Split into `name_ar` / `name_en` |
| `price` | `base_price` |
| `sale_price` | `discount_price` |
| `status` | `status` |
| `categories` | `category` |
| `attributes` | `specs` JSON |

### 6.2 Image Migration

```
Source: wilson-eg.com/wp-content/uploads/
Target: /uploads/products/{category}/{product_code}/
```

### 6.3 Categories Migration

```javascript
const categoryMapping = {
  'freezers': 'refrigerators_freezers',
  'stoves': 'stoves_ovens',
  'water_coolers': 'water_coolers',
  'vacuum_cleaners': 'vacuum_cleaners',
  'home_appliances': 'small_appliances',
  'blenders': 'small_appliances'
};
```

---

## 7. Implementation Priorities

### Phase 1: Core Setup
- [ ] Initialize wilson/ project with Vite + React
- [ ] Apply gold design system (#FEB636)
- [ ] Create base components

### Phase 2: Product Display
- [ ] Products listing page
- [ ] Product detail page
- [ ] Category filtering
- [ ] Search functionality

### Phase 3: E-commerce Features
- [ ] Cart system
- [ ] Checkout flow
- [ ] User authentication
- [ ] Order management

### Phase 4: Admin Panel
- [ ] Dashboard analytics
- [ ] Product management
- [ ] Order management
- [ ] Customer management

### Phase 5: Backend Adaptation
- [ ] Adapt app.py for appliances
- [ ] Add product specifications
- [ ] Migrate product data
- [ ] Upload product images

---

## 8. Key Metrics

| Metric | Value |
|--------|-------|
| Total Products | 26 |
| In Stock | 19 |
| Out of Stock | 7 |
| Categories | 5 |
| Price Range | EGP 1,100 - 18,085 |
| Average Discount | ~4% |
| Average Rating | 4.4 / 5 |
| Warranty (Major) | 5 years |
| Warranty (Small) | 2 years |

---

## 9. Brand Voice Guidelines

### Arabic Voice
- Conversational Egyptian colloquial
- Direct and honest
- Warm and supportive
- Street-smart expressions

### English Voice
- Professional but accessible
- Concise and benefit-focused
- Trustworthy
- Welcoming

### Example Copy

**Arabic:**
> "قوية. ذكية. بسعر عادل."
> "مش الأرخص. لكن أفضل قيمة."
> "معاك طول العمر."

**English:**
> "Powerful. Smart. Fairly Priced."
> "Not the cheapest. But the best value."
> "With you for life."

---

## 10. File Reference

| File | Purpose |
|------|---------|
| `docs/wilson-complete-data.json` | All product data in JSON |
| `docs/wilson-summary.txt` | Quick reference summary |
| `docs/rebranding-plan.md` | Gold rebranding strategy |
| `wilson/IMPLEMENTATION-PLAN.md` | Build roadmap |
| `example/src/` | Reference frontend (Bronze) |
| `example-2/wa-front/` | HVAR Design System reference |

---

*Document Version: 1.0*
*Created: 2026-02-15*
*Purpose: Comprehensive reference for Wilson Egypt production build*
