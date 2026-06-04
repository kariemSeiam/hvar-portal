# Wilson Egypt - Project Overview

## Project Identity

**Brand:** Wilson Egypt (ويلسون)
**Tagline:** صُنع للبيت المصري (Made for Egyptian Homes)
**Primary Color:** Egyptian Gold #FEB636
**Industry:** Home Appliances E-commerce
**Market:** Egypt (Arabic-first, bilingual support)

---

## Project Structure

Repo overview: **`project/backend`** (API), **`project/frontend`** (storefront). This file lives under **`docs/development/`**.

```
project/frontend/
├── plan/                    # Planning documents (in-repo notes)
│   ├── ROADMAP.md           # Project roadmap
│   ├── SPRINTS.md           # Sprint planning
│   └── ARCHITECTURE.md      # Technical architecture
│
├── progress/                # Progress tracking
│   ├── PROGRESS.md          # Current status
│   ├── CHANGELOG.md         # Change history
│   └── BLOCKERS.md          # Blockers and resolutions
│
├── src/                     # Source code
│   ├── components/          # React components
│   ├── contexts/            # React contexts
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── lib/                 # Utilities
│   ├── types/               # TypeScript types
│   └── styles/              # CSS styles
│
├── public/                  # Static assets
└── tests/                   # Test files
```

---

## Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS + PostCSS
- **State Management:** React Context + React Query
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **UI Primitives:** Radix UI

### Backend (Existing - Flask)
- **Framework:** Flask + SQLAlchemy
- **Database:** SQLite (development) / PostgreSQL (production)
- **Authentication:** JWT (30-day expiry)
- **API:** RESTful

### Design System
- **Primary:** Egyptian Gold (#FEB636)
- **Typography:** Cairo (Arabic) + Inter (English)
- **Direction:** RTL-first with LTR support
- **Theme:** Light/Dark mode

---

## Product Categories

| Category | Arabic | Products |
|----------|--------|----------|
| Refrigerators & Freezers | الثلاجات والفريزرات | 12 |
| Stoves & Ovens | البوتاجازات والأفران | 6 |
| Water Coolers | مبردات المياه | 4 |
| Vacuum Cleaners | المكانس الكهربائية | 2 |
| Small Appliances | الأجهزة الصغيرة | 2 |
| **Total** | | **26** |

---

## Brand Values

1. **Quality First** - Global quality standards
2. **Egyptian Made** - Designed for Egyptian homes
3. **Fair Pricing** - Value for money
4. **5-Year Warranty** - Industry-leading warranty
5. **48-Hour Service** - Fast maintenance response
6. **Always Available** - Spare parts always in stock

---

## Target Users

### Primary: Egyptian Families
- Age: 25-55
- Location: Urban Egypt (Cairo, Alexandria, etc.)
- Income: Middle to upper-middle class
- Language: Arabic (primary), English (secondary)

### Secondary: Small Business Owners
- Restaurants, cafes, small shops
- Commercial appliance needs
- Bulk ordering capability

---

## Key Differentiators

| Feature | Wilson | Competitors |
|---------|--------|-------------|
| Warranty | 5 years | 1-2 years |
| Service Response | 48 hours | 1-2 weeks |
| Parts Availability | Always | Often delayed |
| Price Point | Fair | Premium or Budget |
| Local Support | Egyptian team | Imported support |

---

## Success Metrics

### Business KPIs
- Monthly Active Users (MAU)
- Conversion Rate (visitor to customer)
- Average Order Value (AOV)
- Customer Lifetime Value (CLV)
- Return Customer Rate

### Technical KPIs
- Page Load Time < 3s
- Mobile Performance Score > 80
- Accessibility Score (WCAG 2.1 AA)
- Uptime > 99.9%

---

## Timeline

### Phase 1: Foundation (Current)
- [x] Project setup
- [x] Design system
- [x] Core components
- [x] Customer pages scaffold
- [ ] Backend adaptation
- [ ] Admin panel

### Phase 2: Integration
- [ ] API integration
- [ ] Authentication flow
- [ ] Cart persistence
- [ ] Order processing

### Phase 3: Enhancement
- [ ] Search functionality
- [ ] Filtering system
- [ ] Product recommendations
- [ ] Reviews system

### Phase 4: Optimization
- [ ] Performance optimization
- [ ] SEO implementation
- [ ] Analytics integration
- [ ] A/B testing setup

---

## Contact

**Project Lead:** Kariem Seiam
**Timezone:** Africa/Cairo (UTC+2)
**Languages:** Arabic (native), English (fluent)
