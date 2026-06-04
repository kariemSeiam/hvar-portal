# Architecture — Component Tree & Data Flow

> How Hvar-Catalog is structured: components, data loading, and rendering.

---

## File Map

```
src/
├── main.jsx                              # ReactDOM.createRoot entry
├── App.jsx                               # Root: wraps <AppShell><LandingPage />
│
├── design_system/
│   └── DesignSystemProvider.jsx           # Context: darkMode, dir, RTL toggle
│
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx                  # Shell: header + main + footer wrapper
│   │   ├── Header.jsx                    # Sticky header: logo, nav, search, mobile menu
│   │   └── Footer.jsx                    # Footer: links, social, contact
│   │
│   ├── pages/
│   │   └── LandingPage.jsx               # Single page: 5 sections composed
│   │
│   ├── content/
│   │   └── HeroSection.jsx               # Full-viewport hero: product carousel
│   │
│   ├── product/
│   │   ├── ProductCard.jsx               # Card: image, badges, name, price, specs
│   │   ├── ProductGrid.jsx               # Grid: 4-col responsive + horizontal scroll
│   │   ├── CategorySection.jsx           # Category grouping + merchant metrics
│   │   ├── ProductShowcase.jsx           # Grid + QuickView modal integration
│   │   └── QuickViewModal.jsx            # (future: modal for product detail)
│   │
│   └── ui/
│       └── LoadingSpinner.jsx            # Spinner with variants + RTL support
│
├── hooks/
│   └── useProducts.js                    # Data fetching, normalization, dedup, search
│
├── constants/
│   └── categories.js                     # Static category definitions
│
├── utils/
│   └── formatPrice.js                    # EGP formatting, discount calc, Intl.NumberFormat
│
├── index.css                             # Tailwind directives, CSS variables, animations,
│                                         # glass effects, card/modern utilities, logo CSS,
│                                         # scrollbar hide, 600+ lines of utility classes
│
└── App.jsx                               # (covered above)
```

---

## Component Tree

```
<App>                                          # App.jsx
  <DesignSystemProvider>                        # darkMode + dir context
    <AppShell>                                  # layout wrapper
      <Header />                                # sticky, animated
      <main>
        <LandingPage>                           # single-page sections
          <HeroSection />                       # full-viewport, product carousel
          <section id="featured">
            <CategorySection products={featured}>
              <ProductGrid>
                <ProductCard />                 # ×N, 4-col responsive grid
              </ProductGrid>
            </CategorySection>
          </section>
          <section id="categories">
            <CategorySection products={all}>
              <ProductGrid>
                <ProductCard />                 # ×N, grouped by category
              </ProductGrid>
            </CategorySection>
          </section>
          <section id="reviews">
            <div className="coming-soon-card" />
          </section>
          <section id="support">
            <ServiceCards />                    # 3-card grid (inline)
          </section>
          <section id="contact">
            <ContactInfo />                     # phone, email, WhatsApp, hours
          </section>
        </LandingPage>
      </main>
      <Footer />
    </AppShell>
  </DesignSystemProvider>
</App>
```

---

## Data Flow

```
public/data/products.json
        │
        ▼
  useProducts() hook                   # fetch, normalize, dedup
        │
        ├── products  (sorted: featured first, then price desc)
        ├── loading   (boolean)
        ├── error     (string | null)
        ├── retry()
        ├── filterByCategory(slug)
        └── searchProducts(query)
              │
              ▼
        CategorySection             # groups products by category_slug
              │
              ▼
        ProductGrid                 # renders grid or horizontal scroll
              │
              ▼
        ProductCard                 # individual product display
```

### useProducts() — Data Pipeline

```
fetch('/data/products.json')
    → raw JSON array
    → normalize: ensure brand, free_shipping, featured, images, specs
    → deduplicate by SKU (keep richest record by score)
    → sort: featured first, price descending
    → setProducts(Array)
```

**Dedup scoring:**
```js
score = (images.length || 0)
      + (description_ar ? 2 : 0)
      + (Object.keys(specs).length ? 2 : 0)
      + (price_original_egp ? 1 : 0)
      + (featured ? 1 : 0)
```

---

## Route Design

Single page with **anchor navigation** (no react-router):

| Section | Anchor | Nav Label |
|---------|--------|-----------|
| Hero | (top) | — |
| Featured | `#featured` | مميز |
| Categories | `#categories` | أقسام المنتجات |
| Reviews | `#reviews` | مراجعات البلوجرز |
| Support | `#support` | الدعم الفني |
| Contact | `#contact` | اتصل بنا |

---

## Key Patterns

### Static Site Architecture
- No server, no API, no auth
- Data hosted as static JSON in `public/data/`
- Build: `vite build` → deploy `dist/` folder
- No environment variables needed for MVP

### RTL Everywhere
- `dir` prop from context passed to every component
- Tailwind RTL utilities: `space-x-reverse`, `rtl:space-x-reverse`
- LTR/RTL aware positioning: `left-3` vs `right-3` based on dir

### Dark Mode
- Controlled by `DesignSystemProvider`
- Auto-detects `prefers-color-scheme: dark`
- `html.classList.toggle('dark', darkMode)` toggles Tailwind dark mode
- All colors have `dark:` variants

### Performance
- Lazy image loading with `loading="lazy"`
- `IntersectionObserver` for hero section visibility
- Memoized calculations (`useMemo`, `useCallback`)
- Skeleton loading state with shimmer animation
