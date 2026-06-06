#!/usr/bin/env python3
"""
Scrape all image/media resources from hvarstore.com.
Crawls every page (categories + products), extracts all assets,
downloads them organized by type, outputs a manifest CSV.
"""

import requests
import bs4
import urllib.parse
import hashlib
import csv
import pathlib
import time
import re
from collections import deque
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://hvarstore.com"
OUTPUT_DIR = pathlib.Path("hvarstore-assets")
MANIFEST_PATH = OUTPUT_DIR / "manifest.csv"
DELAY = 0.25   # seconds between page requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "ar,en;q=0.9",
}

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".avif", ".ico"}
ASSET_EXTS = IMAGE_EXTS | {".mp4", ".pdf", ".woff", ".woff2", ".ttf"}

# URL patterns worth crawling — only first page, no pagination
CRAWL_PATTERNS = re.compile(r"/(category|product|categories|flash-deals|search|brand)(/|$|\?)")

# URL patterns to never crawl — skip pagination, auth, junk
SKIP_PATTERNS = re.compile(
    r"/(logout|login|register|password|social-login|dashboard|wishlists|compare|cart|checkout|terms|privacy|contact|sitemap)"
)
PAGINATION_RE = re.compile(r"(?:^|[?&])page=\d+")

MAX_PAGES = 2000  # safety cap

session = requests.Session()
session.headers.update(HEADERS)


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
    path = urllib.parse.urlparse(url).path
    return pathlib.Path(path).suffix.lower()


def asset_subdir(url: str) -> str:
    ext = file_ext(url)
    if ext in IMAGE_EXTS:
        return "images"
    if ext in {".woff", ".woff2", ".ttf"}:
        return "fonts"
    if ext == ".mp4":
        return "video"
    return "other"


def safe_filename(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    name = pathlib.Path(parsed.path).name or "index"
    h = hashlib.md5(url.encode()).hexdigest()[:8]
    stem = pathlib.Path(name).stem[:60]
    ext = pathlib.Path(name).suffix or ".bin"
    return f"{stem}_{h}{ext}"


# ── html extraction ────────────────────────────────────────────────────────────

def extract(html: str, page_url: str) -> tuple[set[str], set[str]]:
    """Returns (page_links_to_crawl, asset_urls)."""
    soup = bs4.BeautifulSoup(html, "html.parser")
    pages: set[str] = set()
    assets: set[str] = set()

    # img tags
    for img in soup.find_all("img"):
        for attr in ("src", "data-src", "data-lazy-src", "data-original"):
            val = img.get(attr)
            if val:
                u = normalize(str(val), page_url)
                if u:
                    assets.add(u)
        srcset = str(img.get("srcset") or img.get("data-srcset") or "")
        for part in srcset.split(","):
            token = part.strip().split()[0] if part.strip() else ""
            if token:
                u = normalize(token, page_url)
                if u:
                    assets.add(u)

    # source (picture / video)
    for src in soup.find_all("source"):
        for attr in ("src", "srcset", "data-srcset"):
            val = str(src.get(attr) or "")
            for part in val.split(","):
                token = part.strip().split()[0] if part.strip() else ""
                if token:
                    u = normalize(token, page_url)
                    if u:
                        assets.add(u)

    # og:image / twitter:image meta
    for meta in soup.find_all("meta"):
        prop = str(meta.get("property") or "") + str(meta.get("name") or "")
        if "image" in prop.lower():
            content = str(meta.get("content") or "")
            if content:
                u = normalize(content, page_url)
                if u:
                    assets.add(u)

    # link icons / apple-touch-icon
    for link in soup.find_all("link", rel=True):
        rel_val = link.get("rel") or []
        rels = " ".join(rel_val if isinstance(rel_val, list) else [str(rel_val)])
        if "icon" in rels or "image" in rels:
            href = str(link.get("href") or "")
            if href:
                u = normalize(href, page_url)
                if u:
                    assets.add(u)

    # inline style background-image
    for tag in soup.find_all(style=True):
        for m in re.findall(r'url\(["\']?(.*?)["\']?\)', str(tag.get("style") or "")):
            u = normalize(m, page_url)
            if u:
                assets.add(u)

    # <style> blocks
    for style in soup.find_all("style"):
        for m in re.findall(r'url\(["\']?(.*?)["\']?\)', style.get_text()):
            u = normalize(m, page_url)
            if u:
                assets.add(u)

    # internal page links worth crawling
    for a in soup.find_all("a", href=True):
        href = str(a.get("href") or "")
        u = normalize(href, page_url)
        if not u:
            continue
        if file_ext(u) in ASSET_EXTS:
            assets.add(u)
            continue
        parsed = urllib.parse.urlparse(u)
        if PAGINATION_RE.search(parsed.query):
            continue
        # skip unrendered template literals like {route('compare')}
        if "{" in parsed.path or "{" in parsed.query:
            continue
        if CRAWL_PATTERNS.search(parsed.path) and not SKIP_PATTERNS.search(parsed.path):
            pages.add(u)

    # filter assets to known media extensions or /uploads/ paths
    assets = {
        u for u in assets
        if file_ext(u) in ASSET_EXTS or "/uploads/" in u
    }

    return pages, assets


# ── crawl ─────────────────────────────────────────────────────────────────────

SEED_URLS = [
    BASE_URL + "/",
    BASE_URL + "/categories",
    BASE_URL + "/flash-deals",
]


def crawl() -> set[str]:
    visited: set[str] = set()
    all_assets: set[str] = set()
    queue: deque[str] = deque(SEED_URLS)

    while queue and len(visited) < MAX_PAGES:
        url = queue.popleft()
        if url in visited:
            continue
        # skip paginated URLs at crawl time too
        if PAGINATION_RE.search(urllib.parse.urlparse(url).query):
            continue
        visited.add(url)

        try:
            r = session.get(url, timeout=20)
            ct = r.headers.get("content-type", "")
            if "text/html" not in ct:
                continue
            r.raise_for_status()
        except Exception as e:
            print(f"  !! {url} — {e}")
            continue

        new_pages, assets = extract(r.text, url)
        all_assets |= assets

        added = 0
        for p in new_pages:
            if p not in visited:
                queue.append(p)
                added += 1

        print(f"  [crawl {len(visited)}/{MAX_PAGES}] {url}  +{len(assets)} assets  +{added} pages")
        time.sleep(DELAY)

    print(f"\n  crawl done: {len(visited)} pages · {len(all_assets)} assets\n")
    return all_assets


# ── download ──────────────────────────────────────────────────────────────────

def download(url: str) -> dict:
    subdir = asset_subdir(url)
    dest_dir = OUTPUT_DIR / subdir
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = safe_filename(url)
    dest = dest_dir / filename

    if dest.exists():
        return {"url": url, "file": str(dest.relative_to(OUTPUT_DIR)),
                "type": subdir, "size_bytes": dest.stat().st_size, "status": "cached"}

    try:
        r = session.get(url, timeout=30, stream=True)
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
        size = dest.stat().st_size
        return {"url": url, "file": str(dest.relative_to(OUTPUT_DIR)),
                "type": subdir, "size_bytes": size, "status": "ok"}
    except Exception as e:
        return {"url": url, "file": "", "type": subdir, "size_bytes": 0, "status": f"err: {e}"}


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"=== Hvar Store Asset Scraper ===")
    print(f"Target : {BASE_URL}")
    print(f"Output : {OUTPUT_DIR.resolve()}\n")
    OUTPUT_DIR.mkdir(exist_ok=True)

    all_assets = crawl()

    print(f"=== Downloading {len(all_assets)} assets (6 workers) ===\n")
    results = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(download, url): url for url in all_assets}
        done = 0
        for fut in as_completed(futures):
            done += 1
            r = fut.result()
            results.append(r)
            icon = "✓" if r["status"] in ("ok", "cached") else "✗"
            print(f"  [{done}/{len(all_assets)}] {icon} {r['file'] or r['url']}  ({r['size_bytes']:,}b)  {r['status']}")

    with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["url", "file", "type", "size_bytes", "status"])
        writer.writeheader()
        writer.writerows(sorted(results, key=lambda x: (x["type"], x["file"])))

    ok = sum(1 for r in results if r["status"] in ("ok", "cached"))
    total_mb = sum(r["size_bytes"] for r in results) / 1_048_576
    print(f"\n=== Done ===")
    print(f"  Downloaded : {ok}/{len(results)}")
    print(f"  Total size : {total_mb:.1f} MB")
    print(f"  Manifest   : {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
