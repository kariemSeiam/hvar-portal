#!/usr/bin/env python3
"""
Wilson Egypt Seeder - Complete Reset
Clears DB and loads all 29 products with images from the scraped JSON.

Run: python scripts/seed_wilson_reset.py
"""
import os
import sys
import json

# Add project root to path
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_ROOT, 'project', 'backend'))

from app import app, db
from app import Product, ProductFeature, ProductVariant, VariantSize, VariantImage


def clear_database():
    """Clear all products and related data."""
    print("🗑️  Clearing database...")
    
    # Delete in correct order (cascade should handle it, but explicit is safer)
    try:
        VariantImage.query.delete()
        VariantSize.query.delete()
        ProductVariant.query.delete()
        ProductFeature.query.delete()
        Product.query.delete()
        db.session.commit()
        print("   ✓ Database cleared\n")
    except Exception as e:
        db.session.rollback()
        print(f"   ✗ Error clearing: {e}")
        sys.exit(1)


def load_products():
    """Load products from JSON."""
    json_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "docs",
        "wilson-complete-with-images.json"
    )
    
    if not os.path.exists(json_path):
        print(f"✗ JSON not found: {json_path}")
        sys.exit(1)
    
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    return data.get("products", [])


def category_label_ar(category):
    """Get Arabic category label."""
    labels = {
        "freezers": "الفريزرات",
        "stoves": "البوتاجازات",
        "water_coolers": "مبردات المياه",
        "vacuum_cleaners": "المكانس الكهربائية",
        "blenders": "الخلاطات",
        "tvs": "الشاشات",
        "home_appliances": "الأجهزة المنزلية",
    }
    return labels.get(category, "أجهزة منزلية")


def seed_products(products_data):
    """Seed all products with images."""
    print(f"📦 Seeding {len(products_data)} products...\n")
    
    used_codes = set()
    
    for i, p in enumerate(products_data, start=1):
        # Generate unique code from specs.model or ID
        model = p.get("specs", {}).get("model", "")
        if model:
            base_code = model.replace(" ", "-").upper()
        else:
            base_code = f"WILSON-{p.get('id', i)}"
        
        # Ensure unique code
        code = base_code
        suffix = 1
        while code in used_codes:
            code = f"{base_code}-{suffix}"
            suffix += 1
        used_codes.add(code)
        
        # Prices
        base_price = float(p.get("regular_price") or p.get("price", 0))
        sale_price = p.get("sale_price")
        discount_price = None
        tag = None
        
        if sale_price and float(sale_price) < base_price:
            discount_price = float(sale_price)
            tag = "عرض"
        
        # Status
        status = "active" if p.get("status") == "in_stock" else "out_of_stock"
        
        # Category
        category = p.get("category", "home_appliances")
        
        # Names
        name_ar = p.get("name_ar", "")
        name_en = p.get("name_en", name_ar)
        
        # Create product
        product = Product(
            code=code,
            product_number=i,
            name=name_ar or name_en,
            name_ar=name_ar or None,
            name_en=name_en or None,
            description=name_ar,  # Use Arabic name as description for now
            description_ar=name_ar or None,
            description_en=name_en or None,
            category=category,
            base_price=base_price,
            discount_price=discount_price,
            tag=tag,
            tag_color="success" if tag else None,
            rating=float(p.get("rating", 0) or 0),
            rating_count=int(p.get("reviews", 0) or 0),
            status=status,
        )
        
        # Add features from specs
        specs = p.get("specs", {})
        if isinstance(specs.get("features"), list):
            for feat in specs["features"][:10]:  # Max 10 features
                if feat and len(feat) > 2:
                    product.features.append(ProductFeature(
                        feature=feat,
                        feature_ar=feat,
                        feature_en=feat,
                    ))
        
        # Create variant with images
        variant = ProductVariant(
            color_name="افتراضي",
            color_code="#6B7280",  # Gray
        )
        
        # Add images
        images = p.get("images", [])
        for img in images:
            img_path = img.get("local_path", "")
            if img_path:
                # Convert to URL format expected by frontend
                img_url = f"/{img_path}" if not img_path.startswith("/") else img_path
                variant.images.append(VariantImage(image_url=img_url))
        
        # Add size (single item for appliances)
        qty = 10 if status == "active" else 0
        variant.sizes.append(VariantSize(
            size="واحد",
            quantity=qty,
            in_stock=qty > 0,
        ))
        
        product.variants.append(variant)
        db.session.add(product)
        
        # Progress
        print(f"  {i:2}. {code:15} | {name_ar[:35]:35} | {base_price:>8,.0f} EGP | {status}")
    
    db.session.commit()
    print(f"\n✅ Seeded {len(products_data)} products successfully!")


def main():
    print("=" * 70)
    print("🐙 Wilson Egypt - Database Reset & Seed")
    print("=" * 70)
    print()
    
    with app.app_context():
        # Clear database
        clear_database()
        
        # Load JSON
        products = load_products()
        
        if not products:
            print("✗ No products found in JSON!")
            sys.exit(1)
        
        print(f"📄 Loaded {len(products)} products from JSON\n")
        
        # Seed
        seed_products(products)
        
        print()
        print("=" * 70)
        print("🎉 COMPLETE!")
        print("=" * 70)


if __name__ == "__main__":
    main()
