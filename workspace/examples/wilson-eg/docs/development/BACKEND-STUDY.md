# Wilson Egypt - Backend Deep Study

## Executive Summary

This document provides comprehensive analysis and planning for the Flask backend that will power Wilson Egypt e-commerce platform. The current app.py was built for a shoes store (Shozati) and requires significant adaptation for home appliances.

---

## 1. Current State Analysis

### 1.1 Existing Architecture (app.py)

**Original Purpose:** Shoes e-commerce (Shozati)
**Lines of Code:** ~2,500+
**Database:** SQLite with SQLAlchemy

**Key Models (Current):**
- User
- Product (with sizes, colors, variants - shoe-specific)
- Order
- Cart
- Review
- Coupon

### 1.2 What Needs to Change

| Current (Shoes) | Required (Appliances) |
|-----------------|----------------------|
| Sizes (S, M, L, XL) | Specifications (capacity, voltage, power) |
| Colors with images | Single product image set |
| Variant system | No variants - single SKU |
| Simple pricing | Tiered pricing (cash, installment) |
| Basic warranty | 5-year warranty tracking |

---

## 2. Required Models

### 2.1 Core Models

```python
# User Model (Enhanced)
class User:
    id: UUID
    phone: str (unique, primary identifier)
    name: str (nullable)
    email: str (nullable)
    role: enum (user, admin, service)
    is_profile_complete: bool
    addresses: relationship[Address]
    orders: relationship[Order]
    created_at: datetime
    last_login: datetime

# Address Model
class Address:
    id: UUID
    user_id: FK[User]
    governorate: str (24 governorates)
    district: str
    street_address: str
    building_number: str
    floor: str (nullable)
    apartment: str (nullable)
    landmark: str (nullable, for directions)
    is_default: bool
    phone: str (nullable, different from user)
    created_at: datetime

# Category Model
class Category:
    id: UUID
    slug: str (unique)
    name_ar: str
    name_en: str
    description_ar: str (nullable)
    description_en: str (nullable)
    icon: str (emoji or icon name)
    image_url: str (nullable)
    parent_id: FK[Category] (nullable, for subcategories)
    sort_order: int
    is_active: bool
    products: relationship[Product]
    created_at: datetime
    updated_at: datetime

# Product Model (Appliance-Specific)
class Product:
    id: UUID
    sku: str (unique)
    barcode: str (nullable)

    # Localization
    name_ar: str
    name_en: str
    description_ar: text
    description_en: text

    # Classification
    category_id: FK[Category]
    subcategory: str (nullable)

    # Pricing
    base_price: decimal(10,2)
    discount_price: decimal(10,2) (nullable)
    cash_price: decimal(10,2) (nullable, special cash discount)
    installment_months: int (default 0)
    monthly_payment: decimal(10,2) (nullable)

    # Inventory
    stock_quantity: int
    low_stock_threshold: int (default 5)
    is_in_stock: bool (computed from stock)
    is_active: bool
    is_featured: bool

    # Media
    images: JSON [{url, alt, is_primary}]
    thumbnail_url: str
    video_url: str (nullable)

    # Specifications (JSON for flexibility)
    specifications: JSON {
        capacity: str (e.g., "340L")
        voltage: str (e.g., "220V")
        power: str (e.g., "180W")
        dimensions: str (e.g., "120x60x85 cm")
        weight: str (e.g., "45 kg")
        color: str
        material: str
        energy_rating: str (e.g., "A+")
        # Category-specific fields added dynamically
    }

    # Features (bullet points)
    features_ar: JSON [str]
    features_en: JSON [str]

    # Warranty
    warranty_years: int (default 5)
    warranty_type: enum (standard, extended)

    # Metadata
    meta_title_ar: str (nullable, for SEO)
    meta_title_en: str (nullable)
    meta_description_ar: str (nullable)
    meta_description_en: str (nullable)

    # Stats
    views_count: int
    sales_count: int

    # Tags
    tags: JSON [str] (e.g., ["bestseller", "new", "sale"])

    # Timestamps
    created_at: datetime
    updated_at: datetime

# ProductReview Model
class ProductReview:
    id: UUID
    product_id: FK[Product]
    user_id: FK[User]
    rating: int (1-5)
    title: str (nullable)
    comment: text
    is_verified_purchase: bool
    is_approved: bool
    helpful_count: int
    created_at: datetime
    updated_at: datetime

# Order Model
class Order:
    id: UUID
    order_number: str (unique, human-readable)
    user_id: FK[User]

    # Items
    items: relationship[OrderItem]

    # Pricing
    subtotal: decimal(12,2)
    discount: decimal(12,2) (default 0)
    shipping: decimal(10,2)
    total: decimal(12,2)

    # Coupon
    coupon_id: FK[Coupon] (nullable)
    coupon_discount: decimal(10,2)

    # Status
    status: enum (pending, confirmed, processing, shipped, delivered, cancelled, returned)
    payment_status: enum (pending, paid, failed, refunded)
    payment_method: enum (cod, card, wallet)

    # Address (snapshot at order time)
    shipping_address: JSON {
        governorate, district, street, building, floor, apartment, phone
    }

    # Tracking
    tracking_number: str (nullable)
    tracking_url: str (nullable)
    estimated_delivery: date
    actual_delivery: date (nullable)

    # Notes
    customer_notes: text (nullable)
    admin_notes: text (nullable)

    # Timestamps
    created_at: datetime
    updated_at: datetime
    confirmed_at: datetime (nullable)
    shipped_at: datetime (nullable)
    delivered_at: datetime (nullable)

# OrderItem Model
class OrderItem:
    id: UUID
    order_id: FK[Order]
    product_id: FK[Product]
    product_snapshot: JSON (product data at order time)

    quantity: int
    unit_price: decimal(10,2)
    total_price: decimal(10,2)

# OrderTracking Model
class OrderTracking:
    id: UUID
    order_id: FK[Order]
    status: str
    description: str
    location: str (nullable)
    timestamp: datetime

# Coupon Model
class Coupon:
    id: UUID
    code: str (unique)
    description: str

    # Discount
    discount_type: enum (percentage, fixed)
    discount_value: decimal(10,2)
    max_discount: decimal(10,2) (nullable, for percentage)

    # Usage
    usage_limit: int (total uses allowed)
    usage_count: int (current uses)
    per_user_limit: int (max uses per user)

    # Validity
    min_order_value: decimal(10,2) (nullable)
    is_active: bool
    starts_at: datetime
    expires_at: datetime

    # Restrictions
    applicable_categories: JSON [category_id] (nullable, empty = all)
    excluded_products: JSON [product_id] (nullable)

    created_at: datetime
    updated_at: datetime

# WarrantyRegistration Model
class WarrantyRegistration:
    id: UUID
    order_id: FK[Order]
    product_id: FK[Product]
    user_id: FK[User]

    serial_number: str (nullable, product serial)
    purchase_date: date
    registration_date: datetime

    # Warranty Period
    warranty_start: date
    warranty_end: date
    warranty_years: int

    # Status
    status: enum (active, expired, voided)

    # Contact for service
    service_phone: str
    service_address: str

# ServiceRequest Model
class ServiceRequest:
    id: UUID
    ticket_number: str (unique)
    warranty_id: FK[WarrantyRegistration] (nullable)
    user_id: FK[User]
    product_id: FK[Product]

    # Request Details
    request_type: enum (repair, maintenance, installation, other)
    priority: enum (low, medium, high, urgent)
    description: text
    images: JSON [url]

    # Status
    status: enum (pending, scheduled, in_progress, completed, cancelled)

    # Scheduling
    preferred_date: date
    preferred_time: str
    scheduled_date: date (nullable)
    scheduled_time: str (nullable)

    # Technician
    technician_id: FK[User] (nullable)
    technician_notes: text (nullable)

    # Resolution
    resolution: text (nullable)
    parts_used: JSON [{name, quantity, cost}] (nullable)
    labor_cost: decimal(10,2) (nullable)
    total_cost: decimal(10,2) (nullable)

    # Feedback
    rating: int (nullable, 1-5)
    feedback: text (nullable)

    created_at: datetime
    updated_at: datetime
    completed_at: datetime (nullable)

# ContactMessage Model
class ContactMessage:
    id: UUID
    name: str
    phone: str
    email: str (nullable)
    subject: str (nullable)
    message: text
    status: enum (new, read, replied, closed)
    admin_reply: text (nullable)
    replied_at: datetime (nullable)
    replied_by: FK[User] (nullable)
    created_at: datetime

# Banner/Slide Model
class Banner:
    id: UUID
    title_ar: str
    title_en: str
    subtitle_ar: str (nullable)
    subtitle_en: str (nullable)
    image_url: str
    mobile_image_url: str (nullable)
    link_url: str (nullable)
    button_text_ar: str (nullable)
    button_text_en: str (nullable)

    position: int
    is_active: bool
    starts_at: datetime (nullable)
    ends_at: datetime (nullable)

    created_at: datetime
    updated_at: datetime

# Settings Model (Key-Value Store)
class Setting:
    id: UUID
    key: str (unique)
    value: text
    type: enum (string, number, boolean, json)
    description: str (nullable)
    updated_at: datetime
```

### 2.2 Analytics Models

```python
# ProductView Model (for analytics)
class ProductView:
    id: UUID
    product_id: FK[Product]
    user_id: FK[User] (nullable, for guests)
    session_id: str
    ip_address: str (hashed for privacy)
    user_agent: str
    referrer: str (nullable)
    viewed_at: datetime

# SearchQuery Model (for search analytics)
class SearchQuery:
    id: UUID
    query: str
    results_count: int
    user_id: FK[User] (nullable)
    session_id: str
    searched_at: datetime

# DailySales Model (aggregated analytics)
class DailySales:
    id: UUID
    date: date (unique)
    total_orders: int
    total_revenue: decimal(12,2)
    total_products_sold: int
    new_customers: int
    returning_customers: int
    created_at: datetime
```

---

## 3. API Endpoints

### 3.1 Authentication

```
POST   /api/auth/request-otp      # Request OTP for phone
POST   /api/auth/verify-otp       # Verify OTP and get token
POST   /api/auth/refresh-token    # Refresh JWT token
POST   /api/auth/logout           # Logout user
GET    /api/auth/me               # Get current user
```

### 3.2 Products

```
GET    /api/products              # List products (paginated, filtered)
GET    /api/products/:id          # Get product details
GET    /api/products/search       # Search products
GET    /api/products/featured     # Get featured products
GET    /api/products/:id/related  # Get related products
GET    /api/products/:id/reviews  # Get product reviews

# Admin
POST   /api/admin/products        # Create product
PUT    /api/admin/products/:id    # Update product
DELETE /api/admin/products/:id    # Delete product
POST   /api/admin/products/:id/images  # Upload product images
```

### 3.3 Categories

```
GET    /api/categories            # List all categories
GET    /api/categories/:slug      # Get category by slug
GET    /api/categories/:slug/products  # Get products in category

# Admin
POST   /api/admin/categories      # Create category
PUT    /api/admin/categories/:id  # Update category
DELETE /api/admin/categories/:id  # Delete category
```

### 3.4 Cart

```
GET    /api/cart                  # Get current cart
POST   /api/cart/items            # Add item to cart
PUT    /api/cart/items/:id        # Update item quantity
DELETE /api/cart/items/:id        # Remove item from cart
DELETE /api/cart                  # Clear cart
POST   /api/cart/apply-coupon     # Apply coupon code
DELETE /api/cart/coupon           # Remove coupon
```

### 3.5 Orders

```
GET    /api/orders                # List user orders
POST   /api/orders                # Create new order
GET    /api/orders/:id            # Get order details
POST   /api/orders/:id/cancel     # Cancel order
GET    /api/orders/:id/tracking   # Get order tracking

# Admin
GET    /api/admin/orders          # List all orders (filtered)
PUT    /api/admin/orders/:id      # Update order status
POST   /api/admin/orders/:id/ship # Mark as shipped
POST   /api/admin/orders/:id/deliver # Mark as delivered
```

### 3.6 User Profile

```
GET    /api/user/profile          # Get user profile
PUT    /api/user/profile          # Update profile
GET    /api/user/addresses        # List addresses
POST   /api/user/addresses        # Add address
PUT    /api/user/addresses/:id    # Update address
DELETE /api/user/addresses/:id    # Delete address
POST   /api/user/addresses/:id/default # Set default
```

### 3.7 Wishlist

```
GET    /api/wishlist              # Get wishlist
POST   /api/wishlist/:product_id  # Add to wishlist
DELETE /api/wishlist/:product_id  # Remove from wishlist
```

### 3.8 Reviews

```
GET    /api/products/:id/reviews  # Get product reviews
POST   /api/products/:id/reviews  # Submit review
PUT    /api/reviews/:id           # Update review
DELETE /api/reviews/:id           # Delete review

# Admin
PUT    /api/admin/reviews/:id/approve  # Approve review
DELETE /api/admin/reviews/:id    # Delete review
```

### 3.9 Warranty & Service

```
# Warranty
GET    /api/warranties            # List user warranties
POST   /api/warranties            # Register warranty
GET    /api/warranties/:id        # Get warranty details

# Service
GET    /api/service-requests      # List user requests
POST   /api/service-requests      # Create service request
GET    /api/service-requests/:id  # Get request details
PUT    /api/service-requests/:id  # Update request (reschedule)
```

### 3.10 Contact

```
POST   /api/contact               # Submit contact form
```

### 3.11 Admin Dashboard

```
GET    /api/admin/dashboard/stats       # Overview stats
GET    /api/admin/dashboard/revenue     # Revenue chart data
GET    /api/admin/dashboard/top-products # Best selling products
GET    /api/admin/dashboard/recent-orders # Recent orders
GET    /api/admin/dashboard/low-stock   # Low stock alerts
```

### 3.12 Admin Management

```
# Customers
GET    /api/admin/customers        # List customers
GET    /api/admin/customers/:id    # Get customer details
PUT    /api/admin/customers/:id    # Update customer

# Coupons
GET    /api/admin/coupons          # List coupons
POST   /api/admin/coupons          # Create coupon
PUT    /api/admin/coupons/:id      # Update coupon
DELETE /api/admin/coupons/:id      # Delete coupon

# Banners
GET    /api/admin/banners          # List banners
POST   /api/admin/banners          # Create banner
PUT    /api/admin/banners/:id      # Update banner
DELETE /api/admin/banners/:id      # Delete banner

# Settings
GET    /api/admin/settings         # Get all settings
PUT    /api/admin/settings/:key    # Update setting
```

---

## 4. Authentication Strategy

### 4.1 JWT Implementation

```python
# Token Structure
{
    "sub": "user_id",
    "phone": "+201234567890",
    "role": "user",
    "exp": timestamp,
    "iat": timestamp,
    "jti": "unique_token_id"
}

# Token Configuration
ACCESS_TOKEN_EXPIRE = 30  # minutes
REFRESH_TOKEN_EXPIRE = 30  # days

# Token Storage
- Access token: Memory (React state)
- Refresh token: httpOnly cookie (secure)
```

### 4.2 OTP Flow

```
1. User enters phone number
2. Backend generates 6-digit OTP
3. OTP stored in Redis with 5-minute expiry
4. SMS sent via gateway (Twilio/Vodafone)
5. User enters OTP
6. Backend validates OTP
7. If valid, issue JWT tokens
8. If new user, create account
```

### 4.3 Role-Based Access

```python
class UserRole(Enum):
    USER = "user"           # Customer
    ADMIN = "admin"         # Full admin access
    SERVICE = "service"     # Service team (read orders, update service)
    WAREHOUSE = "warehouse" # Warehouse (update stock, orders)

# Permission decorators
@require_role(UserRole.ADMIN)
def admin_only_endpoint():
    pass

@require_any_role(UserRole.ADMIN, UserRole.SERVICE)
def service_endpoint():
    pass
```

---

## 5. Database Considerations

### 5.1 SQLite → PostgreSQL Migration

```python
# Development: SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./wilson.db"

# Production: PostgreSQL
SQLALCHEMY_DATABASE_URL = "postgresql://user:pass@localhost/wilson"

# Connection pooling (production)
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

### 5.2 Indexes Required

```sql
-- Products
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_sku ON products(sku);

-- Orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Users
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- Full-text search (PostgreSQL)
CREATE INDEX idx_products_name_search ON products USING GIN (to_tsvector('arabic', name_ar));
CREATE INDEX idx_products_name_search_en ON products USING GIN (to_tsvector('english', name_en));
```

### 5.3 Data Migration Plan

```
Phase 1: Export WooCommerce Data
- Products (26 items)
- Categories (5 categories)
- Images

Phase 2: Transform Data
- Map WooCommerce fields to new schema
- Generate Arabic descriptions (if missing)
- Create specifications from product data

Phase 3: Import to Flask
- Insert categories first
- Insert products with category FKs
- Update image URLs
- Verify data integrity
```

---

## 6. External Integrations

### 6.1 SMS Gateway

```python
# Provider Options:
# 1. Twilio (International, reliable)
# 2. Vodafone SMS API (Egypt local)
# 3. SMS Misr (Egypt local)

# Integration
class SMSProvider:
    def send_otp(phone: str, otp: str) -> bool:
        message = f"رمز التحقق الخاص بك في ويلسون: {otp}"
        # API call to SMS gateway
```

### 6.2 Payment Gateway

```python
# Phase 1: COD Only (Cash on Delivery)

# Phase 2: Payment Integration
# Options:
# 1. Paymob (Egypt, popular)
# 2. Fawry (Egypt, widely used)
# 3. Stripe (International)

# Integration points
- Card tokenization
- Payment verification webhook
- Refund processing
```

### 6.3 Image Storage

```python
# Options:
# 1. Local filesystem (development)
# 2. AWS S3 (production)
# 3. Cloudflare R2 (production, cheaper)
# 4. Wasabi (production, cheapest)

# Image processing
- Resize on upload (thumbnail, medium, large)
- WebP conversion for optimization
- CDN for delivery
```

---

## 7. Security Measures

### 7.1 API Security

```python
# Rate Limiting
@limiter.limit("100/hour")  # General API
@limiter.limit("5/minute")  # Auth endpoints
@limiter.limit("10/minute")  # OTP requests

# Input Validation
- Pydantic models for all inputs
- SQL injection prevention (SQLAlchemy parameterized)
- XSS prevention (output escaping)

# Headers
- CORS configuration
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
```

### 7.2 Data Protection

```python
# Sensitive Data
- Password hashing: bcrypt
- Phone hashing for analytics
- Token encryption at rest

# GDPR Considerations
- User data export endpoint
- User data deletion endpoint
- Privacy policy acceptance tracking
```

---

## 8. Performance Optimization

### 8.1 Caching Strategy

```python
# Redis Cache
CACHE_TTL = {
    "products_list": 300,      # 5 minutes
    "product_detail": 600,     # 10 minutes
    "categories": 3600,        # 1 hour
    "user_cart": 60,           # 1 minute
}

# Cache invalidation
- On product update: clear product + list cache
- On order: clear user cart cache
- On category change: clear categories cache
```

### 8.2 Query Optimization

```python
# Eager loading relationships
query.options(
    joinedload(Product.category),
    joinedload(Order.items),
    selectinload(User.addresses)
)

# Pagination
query.offset((page - 1) * per_page).limit(per_page)

# Count optimization
# Use window functions for total count in single query
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```python
# Coverage targets
- Models: 100%
- Services: 90%
- API endpoints: 80%
- Utilities: 95%
```

### 9.2 Integration Tests

```python
# Test fixtures
- Test database (SQLite in-memory)
- Test client
- Mock SMS gateway
- Mock payment gateway

# Test scenarios
- Complete order flow
- Authentication flow
- Admin operations
- Error handling
```

---

## 10. Deployment Architecture

### 10.1 Development

```
┌─────────────────┐     ┌─────────────────┐
│   React Dev     │────▶│   Flask Dev     │
│   localhost:5173│     │   localhost:5000│
└─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   SQLite        │
                        │   (local file)  │
                        └─────────────────┘
```

### 10.2 Production

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Cloudflare    │────▶│   Nginx         │────▶│   Gunicorn      │
│   (CDN/DDoS)    │     │   (Reverse)     │     │   (Flask)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                       │
                        ┌─────────────────┐           │
                        │   PostgreSQL    │◀──────────┤
                        │   (Database)    │           │
                        └─────────────────┘           │
                                                       │
                        ┌─────────────────┐           │
                        │   Redis         │◀──────────┘
                        │   (Cache)       │
                        └─────────────────┘
```

---

## 11. Monitoring & Logging

### 11.1 Application Logging

```python
# Structured logging
{
    "timestamp": "2025-02-15T10:30:00Z",
    "level": "INFO",
    "message": "Order created",
    "order_id": "uuid",
    "user_id": "uuid",
    "request_id": "uuid"
}

# Log levels
- ERROR: Application errors, exceptions
- WARNING: Business rule violations
- INFO: Key business events
- DEBUG: Development details (dev only)
```

### 11.2 Monitoring

```python
# Metrics to track
- Request latency (p50, p95, p99)
- Error rate
- Active users
- Order conversion rate
- API response times

# Tools
- Sentry: Error tracking
- Prometheus: Metrics
- Grafana: Visualization
```

---

## 12. Development Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Backend Adaptation | Week 1-2 | Model updates, migrations |
| API Development | Week 2-3 | All endpoints |
| Integration | Week 3-4 | Frontend connection |
| Testing | Week 4 | Unit & integration tests |
| Deployment | Week 5 | Production setup |

---

## Next Actions

1. Wait for deep backend analysis agent to complete
2. Review agent findings
3. Begin model migration
4. Set up database migrations (Alembic)
5. Implement authentication endpoints first
6. Build product APIs
7. Connect frontend to backend
