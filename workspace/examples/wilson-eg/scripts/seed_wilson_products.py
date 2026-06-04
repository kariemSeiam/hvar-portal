#!/usr/bin/env python3
"""
Seed Wilson Egypt backend with scraped product data from wilson-complete-data.json.
Run from project root: python scripts/seed_wilson_products.py
"""
import os
import sys
import json
import re
import uuid
from itertools import zip_longest

# Add project root to path
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_ROOT, 'project', 'backend'))

from sqlalchemy import text
from app import app, db
from app import Product, ProductFeature, ProductVariant, VariantSize


def ensure_columns():
    """Add name_ar, name_en, description_ar, description_en (product) and feature_ar, feature_en (product_feature) if missing (SQLite migration)."""
    conn = db.engine.connect()
    try:
        result = conn.execute(text("PRAGMA table_info(product)"))
        columns = [row[1] for row in result]
        if 'name_ar' not in columns:
            conn.execute(text("ALTER TABLE product ADD COLUMN name_ar VARCHAR(200)"))
            conn.commit()
        if 'name_en' not in columns:
            conn.execute(text("ALTER TABLE product ADD COLUMN name_en VARCHAR(200)"))
            conn.commit()
        if 'description_ar' not in columns:
            conn.execute(text("ALTER TABLE product ADD COLUMN description_ar TEXT"))
            conn.commit()
        if 'description_en' not in columns:
            conn.execute(text("ALTER TABLE product ADD COLUMN description_en TEXT"))
            conn.commit()

        result = conn.execute(text("PRAGMA table_info(product_feature)"))
        pf_columns = [row[1] for row in result]
        if 'feature_ar' not in pf_columns:
            conn.execute(text("ALTER TABLE product_feature ADD COLUMN feature_ar VARCHAR(200)"))
            conn.commit()
        if 'feature_en' not in pf_columns:
            conn.execute(text("ALTER TABLE product_feature ADD COLUMN feature_en VARCHAR(200)"))
            conn.commit()
    except Exception as e:
        print(f"Note: {e}")
    finally:
        conn.close()


def specs_to_description(specs: dict) -> tuple[str, str]:
    """Build description_ar and description_en from specs dict."""
    if not specs:
        return "", ""
    key_ar = {"model": "الموديل", "capacity": "السعة", "power": "القدرة", "warranty": "الضمان",
              "design": "التصميم", "motor": "المحرك", "dimensions": "الأبعاد", "burners": "الشعلات",
              "oven": "الفرن", "control": "التحكم", "safety": "الأمان", "materials": "المواد",
              "speeds": "السرعات", "attachments": "الملحقات", "bowl": "الوعاء", "blades": "الشفرات",
              "keys": "المفاتيح", "color": "اللون", "turbo": "توربو", "oven_safety": "أمان الفرن"}
    parts_ar = []
    parts_en = []
    for k, v in specs.items():
        if k == "features" and isinstance(v, list):
            if v:
                parts_ar.append("المميزات: " + "، ".join(v))
                parts_en.append("Features: " + ", ".join(v))
        elif v and k != "features":
            val_str = ", ".join(str(x) for x in v) if isinstance(v, list) else str(v)
            parts_ar.append(f"{key_ar.get(k, k)}: {val_str}")
            parts_en.append(f"{k}: {val_str}")
    return "\n".join(parts_ar), "\n".join(parts_en)


# Wilson persona-aligned name overrides (id -> (name_ar, name_en)). See docs/brand/product-copy-rules.md.
NAME_OVERRIDES_BY_ID = {
    1756: ("كوك برو ويلسون امان كامل استانلس", "Wilson Full-Safety Gas Cooker W-ST90MS"),
    1752: ("كوك برو ويلسون امان كامل اسود سطح استانلس", "Wilson Full-Safety Gas Cooker W-ST90MB (Black)"),
    1660: ("فلام ماكس ويلسون فانشورى اسود سطح استانلس", "Wilson Flame Max Gas Cooker W-ST90FB"),
    1662: ("فلام ماكس ويلسون غرف استانلس", "Wilson Flame Max Gas Cooker W-ST90C"),
    1659: ("فلام ماكس ويلسون فانشورى استانلس", "Wilson Flame Max Gas Cooker W-ST90FS"),
    1658: ("كوك زون ويلسون نصف امان اسود سطح استانلس", "Wilson Cooker Zone Half-Safety W-ST90HMB (Black)"),
    1657: ("كوك زون ويلسون نصف امان استانلس", "Wilson Cooker Zone Half-Safety W-ST90HMS"),
    1618: ("مضرب بيض ويلسون فردي", "Wilson Egg Beater (Single)"),
    1611: ("مضرب بيض ويلسون بالعجان", "Wilson Egg Beater with Mixer"),
    1609: ("مبرد مياه ويلسون مع حافظة داخلية أسود", "Wilson Water Cooler with Fridge WDB 1001 (Black)"),
    1606: ("مبرد مياه ويلسون بثلاجة داخلية سيلفر", "Wilson Water Cooler with Fridge WDS 1002 (Silver)"),
    1428: ("مبرد مياه ويلسون مع ثلاجة داخلية أسود", "Wilson Water Cooler with Fridge WDB 1002 (Black)"),
    1393: ("مبرد مياه ويلسون بحافظة داخلية سيلفر", "Wilson Water Cooler with Fridge WDS 1001 (Silver)"),
    1429: ("مكنسة ويلسون كهربائية 2500 وات", "Wilson Vacuum Cleaner 2500W WV 2500"),
    1388: ("مكنسة ويلسون كهربائية 2100 وات", "Wilson Vacuum Cleaner 2100W WV 2100"),
    1731: ("هاند بليندر ويلسون WH1300", "Wilson Hand Blender WH1300"),
    1725: ("هاند بليندر ويلسون WH1200", "Wilson Hand Blender WH1200"),
}


def name_without_code(name: str, code: str) -> str:
    """Remove SKU/code from name so the title is clean and SKU is shown only in its own field."""
    if not name or not code:
        return name
    out = name.strip()
    c = code.strip()
    # Trailing: " WF240", " - WF240", " (WF240)"
    out = re.sub(rf"[\s\-–—(（]{re.escape(c)}$", "", out, flags=re.IGNORECASE).strip()
    # Leading: "WF240 ", "W-ST90MS "
    out = re.sub(rf"^{re.escape(c)}[\s\-–—)\）]?\s*", "", out, flags=re.IGNORECASE).strip()
    return out or name


def specs_to_features(specs: dict) -> tuple[list[str], list[str]]:
    """Extract feature strings for AR and EN. JSON has EN-only features; we duplicate for both until AR content exists."""
    if not specs:
        return [], []
    features_ar = []
    features_en = []
    # Warranty
    if specs.get("warranty"):
        features_ar.append(f"ضمان: {specs['warranty']}")
        features_en.append(f"Warranty: {specs['warranty']}")
    # Model
    if specs.get("model"):
        features_ar.append(f"الموديل: {specs['model']}")
        features_en.append(f"Model: {specs['model']}")
    # Flatten features list (EN in JSON; use for both for now)
    if isinstance(specs.get("features"), list):
        for f in specs["features"]:
            features_ar.append(str(f))
            features_en.append(str(f))
    # Key spec pairs
    for k, v in specs.items():
        if k in ("features", "warranty", "model"):
            continue
        if v and not isinstance(v, list):
            key_ar = {"model": "الموديل", "capacity": "السعة", "power": "القدرة", "warranty": "الضمان",
                      "design": "التصميم", "motor": "المحرك", "dimensions": "الأبعاد", "burners": "الشعلات",
                      "oven": "الفرن", "control": "التحكم", "safety": "الأمان", "materials": "المواد"}.get(k, k)
            features_ar.append(f"{key_ar}: {v}")
            features_en.append(f"{k}: {v}")
        elif v and isinstance(v, list) and k != "features":
            val = ", ".join(str(x) for x in v)
            key_ar = {"model": "الموديل", "capacity": "السعة", "dimensions": "الأبعاد"}.get(k, k)
            features_ar.append(f"{key_ar}: {val}")
            features_en.append(f"{k}: {val}")
    limit = 15
    return features_ar[:limit], features_en[:limit]


def main():
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs", "wilson-complete-data.json")
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found")
        sys.exit(1)

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    products_data = data.get("products", [])
    if not products_data:
        print("No products in data file")
        sys.exit(0)

    with app.app_context():
        db.create_all()  # ensure tables exist (e.g. first run before app.py)
        ensure_columns()

        # Clear existing products (cascade will handle variants, features)
        Product.query.delete()
        db.session.commit()

        used_codes = set()
        for i, p in enumerate(products_data, start=1):
            specs = p.get("specs") or {}
            model = specs.get("model", str(p.get("id", i)))
            base_code = model.replace(" ", "-").upper()
            code = base_code
            suffix = 1
            while code in used_codes:
                code = f"{base_code}-{suffix}"
                suffix += 1
            used_codes.add(code)
            override = NAME_OVERRIDES_BY_ID.get(p.get("id"))
            if override:
                name_ar, name_en = override[0], override[1]
            else:
                name_ar = name_without_code(p.get("name_ar", "") or "", code)
                name_en = name_without_code(p.get("name_en", "") or "", code)

            base_price = float(p.get("regular_price") or p.get("price", 0))
            sale_price = p.get("sale_price") or p.get("price")
            discount_price = float(sale_price) if sale_price and float(sale_price) < base_price else None

            status_map = {"in_stock": "active", "out_of_stock": "out_of_stock"}
            status = status_map.get(p.get("status", "in_stock"), "active")

            desc_ar, desc_en = specs_to_description(specs)
            product = Product(
                code=code,
                product_number=i,
                name=name_ar or name_en,
                name_ar=name_ar or None,
                name_en=name_en or None,
                description=desc_ar or desc_en,
                description_ar=desc_ar or None,
                description_en=desc_en or None,
                category=p.get("category", "home_appliances"),
                base_price=base_price,
                discount_price=discount_price,
                tag="عرض" if discount_price else None,
                tag_color="success" if discount_price else None,
                rating=float(p.get("rating", 0) or 0),
                rating_count=int(p.get("reviews", 0) or 0),
                status=status,
            )

            # Features (dual language)
            features_ar, features_en = specs_to_features(specs)
            for ar, en in zip_longest(features_ar, features_en, fillvalue=""):
                product.features.append(ProductFeature(
                    feature=ar or en or "-",
                    feature_ar=ar or None,
                    feature_en=en or None,
                ))

            # Single variant (appliances: one color, one size)
            qty = 10 if status == "active" else 0
            variant = ProductVariant(
                color_name="افتراضي",
                color_code="#6B7280",
            )
            variant.sizes.append(VariantSize(
                size="واحد",
                quantity=qty,
                in_stock=qty > 0,
            ))
            # No images in scraped data - placeholder can be added later
            product.variants.append(variant)

            db.session.add(product)
            print(f"  {i}. {code} | {name_en[:40]} | {p.get('price')} EGP | {status}")

        db.session.commit()
        print(f"\nSeeded {len(products_data)} Wilson products.")


if __name__ == "__main__":
    main()
