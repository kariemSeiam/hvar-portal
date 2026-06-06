#!/usr/bin/env python3
"""
Full site scrape of hvarstore.com — discovers ALL product pages by enumerating
listing pagination, then extracts unique image URLs from each product page.
"""

import requests
import bs4
import urllib.parse
import hashlib
import csv
import pathlib
import re
import json
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError

BASE_URL = "https://hvarstore.com"
OUTPUT_DIR = pathlib.Path("hvarstore-assets")
PRODUCTS_FILE = OUTPUT_DIR / "all_product_urls.txt"
MANIFEST_PATH = OUTPUT_DIR / "manifest.csv"
MAX_LISTING_PAGES = 200   # safety cap per listing
WORKERS = 8

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}

session = requests.Session()
session.headers.update(HEADERS)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".avif", ".ico"}
ASSET_EXTS = IMAGE_EXTS | {".mp4", ".pdf", ".woff", ".woff2", ".ttf"}


# ── helpers ────────────────────────────────────────────────────────────────────

def normalize(url: str, base: str = BASE_URL) -> str | None:
    try:
        full = urllib.parse.urljoin(base, url.strip())
        parsed = urllib.parse.urlparse(full)
        if parsed.scheme not in ("http", "https"):
            return None
        host = urllib.parse.urlparse(BASE_URL).netloc
        if parsed.netloc and host not in parsed.netloc:
            return None
        return urllib.parse.urlunparse(parsed._replace(fragment=""))
    except Exception:
        return None


def file_ext(url: str) -> str:
    return pathlib.Path(urllib.parse.urlparse(url).path).suffix.lower()


def safe_filename(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    name = pathlib.Path(parsed.path).name or "index"
    h = hashlib.md5(url.encode()).hexdigest()[:8]
    stem = pathlib.Path(name).stem[:80]
    ext = pathlib.Path(name).suffix or ".bin"
    return f"{stem}_{h}{ext}"


# ── Phase 1: discover all listing (category) pages ─────────────────────────────

# Known product pages (not listing pages) — skip enumeration for these
KNOWN_PRODUCT_SLUGS = {
    "katyl-byrks-hfar-2-ltr", "aagan-hfar-11-ltr", "aagan-hfar-7-ltr",
    "hand-blndr-hfar-21-bko-1500-oat", "hand-blndr-hfar-1500-oat-2",
    "hand-blndr-hfar-31-bko-1500-oat", "khlat-hfar-25-ltr", "khlat-hfar-8000-oat-71",
    "kbh-hfar-5070-qfie8-qvvam", "kbh-hfar-1200-oat-abyd", "kb-hfar-3-ltr-800-oat-trbo-51",
    "mdrb-byd-500-oat", "mdrb-byd-3", "mkns-hfar-2000-oat-trbo",
    "klay-hoayy-9-ltr-dygytal-2-hytr-hfar", "klay-hoayy-65-ltr-dygytal-hfar",
}
# Listing page slugs (have pagination)
LISTING_SLUGS = {"frn-hfar", "mkoah-bkhar-hfar"}

def is_listing_page(path: str) -> bool:
    """True if this is a listing page that may have pagination."""
    m = re.match(r"^/(product|category|search|flash-deals)/([^/?]+)", path)
    if not m:
        return False
    kind, slug = m.group(1), m.group(2)
    if kind == "category":
        return True
    if kind == "product":
        return slug in LISTING_SLUGS
    return False

def find_listing_pages() -> set[str]:
    """Crawl homepage + /categories to find all listing URLs to enumerate."""
    pages: set[str] = set()
    for seed in [BASE_URL + "/", BASE_URL + "/categories"]:
        try:
            r = session.get(seed, timeout=15)
            soup = bs4.BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", href=True):
                href = str(a.get("href", ""))
                u = normalize(href, seed)
                if not u:
                    continue
                path = urllib.parse.urlparse(u).path
                if is_listing_page(path):
                    if "{" not in path and not re.search(r"[?&]page=\d+", u):
                        pages.add(u)
        except Exception as e:
            print(f"  !! seed {seed}: {e}")
    print(f"  found {len(pages)} listing pages to enumerate")
    return pages


def find_direct_product_urls() -> set[str]:
    """Get all individual product URLs from homepage + categories page."""
    products: set[str] = set()
    for seed in [BASE_URL + "/", BASE_URL + "/categories"]:
        try:
            r = session.get(seed, timeout=15)
            soup = bs4.BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", href=True):
                href = str(a.get("href", ""))
                u = normalize(href, seed)
                if not u:
                    continue
                path = urllib.parse.urlparse(u).path
                m = re.match(r"^/product/([^/?]+)", path)
                if m and m.group(1) not in LISTING_SLUGS:
                    if "{" not in path and "page=" not in u:
                        products.add(u)
        except Exception as e:
            print(f"  !! seed {seed}: {e}")
    print(f"  found {len(products)} direct product URLs")
    return products


# ── Phase 2: enumerate all product URLs from listing pagination ────────────────

def enumerate_product_urls(listing_url: str) -> set[str]:
    """Iterate paginated listing pages and return all unique product URLs found."""
    products: set[str] = set()
    base = listing_url.split("?")[0]
    prev_count = 0

    for page_num in range(1, MAX_LISTING_PAGES + 1):
        url = f"{base}?page={page_num}"
        try:
            r = session.get(url, timeout=15)
            if r.status_code != 200:
                break
            soup = bs4.BeautifulSoup(r.text, "html.parser")
            new = 0
            for a in soup.find_all("a", href=True):
                href = str(a.get("href", ""))
                u = normalize(href, url)
                if not u:
                    continue
                path = urllib.parse.urlparse(u).path
                m = re.match(r"^/product/([^/?]+)", path)
                if m and u not in products:
                    products.add(u)
                    new += 1
            # break when page has zero new products (not a listing, or end of pagination)
            if new == 0 and page_num > 1:
                break
            prev_count = new
        except Exception as e:
            print(f"    !! {base} page {page_num}: {e}")
            break

    return products


# ── Phase 3: extract image URLs from a product page ────────────────────────────

def extract_assets_from_product(product_url: str) -> set[str]:
    """Return all image/asset URLs from one product page."""
    assets: set[str] = set()
    try:
        r = session.get(product_url, timeout=20)
        if r.status_code != 200:
            return assets
        soup = bs4.BeautifulSoup(r.text, "html.parser")

        # all img elements — src, data-src, srcset, data-srcset
        for img in soup.find_all("img"):
            for attr in ("src", "data-src", "data-lazy-src"):
                val = img.get(attr)
                if val:
                    u = normalize(str(val), product_url)
                    if u and (file_ext(u) in IMAGE_EXTS or "/uploads/" in u):
                        assets.add(u)
            for srcset_attr in ("srcset", "data-srcset"):
                val = str(img.get(srcset_attr) or "")
                for part in val.split(","):
                    token = part.strip().split()[0] if part.strip() else ""
                    if token:
                        u = normalize(token, product_url)
                        if u and (file_ext(u) in IMAGE_EXTS or "/uploads/" in u):
                            assets.add(u)

        # source tags
        for src in soup.find_all("source"):
            for attr in ("src", "srcset"):
                val = str(src.get(attr) or "")
                for part in val.split(","):
                    token = part.strip().split()[0] if part.strip() else ""
                    if token:
                        u = normalize(token, product_url)
                        if u:
                            assets.add(u)

        # meta og:image / twitter:image
        for meta in soup.find_all("meta"):
            prop = str(meta.get("property") or "") + str(meta.get("name") or "")
            if "image" in prop.lower():
                content = str(meta.get("content") or "")
                if content:
                    u = normalize(content, product_url)
                    if u:
                        assets.add(u)

        # style background-image
        for tag in soup.find_all(style=True):
            for m in re.findall(r'url\(["\']?(.*?)["\']?\)', str(tag.get("style") or "")):
                u = normalize(m, product_url)
                if u:
                    assets.add(u)

        # <style> blocks
        for style in soup.find_all("style"):
            for m in re.findall(r'url\(["\']?(.*?)["\']?\)', style.get_text()):
                u = normalize(m, product_url)
                if u:
                    assets.add(u)

        # link icons
        for link in soup.find_all("link", rel=True):
            rel_val = link.get("rel") or []
            rels = " ".join(rel_val if isinstance(rel_val, list) else [str(rel_val)])
            if "icon" in rels:
                href = str(link.get("href") or "")
                if href:
                    u = normalize(href, product_url)
                    if u:
                        assets.add(u)

    except Exception as e:
        print(f"    !! extract {product_url}: {e}")

    # filter to known types
    return {u for u in assets if file_ext(u) in ASSET_EXTS or "/uploads/" in u}


# ── Phase 4: download ─────────────────────────────────────────────────────────

def download(url: str) -> dict:
    subdir = "images" if file_ext(url) in IMAGE_EXTS else "other"
    dest_dir = OUTPUT_DIR / subdir
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = safe_filename(url)
    dest = dest_dir / filename

    if dest.exists():
        return {"url": url, "file": str(dest.relative_to(OUTPUT_DIR)),
                "type": subdir, "size": dest.stat().st_size, "status": "cached"}

    try:
        r = session.get(url, timeout=30, stream=True)
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
        size = dest.stat().st_size
        return {"url": url, "file": str(dest.relative_to(OUTPUT_DIR)),
                "type": subdir, "size": size, "status": "ok"}
    except Exception as e:
        return {"url": url, "file": "", "type": subdir, "size": 0, "status": f"err: {e}"}


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== HvarStore Full Asset Scraper ===\n")
    OUTPUT_DIR.mkdir(exist_ok=True)

    # ── Phase 1: find all product URLs ──
    print("── Phase 1: Finding all product URLs ──")
    
    # 1a: direct product URLs from homepage + categories
    all_products: set[str] = find_direct_product_urls()
    
    # 1b: known product slugs from previous crawl
    for slug in KNOWN_PRODUCT_SLUGS:
        all_products.add(f"{BASE_URL}/product/{slug}")
    
    # 1c: enumerate listing pages for paginated products
    listings = find_listing_pages()
    print(f"\n── Phase 1c: Enumerating products from {len(listings)} listings ──")
    for i, listing in enumerate(sorted(listings)):
        print(f"  [{i+1}/{len(listings)}] {listing}")
        prods = enumerate_product_urls(listing)
        all_products |= prods
        print(f"    → {len(prods)} products found (total: {len(all_products)})")

    # save product list
    with open(PRODUCTS_FILE, "w") as f:
        for p in sorted(all_products):
            f.write(p + "\n")
    print(f"\n  TOTAL: {len(all_products)} unique product URLs saved to {PRODUCTS_FILE}")

    # ── Phase 3: extract assets from product pages ──
    print(f"\n── Phase 3: Extracting assets from {len(all_products)} product pages ──")
    all_assets: set[str] = set()
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(extract_assets_from_product, url): url for url in all_products}
        done = 0
        for fut in as_completed(futures):
            done += 1
            assets = fut.result()
            all_assets |= assets
            if done % 10 == 0 or done == len(all_products):
                print(f"  [{done}/{len(all_products)}] {len(all_assets)} unique assets so far")

    print(f"\n  TOTAL: {len(all_assets)} unique asset URLs")

    # ── Phase 4: download ──
    print(f"\n── Phase 4: Downloading {len(all_assets)} assets ──")
    results = []
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {pool.submit(download, url): url for url in all_assets}
        done = 0
        for fut in as_completed(futures):
            done += 1
            r = fut.result()
            results.append(r)
            if done % 20 == 0 or done == len(all_assets):
                icon = "✓" if r["status"] in ("ok", "cached") else "✗"
                print(f"  [{done}/{len(all_assets)}] {icon} {r['file'] or r['url']}  ({r['size']:,}b)")

    with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["url", "file", "type", "size", "status"])
        writer.writeheader()
        writer.writerows(sorted(results, key=lambda x: (x["type"], x["file"])))

    ok = sum(1 for r in results if r["status"] in ("ok", "cached"))
    total_mb = sum(r["size"] for r in results) / 1_048_576
    print(f"\n=== Done ===")
    print(f"  Products    : {len(all_products)}")
    print(f"  Assets      : {ok}/{len(results)} downloaded")
    print(f"  Total size  : {total_mb:.1f} MB")
    print(f"  Manifest    : {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
