<div align="center">

# 🔶 Wilson Egypt

### Egyptian Home Appliances E-Commerce Platform

*A premium, bilingual e-commerce experience with authentic Egyptian Gold branding*

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Deploy](#-deployment)

</div>

---

## ✨ Features

### 🛒 Customer Storefront
| Feature | Description |
|---------|-------------|
| 🏠 **Homepage** | Dynamic hero slider with promotional banners |
| 📦 **Product Catalog** | Category filtering, search, pagination |
| 🔍 **Product Details** | Image gallery, specs, related products |
| 🛒 **Shopping Cart** | Persistent cart, quantity management |
| 💳 **Checkout** | 4-step wizard (cart → shipping → payment → review) |
| 📍 **Address Book** | Save multiple delivery addresses |
| ❤️ **Favorites** | Save products for later |
| 🌍 **Bilingual** | Seamless Arabic/English switching |
| 🌙 **Dark Mode** | System-aware theme detection |
| 📱 **Responsive** | Mobile-first design |

### 👨‍💼 Admin Dashboard
| Page | Capabilities |
|------|--------------|
| 📊 **Dashboard** | Revenue stats, recent orders, top products |
| 📦 **Products** | CRUD operations, image upload, stock management |
| 🛒 **Orders** | Status updates, customer details, order items |
| 👥 **Customers** | Search, order history, total spent |
| 🎫 **Coupons** | Percentage/fixed discounts, usage limits |
| 🖼️ **Slides** | Hero banner management with drag positioning |
| ⚙️ **Settings** | Store info, shipping rates, payment methods |

---

## 🎨 Design System

### Egyptian Gold Palette

| Color | Hex | Preview | Usage |
|-------|-----|---------|-------|
| Gold 50 | `#FFFBEB` | ![#FFFBEB](https://via.placeholder.com/60x24/FFFBEB/FFFBEB) | Light background |
| Gold 100 | `#FEF3C7` | ![#FEF3C7](https://via.placeholder.com/60x24/FEF3C7/FEF3C7) | Hover states |
| **Gold 500** | `#FEB636` | ![#FEB636](https://via.placeholder.com/60x24/FEB636/FEB636) | **Primary brand** |
| Gold 600 | `#D97706` | ![#D97706](https://via.placeholder.com/60x24/D97706/D97706) | Active states |
| Gold 900 | `#78350F` | ![#78350F](https://via.placeholder.com/60x24/78350F/78350F) | Dark accent |

### Typography

```
Arabic:  Cairo (headings), Tajawal (body)
English: Inter (all)
```

### RTL Support

All layouts use **logical CSS properties** (`start`/`end` instead of `left`/`right`) for perfect RTL mirroring without code duplication.

---

## 📸 Demo

<!-- Add your screenshots here -->
| Customer Storefront | Admin Dashboard |
|:-------------------:|:---------------:|
| ![Home](./docs/screenshots/home.png) | ![Dashboard](./docs/screenshots/dashboard.png) |
| ![Products](./docs/screenshots/products.png) | ![Orders](./docs/screenshots/orders.png) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/wilson-egypt/frontend.git
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Environment Variables

Create `.env` in the project root:

```env
VITE_API_URL=/api
VITE_ENABLE_DEVTOOLS=true
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WILSON EGYPT FRONTEND                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   PAGES     │  │  CONTEXTS   │  │       HOOKS             │  │
│  ├─────────────┤  ├─────────────┤  ├─────────────────────────┤  │
│  │ Customer/   │  │ Auth        │  │ useProducts()           │  │
│  │ - Home      │  │ Cart        │  │ useCategories()         │  │
│  │ - Products  │  │ Language    │  │ useOrders()             │  │
│  │ - Cart      │  │ Theme       │  │ useAuth()               │  │
│  │ - Checkout  │  │ Favorites   │  │ useFavorites()          │  │
│  ├─────────────┤  └─────────────┘  └─────────────────────────┘  │
│  │ Admin/      │                                                  │
│  │ - Dashboard │  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ - Products  │  │ COMPONENTS  │  │       SERVICES          │  │
│  │ - Orders    │  ├─────────────┤  ├─────────────────────────┤  │
│  │ - Customers │  │ UI/         │  │ api.ts                  │  │
│  │ - Coupons   │  │ - Button    │  │ - productsApi           │  │
│  │ - Slides    │  │ - Card      │  │ - ordersApi             │  │
│  │ - Settings  │  │ - Dialog    │  │ - authApi               │  │
│  └─────────────┘  │ - Toast     │  │ - favoritesApi          │  │
│                   │ admin/      │  └─────────────────────────┘  │
│                   │ - DataTable │                                │
│                   │ - AdminLayt │  ┌─────────────────────────┐  │
│                   └─────────────┘  │       REDUX/QUERY        │  │
│                                    ├─────────────────────────┤  │
│  ┌─────────────┐                   │ React Query Client      │  │
│  │   ROUTER    │                   │ - Cache management      │  │
│  ├─────────────┤                   │ - Background refetch    │  │
│  │ /           │                   │ - Optimistic updates    │  │
│  │ /products   │                   └─────────────────────────┘  │
│  │ /cart       │                                                  │
│  │ /checkout   │──────────────────────────────────────────────▶ │
│  │ /admin/*    │                   FLASK BACKEND API            │
│  └─────────────┘                   (Port 5000)                  │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── components/
│   ├── admin/          # AdminLayout, DataTable, StatCard
│   ├── layout/         # Header, Footer, Layout
│   └── ui/             # Button, Card, Input, Dialog, Toast...
├── contexts/           # Auth, Cart, Language, Theme, Favorites
├── hooks/              # React Query hooks (useProducts, useAuth...)
├── pages/
│   ├── admin/          # Dashboard, Products, Orders, Customers...
│   └── customer/       # Home, Products, Cart, Checkout...
├── services/           # API layer (api.ts)
├── types/              # TypeScript interfaces
├── lib/                # Utilities (cn, formatters)
└── test/               # Test setup and utilities
```

---

## 🔌 API Integration

The frontend connects to a Flask backend via REST API:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/products` | GET, POST | Product catalog |
| `/api/products/:id` | GET, PUT, DELETE | Single product |
| `/api/categories` | GET | Product categories |
| `/api/orders` | GET, POST | Customer orders |
| `/api/auth/login` | POST | User authentication |
| `/api/addresses` | GET, POST, PUT, DELETE | Address book |
| `/api/favorites` | GET, POST, DELETE | Wishlist |
| `/api/coupons/validate` | POST | Coupon validation |

### API Proxy (Development)

```typescript
// vite.config.ts
proxy: {
  '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
  '/uploads': { target: 'http://127.0.0.1:5000', changeOrigin: true },
}
```

---

## 🧪 Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Tech Stack:** Vitest + React Testing Library + Jest DOM

---

## 🐳 Deployment

### Docker (Recommended)

```bash
# Full stack deployment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Build

```bash
# Build production bundle
npm run build

# Preview locally
npm run preview
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3001 | React app served by Nginx |
| Backend | 5000 | Flask API server |

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3001) |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript validation |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format with Prettier |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |

---

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Last 2 versions |
| Firefox | ✅ Last 2 versions |
| Safari | ✅ Last 2 versions |
| Edge | ✅ Last 2 versions |
| Mobile Safari | ✅ iOS 14+ |
| Chrome Android | ✅ Last 2 versions |

---

## 📊 Performance

| Metric | Target | Actual |
|--------|--------|--------|
| First Contentful Paint | < 1.5s | ~1.2s |
| Largest Contentful Paint | < 2.5s | ~2.1s |
| Time to Interactive | < 3.0s | ~2.4s |
| Bundle Size (gzip) | < 120KB | 101KB |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow existing patterns in the codebase
- Run `npm run lint:fix` before committing
- Add tests for new features
- Update documentation as needed

---

## 📝 License

**Private** - Wilson Egypt © 2024-2026

All rights reserved. This software is proprietary and confidential.

---

<div align="center">

### Built with 🔶 by Wilson Egypt Team

[⬆ Back to Top](#-wilson-egypt)

</div>
