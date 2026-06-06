#!/usr/bin/env python3
"""
Scrape all image/media resources from hvarstore.com.
Crawls every page (sitemap + recursive link following), extracts all assets,
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
import sys
import os
from collections import deque
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://hvarstore.com"
OUTPUT_DIR = pathlib.Path("hvarstore-assets")
MANIFEST_PATH = OUTPUT_DIR / "manifest.csv"
DELAY = 0.3  # seconds between page requests (polite)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; HvarScraper/1.0; +internal)",
    "Accept-Language": "ar,en;q=0.9",
}

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".avif", ".ico"}
ASSET_EXTS = IMAGE_EXTS | {".mp4", ".pdf", ".woff", ".woff2", ".ttf"}

session = requests.Session()
session.headers.update(HEADERS)


def normalize(url: str, base: str = BASE_URL) -> str | None:
    """Resolve relative → absolute, strip fragments, reject external."""
    try:
        full = urllib.parse.urljoin(base, url.strip())
        parsed = urllib.parse.urlparse(full)
        if parsed.scheme not in ("http", "https"):
            return None
        # keep only same-domain
        if parsed.netloc and BASE_URL.split("//")[-1] not in parsed.netloc:
            return None
        # drop fragment
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
    # append hash fragment to avoid collisions
    h = hashlib.md5(url.encode()).hexdigest()[:8]
    stem = pathlib.Path(name).stem[:60]
    ext = pathlib.Path(name).suffix or ".bin"
    return f"{stem}_{h}{ext}"


def extract_urls_from_html(html: str, page_url: str) -> tuple[set[str], set[str]]:
    """
    Returns (page_links, asset_urls).
    page_links: internal HTML pages to crawl
    asset_urls: downloadable resources
    """
    soup = bs4.BeautifulSoup(html, "html.parser")
    pages: set[str] = set()
    assets: set[str] = set()

    # --- img tags ---
    for img in soup.find_all("img"):
        for attr in ("src", "data-src", "data-lazy-src", "data-original"):
            val = img.get(attr)
            if val:
                u = normalize(str(val), page_url)
                if u:
                    assets.add(u)
        # srcset: "url 1x, url 2x" or "url 480w, url 800w"
        srcset = str(img.get("srcset") or img.get("data-srcset") or "")
        for part in srcset.split(","):
            part = part.strip().split()[0] if part.strip() else ""
            if part:
                u = normalize(part, page_url)
                if u:
                    assets.add(u)

    # --- source tags (picture / video) ---
    for src in soup.find_all("source"):
        for attr in ("src", "srcset", "data-srcset"):
            val = str(src.get(attr) or "")
            for part in val.split(","):
                part = part.strip().split()[0] if part.strip() else ""
                if part:
                    u = normalize(part, page_url)
                    if u:
                        assets.add(u)

    # --- og:image / twitter:image meta ---
    for meta in soup.find_all("meta"):
        prop = str(meta.get("property") or "") + str(meta.get("name") or "")
        if "image" in prop.lower():
            content = str(meta.get("content") or "")
            if content:
                u = normalize(content, page_url)
                if u:
                    assets.add(u)

    # --- link[rel=icon/apple-touch-icon] ---
    for link in soup.find_all("link", rel=True):
        rel_val = link.get("rel") or []
        rels = " ".join(rel_val if isinstance(rel_val, list) else [str(rel_val)])
        if "icon" in rels or "image" in rels:
            href = str(link.get("href") or "")
            if href:
                u = normalize(href, page_url)
                if u:
                    assets.add(u)

    # --- inline style background-image ---
    for tag in soup.find_all(style=True):
        matches = re.findall(r'url\(["\']?(.*?)["\']?\)', str(tag.get("style") or ""))
        for m in matches:
            u = normalize(m, page_url)
            if u:
                assets.add(u)

    # --- <style> blocks ---
    for style in soup.find_all("style"):
        matches = re.findall(r'url\(["\']?(.*?)["\']?\)', style.get_text())
        for m in matches:
            u = normalize(m, page_url)
            if u:
                assets.add(u)

    # --- internal page links ---
    for a in soup.find_all("a", href=True):
        href = str(a.get("href") or "")
        u = normalize(href, page_url)
        if u and file_ext(u) not in ASSET_EXTS:
            pages.add(u)

    # filter assets to known media types
    assets = {u for u in assets if file_ext(u) in ASSET_EXTS or not file_ext(u)}

    return pages, assets


def extract_from_sitemap(url: str = f"{BASE_URL}/sitemap.xml") -> set[str]:
    print(f"  [sitemap] {url}")
    try:
        r = session.get(url, timeout=15)
        r.raise_for_status()
        soup = bs4.BeautifulSoup(r.text, "xml")
        locs = {loc.text.strip() for loc in soup.find_all("loc")}
        # recurse into sitemap index
        sub_sitemaps = [u for u in locs if "sitemap" in u.lower() and u.endswith(".xml")]
        page_urls = locs - set(sub_sitemaps)
        for sub in sub_sitemaps:
            page_urls |= extract_from_sitemap(sub)
        print(f"  [sitemap] {len(page_urls)} URLs found")
        return page_urls
    except Exception as e:
        print(f"  [sitemap] failed: {e}")
        return set()


def crawl_all_pages() -> tuple[set[str], set[str]]:
    """BFS crawl. Returns (all_pages_visited, all_asset_urls)."""
    seed_pages = extract_from_sitemap()
    seed_pages.add(BASE_URL + "/")

    visited_pages: set[str] = set()
    all_assets: set[str] = set()
    queue: deque[str] = deque(seed_pages)

    while queue:
        url = queue.popleft()
        if url in visited_pages:
            continue
        visited_pages.add(url)

        print(f"  [crawl] {url}")
        try:
            r = session.get(url, timeout=20)
            if "text/html" not in r.headers.get("content-type", ""):
                continue
            r.raise_for_status()
        except Exception as e:
            print(f"    !! {e}")
            continue

        new_pages, assets = extract_urls_from_html(r.text, url)
        all_assets |= assets

        for p in new_pages:
            if p not in visited_pages:
                queue.append(p)

        time.sleep(DELAY)

    print(f"\n  [crawl] {len(visited_pages)} pages · {len(all_assets)} assets found")
    return visited_pages, all_assets


def download_asset(url: str, source_pages: list[str]) -> dict:
    subdir = asset_subdir(url)
    dest_dir = OUTPUT_DIR / subdir
    dest_dir.mkdir(parents=True, exist_ok=True)
    filename = safe_filename(url)
    dest = dest_dir / filename

    status = "skipped"
    size = 0

    if not dest.exists():
        try:
            r = session.get(url, timeout=30, stream=True)
            r.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in r.iter_content(8192):
                    f.write(chunk)
            size = dest.stat().st_size
            status = "ok"
        except Exception as e:
            status = f"error: {e}"
    else:
        size = dest.stat().st_size
        status = "cached"

    return {
        "url": url,
        "file": str(dest.relative_to(OUTPUT_DIR)),
        "type": subdir,
        "size_bytes": size,
        "status": status,
        "source_page": source_pages[0] if source_pages else "",
    }


def main():
    print(f"=== Hvar Store Asset Scraper ===")
    print(f"Target : {BASE_URL}")
    print(f"Output : {OUTPUT_DIR.resolve()}\n")

    OUTPUT_DIR.mkdir(exist_ok=True)

    # track which pages each asset appeared on
    asset_sources: dict[str, list[str]] = {}

    # ---- crawl ----
    visited_pages, all_assets = crawl_all_pages()

    # simple: assign source as the page we found it on (good enough)
    for asset in all_assets:
        asset_sources.setdefault(asset, []).append(BASE_URL)

    # ---- download ----
    print(f"\n=== Downloading {len(all_assets)} assets ===\n")
    results = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {
            pool.submit(download_asset, url, asset_sources.get(url, [])): url
            for url in all_assets
        }
        done = 0
        for future in as_completed(futures):
            done += 1
            result = future.result()
            results.append(result)
            status_icon = "✓" if result["status"] in ("ok", "cached") else "✗"
            print(f"  [{done}/{len(all_assets)}] {status_icon} {result['file']} ({result['size_bytes']:,}b)")

    # ---- manifest ----
    with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["url", "file", "type", "size_bytes", "status", "source_page"])
        writer.writeheader()
        writer.writerows(sorted(results, key=lambda x: x["type"]))

    ok = sum(1 for r in results if r["status"] in ("ok", "cached"))
    total_bytes = sum(r["size_bytes"] for r in results)
    print(f"\n=== Done ===")
    print(f"  Assets downloaded : {ok}/{len(results)}")
    print(f"  Total size        : {total_bytes / 1_048_576:.1f} MB")
    print(f"  Manifest          : {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
