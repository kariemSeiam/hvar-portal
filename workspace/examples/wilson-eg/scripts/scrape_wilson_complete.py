#!/usr/bin/env python3
"""
Wilson Egypt Complete Scraper
- Fetches ALL products from WooCommerce API
- Downloads ALL product images locally
- Updates JSON with local paths
- Full independence from old site

Run: python scripts/scrape_wilson_complete.py
"""
import os
import sys
import json
import requests
import hashlib
from pathlib import Path
from urllib.parse import urlparse
import time

# Config
BASE_URL = "https://wilson-eg.com"
API_ENDPOINT = f"{BASE_URL}/wp-json/wc/store/v1/products"
OUTPUT_DIR = Path(__file__).parent.parent / "docs"
IMAGES_DIR = Path(__file__).parent.parent / "uploads" / "products"
OUTPUT_JSON = OUTPUT_DIR / "wilson-complete-data-with-images.json"

# Create directories
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def fetch_all_products():
    """Fetch all products from WooCommerce API with pagination."""
    print("📦 Fetching products from WooCommerce API...")
    
    all_products = []
    page = 1
    per_page = 50
    
    while True:
        params = {
            "per_page": per_page,
            "page": page,
            "orderby": "date",
            "order": "desc"
        }
        
        try:
            response = requests.get(API_ENDPOINT, params=params, timeout=30)
            response.raise_for_status()
            products = response.json()
            
            if not products:
                break
            
            all_products.extend(products)
            print(f"  ✓ Page {page}: {len(products)} products (total: {len(all_products)})")
            
            # Check if we got less than per_page (last page)
            if len(products) < per_page:
                break
            
            page += 1
            time.sleep(0.5)  # Be nice to the server
            
        except requests.exceptions.RequestException as e:
            print(f"  ✗ Error fetching page {page}: {e}")
            break
    
    return all_products


def download_image(url, product_id, image_type="main"):
    """Download an image and return the local path."""
    if not url:
        return None
    
    try:
        # Generate unique filename
        parsed = urlparse(url)
        original_name = os.path.basename(parsed.path)
        ext = os.path.splitext(original_name)[1] or ".png"
        
        # Use hash to avoid conflicts
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        filename = f"{product_id}_{image_type}_{url_hash}{ext}"
        local_path = IMAGES_DIR / filename
        
        # Skip if already downloaded
        if local_path.exists():
            print(f"    ✓ Already exists: {filename}")
            return f"uploads/products/{filename}"
        
        # Download
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        with open(local_path, "wb") as f:
            f.write(response.content)
        
        print(f"    ✓ Downloaded: {filename}")
        return f"uploads/products/{filename}"
        
    except Exception as e:
        print(f"    ✗ Failed to download {url}: {e}")
        return None


def process_product(product):
    """Process a single product from WooCommerce API."""
    product_id = product.get("id")
    name = product.get("name", "")
    
    print(f"\n  [{product_id}] {name[:50]}...")
    
    # Extract price
    prices = product.get("prices", {})
    price_minor = int(prices.get("price", 0))
    price = price_minor / 100  # WooCommerce stores in minor units
    
    regular_price_minor = int(prices.get("regular_price", price_minor))
    regular_price = regular_price_minor / 100
    
    sale_price_minor = int(prices.get("sale_price", price_minor))
    sale_price = sale_price_minor / 100
    
    # Determine category from name or slug
    category = "home_appliances"
    name_lower = name.lower()
    slug = product.get("slug", "").lower()
    
    if "فريزر" in name or "freezer" in name_lower or "freezer" in slug:
        category = "freezers"
    elif "كوك" in name or "بوتاجاز" in name or "cooker" in name_lower or "stove" in name_lower:
        category = "stoves"
    elif "مبرد" in name or "cooler" in name_lower or "cooler" in slug:
        category = "water_coolers"
    elif "مكنسة" in name or "vacuum" in name_lower or "vacuum" in slug:
        category = "vacuum_cleaners"
    elif "خلاط" in name or "blender" in name_lower or "blender" in slug:
        category = "blenders"
    elif "تلفزيون" in name or "شاشة" in name or "tv" in name_lower or "television" in name_lower:
        category = "tvs"
    
    # Parse description for specs
    description = product.get("description", "")
    specs = parse_description_for_specs(description, name)
    
    # Download images
    images_data = product.get("images", [])
    downloaded_images = []
    main_image_path = None
    thumbnail_path = None
    
    for idx, img in enumerate(images_data):
        img_type = "main" if idx == 0 else f"gallery_{idx}"
        
        # Download main image
        src = img.get("src")
        if src:
            local_path = download_image(src, product_id, img_type)
            if local_path:
                downloaded_images.append({
                    "original_url": src,
                    "local_path": local_path,
                    "type": img_type
                })
                if idx == 0:
                    main_image_path = local_path
        
        # Download thumbnail separately if different
        thumbnail = img.get("thumbnail")
        if thumbnail and thumbnail != src:
            thumb_path = download_image(thumbnail, product_id, f"thumb_{idx}")
            if thumb_path and idx == 0:
                thumbnail_path = thumb_path
    
    # Use main image as thumbnail if not downloaded separately
    if not thumbnail_path and main_image_path:
        thumbnail_path = main_image_path
    
    # Build final product object
    processed = {
        "id": product_id,
        "name_ar": name,
        "name_en": extract_english_name(name),
        "price": price,
        "regular_price": regular_price,
        "sale_price": sale_price if sale_price < regular_price else None,
        "price_formatted": f"{price:,.0f} EGP",
        "status": "in_stock" if product.get("is_in_stock") else "out_of_stock",
        "category": category,
        "rating": float(product.get("average_rating", 0)),
        "reviews": int(product.get("review_count", 0)),
        "description": description,
        "specs": specs,
        "images": downloaded_images,
        "thumbnail": thumbnail_path,
        "main_image": main_image_path,
        "sku": product.get("sku", ""),
        "slug": product.get("slug", ""),
        "permalink": product.get("permalink", ""),
    }
    
    return processed


def parse_description_for_specs(description, name):
    """Parse HTML description to extract specs."""
    import re
    
    specs = {}
    
    # Clean HTML
    text = re.sub(r'<br\s*/?>', '\n', description)
    text = re.sub(r'</?p[^>]*>', '\n', text)
    text = re.sub(r'<strong>([^<]+)</strong>', r'\1', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = text.strip()
    
    # Extract model from name
    model_match = re.search(r'[A-Z]{1,3}-?[A-Z0-9]{2,6}', name.upper())
    if model_match:
        specs["model"] = model_match.group()
    
    # Parse lines
    features = []
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        
        # Look for key-value patterns
        if ':' in line:
            parts = line.split(':', 1)
            key = parts[0].strip()
            value = parts[1].strip() if len(parts) > 1 else ""
            
            key_lower = key.lower()
            
            if "موديل" in key or "model" in key_lower:
                specs["model"] = value or specs.get("model", "")
            elif "ضمان" in key or "warranty" in key_lower:
                specs["warranty"] = value
            elif "سعة" in key or "capacity" in key_lower:
                specs["capacity"] = value
            elif "قدرة" in key or "power" in key_lower:
                specs["power"] = value
            elif "بعد" in key or "أبعاد" in key or "dimension" in key_lower or "مقاس" in key:
                specs["dimensions"] = value
            elif "لون" in key or "color" in key_lower:
                specs["color"] = value
            else:
                features.append(line)
        else:
            # It's a feature
            if len(line) > 3:
                features.append(line)
    
    if features:
        specs["features"] = features[:15]  # Limit to 15 features
    
    return specs


def extract_english_name(name):
    """Extract English name from Arabic/English mixed name."""
    import re
    
    # Try to find English words
    english_parts = re.findall(r'[A-Z]{2,}[A-Z0-9\-]*', name.upper())
    if english_parts:
        return " ".join(english_parts)
    
    # Fallback: just the model number
    model_match = re.search(r'[A-Z]{1,3}-?[A-Z0-9]{2,6}', name.upper())
    if model_match:
        return f"Wilson {model_match.group()}"
    
    return name


def main():
    print("=" * 60)
    print("🐙 Wilson Egypt Complete Scraper")
    print("=" * 60)
    
    # Fetch all products
    raw_products = fetch_all_products()
    
    if not raw_products:
        print("\n✗ No products found!")
        sys.exit(1)
    
    print(f"\n✓ Total products fetched: {len(raw_products)}")
    
    # Process each product
    print("\n📥 Processing products and downloading images...")
    processed_products = []
    
    for product in raw_products:
        try:
            processed = process_product(product)
            processed_products.append(processed)
        except Exception as e:
            print(f"\n  ✗ Error processing product {product.get('id')}: {e}")
    
    # Build final JSON
    output = {
        "meta": {
            "site": "wilson-eg.com",
            "company": "Wilson (ويلسن)",
            "extraction_date": time.strftime("%Y-%m-%d"),
            "currency": "EGP (Egyptian Pound)",
            "platform": "WordPress + WooCommerce",
            "images": "downloaded_locally",
            "total_products": len(processed_products),
        },
        "summary": {
            "total_products": len(processed_products),
            "with_images": sum(1 for p in processed_products if p.get("images")),
            "categories": list(set(p["category"] for p in processed_products)),
        },
        "products": processed_products
    }
    
    # Save JSON
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'=' * 60}")
    print(f"✅ COMPLETE!")
    print(f"{'=' * 60}")
    print(f"  Products: {len(processed_products)}")
    print(f"  With images: {output['summary']['with_images']}")
    print(f"  JSON saved: {OUTPUT_JSON}")
    print(f"  Images saved: {IMAGES_DIR}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
