# Wilson Egypt - Project Resources

This folder contains reference materials for building the production Wilson Egypt e-commerce site.

## Structure

```
wilson-eg-scrape/
├── wilson/                    # 🎯 PRODUCTION SITE (to be built)
│   ├── src/
│   ├── public/
│   └── ...
│
├── _resources/                # 📚 Reference & Study Materials
│   └── ...
│
├── example/                   # Reference: Demo Frontend (Bronze Theme)
│   └── src/                   # React + Vite + Tailwind demo
│
├── example-2/                 # Reference: HVAR Design System
│   └── wa-front/              # Production-ready component library
│
├── docs/                      # Documentation
│   ├── rebranding-plan.md     # Complete rebranding strategy
│   ├── wilson-complete-data.json
│   └── wilson-summary.txt
│
├── images/                    # Reference images
│
├── app.py                     # Reference: Shozati Flask Backend
│
└── CLAUDE.md                  # Project documentation
```

## Reference Materials

### 1. `example/` - Demo Frontend (Bronze Theme)
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Bilingual (AR/EN) with RTL support
- **Status**: Marketing demo only, needs e-commerce features

### 2. `example-2/wa-front/` - HVAR Design System v3.5.0
- Complete production-ready component library
- Dark/Light theme support
- RTL support
- Fluid typography/spacing
- **Use for**: Component patterns, animation system, accessibility

### 3. `app.py` - Shozati Backend
- Flask + SQLAlchemy + SQLite
- JWT authentication
- Complete e-commerce API
- **Note**: Originally for shoes, needs adaptation for appliances

### 4. `docs/`
- `rebranding-plan.md` - Complete rebranding strategy with gold theme
- `wilson-complete-data.json` - Product catalog data
- `wilson-summary.txt` - Brand summary

## New Brand Direction

**Primary Color**: Egyptian Gold (#FEB636)

**Typography**:
- Arabic: Cairo, Tajawal
- English: Inter

**Scope**:
- Customer-facing e-commerce site
- Admin panel
- Full production build

## Next Steps

1. Initialize `wilson/` with Vite + React + TypeScript
2. Apply gold design system
3. Build e-commerce features
4. Create admin panel
5. Adapt backend for appliances

See `docs/rebranding-plan.md` for complete details.
