#!/usr/bin/env python3
# scripts/inspect_erp_response.py
"""Inspect raw ERP draft-dt response: full structure, keys, sample rows."""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT))

from app.api.erp_api import ERPAuth, ERP_BASE_URL
from app.api.call_center_api import _build_erp_draft_params


def _inspect_value(v, depth=0, max_len=200):
    """Return a readable summary of a value for inspection."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return str(v)
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, str):
        s = repr(v) if len(v) > max_len else v
        return s[:max_len] + ("..." if len(str(v)) > max_len else "")
    if isinstance(v, dict):
        return {k: _inspect_value(x, depth + 1, max_len) for k, x in list(v.items())[:15]}
    if isinstance(v, list):
        return [_inspect_value(x, depth + 1, max_len) for x in v[:5]]
    return str(type(v))


def main():
    parser = argparse.ArgumentParser(description="Inspect raw ERP draft-dt response")
    parser.add_argument("-u", "--username", required=True)
    parser.add_argument("-p", "--password", required=True)
    parser.add_argument("--start-date", default="2026-01-01")
    parser.add_argument("--end-date", default="2026-12-31")
    parser.add_argument("-o", "--output", help="Save raw JSON to file")
    parser.add_argument("--no-print", action="store_true", help="Only save, don't print")
    args = parser.parse_args()

    erp_auth = ERPAuth(args.username, args.password)
    params = _build_erp_draft_params(args.start_date, args.end_date)
    url = f"{ERP_BASE_URL}/sells/draft-dt"
    resp = erp_auth.fetch_with_auth(url, params)

    if resp.status_code != 200:
        print(f"ERP returned {resp.status_code}")
        sys.exit(1)

    j = resp.json()

    # Save raw if requested
    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(j, f, indent=2, ensure_ascii=False)
        print(f"Raw JSON saved to {out_path}")

    if args.no_print:
        return

    # Top-level structure
    print("\n" + "=" * 70)
    print("ERP RESPONSE TOP-LEVEL KEYS")
    print("=" * 70)
    for k in sorted(j.keys()):
        v = j[k]
        t = type(v).__name__
        if isinstance(v, list):
            print(f"  {k}: list, len={len(v)}")
        elif isinstance(v, dict):
            print(f"  {k}: dict, keys={list(v.keys())[:10]}")
        else:
            print(f"  {k}: {t}")

    rows = j.get("data") or j.get("aaData") or []
    print(f"\nRows source: {'data' if j.get('data') else 'aaData'} (or empty)")
    print(f"Row count: {len(rows)}")

    if not rows:
        print("\nNo rows.")
        return

    # First row: full shape
    r0 = rows[0]
    print("\n" + "=" * 70)
    print("FIRST ROW — TYPE & STRUCTURE")
    print("=" * 70)
    print(f"Type: {type(r0).__name__}")

    if isinstance(r0, dict):
        print("\nKeys (all):")
        for k in sorted(r0.keys()):
            v = r0[k]
            t = type(v).__name__
            preview = ""
            if v is not None and v != "":
                sv = str(v)
                preview = sv[:80] + ("..." if len(sv) > 80 else "")
            print(f"  {k}: {t} = {repr(preview)[:100]}")
        print("\nFull first row (inspect):")
        print(json.dumps(_inspect_value(r0), indent=2, ensure_ascii=False))
    else:
        print(f"Length: {len(r0)}")
        print("Values by index:")
        for i, v in enumerate(r0[:20]):
            print(f"  [{i}]: {type(v).__name__} = {repr(str(v))[:80]}")
        print("\nFull first row (raw):")
        print(json.dumps(r0, indent=2, default=str, ensure_ascii=False)[:2000])

    # Second row (maybe different structure)
    if len(rows) > 1:
        r1 = rows[1]
        print("\n" + "=" * 70)
        print("SECOND ROW — KEYS (if dict)")
        print("=" * 70)
        if isinstance(r1, dict):
            for k in sorted(r1.keys()):
                v = r1[k]
                preview = str(v)[:60] if v else ""
                print(f"  {k}: {preview}")
        else:
            print(f"Array, len={len(r1)}")

    # Check for contacts / mobile
    print("\n" + "=" * 70)
    print("MOBILE / CONTACTS INSPECTION")
    print("=" * 70)
    if isinstance(r0, dict):
        mobile = r0.get("mobile")
        contacts = r0.get("contacts")
        whatsapp = r0.get("whatsapp")
        print(f"  mobile:   {repr(mobile)}")
        print(f"  whatsapp: {repr(whatsapp)}")
        print(f"  contacts: {type(contacts).__name__} = {repr(contacts)}")
        if isinstance(contacts, dict):
            print(f"    contacts keys: {list(contacts.keys())}")
            for k, v in contacts.items():
                print(f"    contacts.{k}: {repr(v)[:80]}")
    print("=" * 70)


if __name__ == "__main__":
    main()
