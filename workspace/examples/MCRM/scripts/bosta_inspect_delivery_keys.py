#!/usr/bin/env python3
"""
Inspect live Bosta API payload shape (business + optional search) for converter alignment.

Usage:
  python scripts/bosta_inspect_delivery_keys.py [tracking ...]
  python scripts/bosta_inspect_delivery_keys.py 84768544 29897290 86658272

Env: BOSTA_TOKEN or BOSTA_API_KEY

Writes optional JSON snapshot next to script: bosta_inspect_last.json (no secrets — raw delivery only).
"""
from __future__ import annotations

import json
import os
import sys
from typing import Any

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

env_path = os.path.join(ROOT, ".env")
if os.path.exists(env_path):
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

import requests  # noqa: E402

from app.utils.bosta_converter import (  # noqa: E402
    convert_bosta_order,
    _description_from_return_specs,
)

BASE = "https://app.bosta.co/api/v2"


def _headers() -> dict:
    token = os.environ.get("BOSTA_TOKEN") or os.environ.get("BOSTA_API_KEY")
    if not token:
        raise SystemExit("Set BOSTA_TOKEN or BOSTA_API_KEY in .env")
    return {
        "Accept": "application/json, text/plain, */*",
        "Authorization": token,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }


def fetch_business_raw(tid: str) -> tuple[dict | None, int]:
    h = _headers()
    r = requests.get(f"{BASE}/deliveries/business/{tid}", headers=h, timeout=20)
    if r.status_code != 200:
        return None, r.status_code
    body = r.json()
    data = body.get("data", body)
    return (data if isinstance(data, dict) else None), r.status_code


def fetch_search_raw(tid: str) -> tuple[dict | None, int]:
    h = _headers()
    payload = {"limit": 5, "page": 1, "sortBy": "-updatedAt", "trackingNumbers": [tid]}
    r = requests.post(f"{BASE}/deliveries/search", headers=h, json=payload, timeout=20)
    if r.status_code != 200:
        return None, r.status_code
    j = r.json()
    dels = j.get("data", {}).get("deliveries") or j.get("deliveries") or []
    for d in dels:
        if isinstance(d, dict) and d.get("trackingNumber") == tid:
            return d, r.status_code
    if len(dels) == 1 and isinstance(dels[0], dict):
        return dels[0], r.status_code
    return None, r.status_code


def tree_keys(obj: Any, prefix: str = "", depth: int = 0, max_depth: int = 4) -> list[str]:
    """Flat list of dot-paths for dict nesting (for discovery)."""
    out: list[str] = []
    if depth > max_depth:
        return out
    if isinstance(obj, dict):
        for k, v in sorted(obj.items(), key=lambda x: str(x[0])):
            p = f"{prefix}.{k}" if prefix else str(k)
            out.append(p)
            out.extend(tree_keys(v, p, depth + 1, max_depth))
    elif isinstance(obj, list) and obj and depth < max_depth:
        out.extend(tree_keys(obj[0], f"{prefix}[0]", depth + 1, max_depth))
    return out


def summarize_block(name: str, d: dict | None) -> None:
    print(f"\n--- {name} ---")
    if not isinstance(d, dict):
        print("  (missing or not a dict)")
        return
    print(f"  keys ({len(d)}): {sorted(d.keys())}")
    for k in sorted(d.keys()):
        v = d[k]
        if isinstance(v, dict):
            print(f"  [{k}] dict keys: {sorted(v.keys())}")
            for sk2, sv2 in v.items():
                if isinstance(sv2, dict):
                    print(f"    [{k}.{sk2}] dict keys: {sorted(sv2.keys())[:20]}{'...' if len(sv2) > 20 else ''}")


def inspect_one(tid: str) -> None:
    print("\n" + "=" * 72)
    print(f"TRACKING: {tid}")
    print("=" * 72)

    business, http_b = fetch_business_raw(tid)
    search, http_s = fetch_search_raw(tid)

    if not business and not search:
        print(f"BUSINESS HTTP {http_b}, SEARCH HTTP {http_s} — no data")
        return

    source = business or search
    if not source:
        return

    print(f"  source: {'GET /deliveries/business' if business else 'POST /deliveries/search'}")
    if business and search:
        print(f"  also: search HTTP {http_s} (compare wallet / keys below)")

    tinfo = source.get("type")
    if isinstance(tinfo, dict):
        print(f"  type.code: {tinfo.get('code')}  type.value: {tinfo.get('value')}")

    print(f"\n  top-level keys ({len(source)}): {sorted(source.keys())}")

    summarize_block("specs", source.get("specs") if isinstance(source.get("specs"), dict) else None)
    summarize_block("returnSpecs", source.get("returnSpecs") if isinstance(source.get("returnSpecs"), dict) else None)

    rs = source.get("returnSpecs") if isinstance(source.get("returnSpecs"), dict) else {}
    if rs:
        # Strings that look like product descriptions (short preview)
        print("\n  --- returnSpecs text fields (preview) ---")
        for path in tree_keys(rs, "returnSpecs", max_depth=5):
            if any(x in path.lower() for x in ("desc", "note", "name", "product")):
                parts = path.split(".")
                cur: Any = rs
                try:
                    for p in parts[1:]:
                        if p.endswith("]"):
                            cur = cur[0]
                        else:
                            cur = cur[p]
                    if isinstance(cur, str) and cur.strip():
                        preview = cur.strip()[:120] + ("..." if len(cur) > 120 else "")
                        print(f"    {path}: {preview!r}")
                except Exception:
                    pass

        extracted = _description_from_return_specs(rs)
        print(f"\n  _description_from_return_specs(): {extracted[:160]!r}..." if len(extracted) > 160 else f"\n  _description_from_return_specs(): {extracted!r}")

    # Search vs business: key set diff
    if business and search:
        bk, sk = set(business.keys()), set(search.keys())
        only_b = sorted(bk - sk)
        only_s = sorted(sk - bk)
        if only_b:
            print(f"\n  keys only on BUSINESS (not search): {only_b[:30]}{'...' if len(only_b) > 30 else ''}")
        if only_s:
            print(f"  keys only on SEARCH (not business): {only_s[:30]}{'...' if len(only_s) > 30 else ''}")

    # Unified converter
    try:
        unified = convert_bosta_order({"success": True, "data": source})
        pkg = unified.get("package") or {}
        fin = unified.get("financial") or {}
        print("\n  --- convert_bosta_order() ---")
        print(f"    package.description: {str(pkg.get('description', ''))[:200]!r}")
        print(f"    package.itemsCount: {pkg.get('itemsCount')}")
        print(f"    financial.cod: {fin.get('cod')}  feesSource: {fin.get('feesSource')}")
    except Exception as e:
        print(f"\n  convert_bosta_order ERROR: {e}")

    # Save last raw business snapshot (no token in file)
    out_path = os.path.join(os.path.dirname(__file__), "bosta_inspect_last.json")
    try:
        snapshot = {
            "tracking": tid,
            "endpoint": "business" if business else "search",
            "raw": business if business else search,
        }
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, ensure_ascii=False, indent=2)
        print(f"\n  (last snapshot written: {out_path})")
    except OSError as e:
        print(f"\n  (could not write snapshot: {e})")


def main() -> int:
    argv = [a.strip() for a in sys.argv[1:] if a.strip()]
    if not argv:
        argv = ["84768544", "29897290"]

    print("Bosta delivery structure inspector")
    print("Default trackings: Customer Return Pickup + Send (same customer context in your tests)")

    for tid in argv:
        try:
            inspect_one(tid)
        except requests.RequestException as e:
            print(f"\n{tid}: HTTP error {e}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
