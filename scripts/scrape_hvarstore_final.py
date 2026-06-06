#!/usr/bin/env python3
"""
Final comprehensive asset scraper for hvarstore.com.
18 products total confirmed — scrape homepage, categories, flash-deals, and all products.
"""
import requests, bs4, urllib.parse, hashlib, csv, pathlib, re
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = "https://hvarstore.com"
OUT = pathlib.Path("hvarstore-assets")
MANIFEST = OUT / "manifest.csv"
HEADERS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
SEED_URLS = [f"{BASE}/", f"{BASE}/categories", f"{BASE}/flash-deals"]

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".avif", ".ico"}
ASSET_EXTS = IMAGE_EXTS | {".mp4", ".pdf", ".woff", ".woff2", ".ttf"}

session = requests.Session()
session.headers.update(HEADERS)

def norm(url, base=BASE):
    try:
        u = urllib.parse.urljoin(base, url.strip())
        p = urllib.parse.urlparse(u)
        if p.scheme not in ("http", "https"): return None
        if p.netloc and BASE.split("//")[-1] not in p.netloc: return None
        return urllib.parse.urlunparse(p._replace(fragment=""))
    except: return None

def fext(url): return pathlib.Path(urllib.parse.urlparse(url).path).suffix.lower()

def safename(url):
    p = urllib.parse.urlparse(url)
    name = pathlib.Path(p.path).name or "index"
    h = hashlib.md5(url.encode()).hexdigest()[:8]
    return f"{pathlib.Path(name).stem[:80]}_{h}{pathlib.Path(name).suffix or '.bin'}"

def extract(html, page_url):
    soup = bs4.BeautifulSoup(html, "html.parser")
    assets = set()
    for img in soup.find_all("img"):
        for attr in ("src", "data-src", "data-lazy-src"):
            v = img.get(attr)
            if v:
                u = norm(str(v), page_url)
                if u: assets.add(u)
        for sattr in ("srcset", "data-srcset"):
            for part in str(img.get(sattr) or "").split(","):
                tok = part.strip().split()[0] if part.strip() else ""
                if tok:
                    u = norm(tok, page_url)
                    if u: assets.add(u)
    for src in soup.find_all("source"):
        for attr in ("src", "srcset"):
            for part in str(src.get(attr) or "").split(","):
                tok = part.strip().split()[0] if part.strip() else ""
                if tok:
                    u = norm(tok, page_url)
                    if u: assets.add(u)
    for meta in soup.find_all("meta"):
        prop = str(meta.get("property") or "") + str(meta.get("name") or "")
        if "image" in prop.lower():
            c = str(meta.get("content") or "")
            if c:
                u = norm(c, page_url)
                if u: assets.add(u)
    for link in soup.find_all("link", rel=True):
        rv = link.get("rel") or []
        rels = " ".join(rv if isinstance(rv, list) else [str(rv)])
        if "icon" in rels:
            h = str(link.get("href") or "")
            if h:
                u = norm(h, page_url)
                if u: assets.add(u)
    for tag in soup.find_all(style=True):
        for m in re.findall(r'url\(["\']?(.*?)["\']?\)', str(tag.get("style") or "")):
            u = norm(m, page_url)
            if u: assets.add(u)
    for style in soup.find_all("style"):
        for m in re.findall(r'url\(["\']?(.*?)["\']?\)', style.get_text()):
            u = norm(m, page_url)
            if u: assets.add(u)
    return {u for u in assets if fext(u) in ASSET_EXTS or "/uploads/" in u}

def discover_all_urls():
    """BFS from seeds — collect all pages + products."""
    all_products = set()
    all_pages = set()
    queue = list(SEED_URLS)
    seen = set()
    while queue:
        url = queue.pop(0)
        if url in seen: continue
        seen.add(url)
        all_pages.add(url)
        try:
            r = session.get(url, timeout=15)
            if "text/html" not in r.headers.get("content-type", ""): continue
            soup = bs4.BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", href=True):
                h = str(a.get("href", ""))
                u = norm(h, url)
                if not u: continue
                parsed = urllib.parse.urlparse(u)
                path = parsed.path
                qs = parsed.query
                # skip paginated URLs (?page=N)
                if re.search(r"(?:^|[?&])page=", qs):
                    continue
                # product page — strip query, add clean URL
                m = re.match(r"^/product/([^/?]+)", path)
                if m and "{" not in path:
                    clean = f"{BASE}{path}"
                    all_products.add(clean)
                    if clean not in seen: queue.append(clean)
                    continue
                # category / search / flash deals
                if re.search(r"^/(category|search|flash-deals)(/|$)", path):
                    if "{" not in path:
                        if u not in seen: queue.append(u)
        except Exception as e:
            print(f"  !! {url}: {e}")
    return all_pages, all_products

def download(url):
    dest_dir = OUT / ("images" if fext(url) in IMAGE_EXTS else "other")
    dest_dir.mkdir(parents=True, exist_ok=True)
    fn = safename(url)
    dest = dest_dir / fn
    if dest.exists():
        return {"url": url, "file": str(dest.relative_to(OUT)),
                "type": "images", "size": dest.stat().st_size, "status": "cached"}
    try:
        r = session.get(url, timeout=30, stream=True)
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(8192): f.write(chunk)
        return {"url": url, "file": str(dest.relative_to(OUT)),
                "type": "images", "size": dest.stat().st_size, "status": "ok"}
    except Exception as e:
        return {"url": url, "file": "", "type": "images", "size": 0, "status": f"err: {e}"}

def main():
    print("=== HvarStore Complete Asset Scraper ===\n")
    OUT.mkdir(exist_ok=True)

    print("── Phase 1: Discover all pages & products ──")
    all_pages, all_products = discover_all_urls()
    print(f"  Pages: {len(all_pages)} | Products: {len(all_products)}")
    for p in sorted(all_products): print(f"    {p}")
    print()

    print("── Phase 2: Extract assets from all pages ──")
    all_assets = set()
    for url in sorted(all_pages | all_products):
        try:
            r = session.get(url, timeout=15)
            if "text/html" in r.headers.get("content-type", ""):
                assets = extract(r.text, url)
                all_assets |= assets
                print(f"  {len(assets):3d} assets  {url}")
        except Exception as e:
            print(f"  !! {url}: {e}")
    print(f"\n  Total unique assets: {len(all_assets)}\n")

    print("── Phase 3: Download ──")
    results = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        fut = {pool.submit(download, url): url for url in all_assets}
        done = 0
        for f in as_completed(fut):
            done += 1
            r = f.result()
            results.append(r)
            icon = "✓" if r["status"] in ("ok","cached") else "✗"
            if done % 10 == 0 or done == len(all_assets):
                print(f"  [{done}/{len(all_assets)}] {icon} {r['file'] or r['url']}")

    with open(MANIFEST, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["url","file","type","size","status"])
        w.writeheader()
        w.writerows(sorted(results, key=lambda x: (x["type"], x["file"])))

    ok = sum(1 for r in results if r["status"] in ("ok","cached"))
    mb = sum(r["size"] for r in results) / 1_048_576
    print(f"\n=== Done ===")
    print(f"  Pages crawled : {len(all_pages)}")
    print(f"  Products found: {len(all_products)}")
    print(f"  Assets        : {ok}/{len(results)}")
    print(f"  Total size    : {mb:.1f} MB")
    print(f"  Manifest      : {MANIFEST}")

if __name__ == "__main__":
    main()
