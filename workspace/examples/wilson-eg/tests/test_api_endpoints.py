"""
Smoke tests for critical API endpoints with all args.
Uses Flask test client and in-process DB (drop_all/create_all/seed in setUp).
Run from project root: python -m pytest tests/test_api_endpoints.py -v
Or: python -m unittest tests.test_api_endpoints -v
"""
import json
import os
import sys
from datetime import datetime, timedelta

# Ensure project root is on path
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_ROOT, 'project', 'backend'))

import unittest

# Import after path is set; uses default DB
from app import app, db
from app import (
    User,
    Category,
    Product,
    ProductFeature,
    ProductVariant,
    VariantSize,
    Address,
    Coupon,
    Order,
    OrderItem,
    OrderTracking,
)


def seed_test_data():
    """Create minimal data for API tests."""
    admin = User(
        id="test-admin-id",
        phone="0000000000",
        name="Admin",
        role="admin",
    )
    customer = User(
        id="test-customer-id",
        phone="01111111111",
        name="Test User",
        role="user",
    )
    db.session.add(admin)
    db.session.add(customer)

    cat = Category(
        id="test-cat-id",
        slug="ac",
        name_ar="تكييف",
        name_en="AC",
        sort_order=0,
    )
    db.session.add(cat)

    product = Product(
        id="test-product-id",
        code="COD-000001",
        product_number=1,
        name="Test AC",
        name_ar="تكييف تجريبي",
        name_en="Test AC",
        category="ac",
        base_price=1999.0,
        status="active",
    )
    db.session.add(product)
    db.session.flush()

    variant = ProductVariant(
        id="test-variant-id",
        product_id=product.id,
        color_name="White",
        color_code="#fff",
    )
    db.session.add(variant)
    db.session.flush()

    size = VariantSize(
        id="test-size-id",
        variant_id=variant.id,
        size="Large",
        quantity=10,
        in_stock=True,
    )
    db.session.add(size)

    addr = Address(
        id="test-address-id",
        user_id=customer.id,
        governorate="Cairo",
        district="Nasr City",
        details="Block 1",
        is_default=True,
    )
    db.session.add(addr)

    now = datetime.utcnow()
    coupon = Coupon(
        id="test-coupon-id",
        code="SAVE10",
        discount_type="percentage",
        discount_value=10.0,
        max_uses=100,
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=30),
        status="active",
    )
    db.session.add(coupon)

    db.session.commit()


class TestApiEndpoints(unittest.TestCase):
    """Critical endpoints: login, products, categories, orders create, coupon validate, admin products/categories."""

    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        app.config["TESTING"] = True

    def setUp(self):
        with app.app_context():
            db.drop_all()
            db.create_all()
            seed_test_data()
        self._admin_token = None
        self._customer_token = None

    def _login_admin(self):
        if self._admin_token is None:
            r = self.client.post(
                "/api/auth/login",
                data=json.dumps({"phone": "0000000000"}),
                content_type="application/json",
            )
            self.assertEqual(r.status_code, 200)
            self._admin_token = r.json["token"]
        return self._admin_token

    def _login_customer(self):
        if self._customer_token is None:
            r = self.client.post(
                "/api/auth/login",
                data=json.dumps({"phone": "01111111111"}),
                content_type="application/json",
            )
            self.assertEqual(r.status_code, 200)
            self._customer_token = r.json["token"]
        return self._customer_token

    def test_login_required_phone(self):
        r = self.client.post(
            "/api/auth/login",
            data=json.dumps({}),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn("message", r.json)

    def test_login_success_returns_token(self):
        r = self.client.post(
            "/api/auth/login",
            data=json.dumps({"phone": "01111111111"}),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("token", r.json)
        self.assertIn("user", r.json)
        self.assertEqual(r.json["user"]["phone"], "01111111111")

    def test_get_products_no_args(self):
        r = self.client.get("/api/products")
        self.assertEqual(r.status_code, 200)
        self.assertIn("products", r.json)
        self.assertIn("total", r.json)
        self.assertIn("pages", r.json)
        self.assertIn("currentPage", r.json)

    def test_get_products_with_args(self):
        r = self.client.get(
            "/api/products?category=ac&sort=price-asc&page=1&minPrice=100&maxPrice=50000"
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("products", r.json)
        self.assertIsInstance(r.json["products"], list)

    def test_get_product_by_id(self):
        r = self.client.get("/api/products/test-product-id")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json["id"], "test-product-id")
        self.assertEqual(r.json["code"], "COD-000001")

    def test_get_product_by_code(self):
        r = self.client.get("/api/products/COD-000001")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json["code"], "COD-000001")

    def test_get_categories(self):
        r = self.client.get("/api/categories")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json, list)
        self.assertTrue(any(c["slug"] == "ac" for c in r.json))

    def test_get_category_by_slug(self):
        r = self.client.get("/api/categories/ac")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json["slug"], "ac")

    def test_get_profile_requires_auth(self):
        r = self.client.get("/api/profile")
        self.assertIn(r.status_code, (401, 403))

    def test_get_profile_with_token(self):
        token = self._login_customer()
        r = self.client.get(
            "/api/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("phone", r.json)
        self.assertIn("addresses", r.json)

    def test_post_orders_requires_auth(self):
        r = self.client.post(
            "/api/orders",
            data=json.dumps({"items": []}),
            content_type="application/json",
        )
        self.assertIn(r.status_code, (401, 403))

    def test_post_orders_missing_items_returns_400(self):
        token = self._login_customer()
        r = self.client.post(
            "/api/orders",
            data=json.dumps({}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn("message", r.json)

    def test_post_orders_empty_items_returns_400(self):
        token = self._login_customer()
        r = self.client.post(
            "/api/orders",
            data=json.dumps({"items": []}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(r.status_code, 400)

    def test_post_orders_with_items_and_address(self):
        token = self._login_customer()
        r = self.client.post(
            "/api/orders",
            data=json.dumps(
                {
                    "items": [
                        {
                            "variant_id": "test-variant-id",
                            "size": "Large",
                            "quantity": 1,
                        }
                    ],
                    "addressId": "test-address-id",
                    "paymentMethod": "cod",
                }
            ),
            content_type="application/json",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(r.status_code, 201)
        self.assertIn("order", r.json)
        self.assertIn("total", r.json["order"])
        self.assertIn("status", r.json["order"])

    def test_post_coupons_validate_requires_auth(self):
        r = self.client.post(
            "/api/coupons/validate",
            data=json.dumps({"code": "SAVE10", "subtotal": 1000}),
            content_type="application/json",
        )
        self.assertIn(r.status_code, (401, 403))

    def test_post_coupons_validate_success(self):
        token = self._login_customer()
        r = self.client.post(
            "/api/coupons/validate",
            data=json.dumps({"code": "SAVE10", "subtotal": 1000}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json.get("valid"))
        self.assertEqual(r.json.get("code"), "SAVE10")
        self.assertIn("discountAmount", r.json)

    def test_get_admin_products_requires_admin(self):
        token = self._login_customer()
        r = self.client.get(
            "/api/admin/products",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(r.status_code, 403)

    def test_get_admin_products_with_token(self):
        token = self._login_admin()
        r = self.client.get(
            "/api/admin/products?search=Test&sort=newest&page=1",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("products", r.json)
        self.assertIn("summary", r.json)

    def test_get_admin_categories_with_token(self):
        token = self._login_admin()
        r = self.client.get(
            "/api/admin/categories",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.json, list)
        self.assertTrue(any(c["slug"] == "ac" for c in r.json))

    def test_get_admin_orders_invalid_start_date_returns_400(self):
        token = self._login_admin()
        r = self.client.get(
            "/api/admin/orders?startDate=not-a-date",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn("message", r.json)


if __name__ == "__main__":
    unittest.main()
