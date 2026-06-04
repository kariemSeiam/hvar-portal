#!/usr/bin/env python3
"""
Compare COD (and Bosta fees) between two Bosta shipments.

Uses the same convert_bosta_order() as the backend, so numbers match Hub / cards.

Identifiers: pass Bosta *tracking numbers* (e.g. HVR-... or full tracking string).
Dashboard URLs like https://business.bosta.co/orders/20005668 use an internal id;
that number is often NOT the tracking — copy the tracking from the order page if this fails.

Usage:
  python scripts/bosta_compare_cod.py <tracking_a> <tracking_b>
  python scripts/bosta_compare_cod.py HVR-260314-12345 HVR-260315-67890

Env:
  BOSTA_TOKEN or BOSTA_API_KEY (same as app)
"""
from __future__ import annotations

import json
import os
import sys

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

from app.utils.bosta_converter import convert_bosta_order  # noqa: E402

BASE = "https://app.bosta.co/api/v2"


def _headers() -> dict:
    token = os.environ.get("BOSTA_TOKEN") or os.environ.get("BOSTA_API_KEY")
    if not token:
        raise SystemExit("Set BOSTA_TOKEN or BOSTA_API_KEY")
    return {
        "Accept": "application/json, text/plain, */*",
        "Authorization": token,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }


def _fetch_raw(tracking_or_id: str) -> dict:
    """Return Bosta `data` dict (inner payload) or raise."""
    tid = str(tracking_or_id).strip()
    h = _headers()

    r = requests.get(f"{BASE}/deliveries/business/{tid}", headers=h, timeout=15)
    if r.status_code == 200:
        body = r.json()
        data = body.get("data", body)
        if isinstance(data, dict):
            return data

    payload = {"limit": 5, "page": 1, "sortBy": "-updatedAt", "trackingNumbers": [tid]}
    r2 = requests.post(f"{BASE}/deliveries/search", headers=h, json=payload, timeout=15)
    if r2.status_code != 200:
        raise RuntimeError(f"business+search failed: HTTP {r.status_code} / {r2.status_code}")

    j = r2.json()
    deliveries = j.get("data", {}).get("deliveries") or j.get("deliveries") or []
    for d in deliveries:
        if not isinstance(d, dict):
            continue
        if d.get("trackingNumber") == tid:
            return d
    if len(deliveries) == 1 and isinstance(deliveries[0], dict):
        return deliveries[0]

    raise RuntimeError(f"No delivery found for {tid!r} (use tracking from Bosta, not dashboard id if this persists)")


def _raw_financial_snapshot(data: dict) -> dict:
    wallet = data.get("wallet") if isinstance(data.get("wallet"), dict) else {}
    cc = wallet.get("cashCycle") if isinstance(wallet.get("cashCycle"), dict) else {}
    pricing = data.get("pricing") if isinstance(data.get("pricing"), dict) else {}
    return {
        "trackingNumber": data.get("trackingNumber"),
        "_id": data.get("_id"),
        "type": data.get("type"),
        "cashCycle_cod": cc.get("cod"),
        "cashCycle_bosta_fees": cc.get("bosta_fees"),
        "cashCycle_vat": cc.get("vat"),
        "top_level_cod": data.get("cod"),
        "shipmentFees": data.get("shipmentFees"),
        "pricing_deliveryFees": pricing.get("deliveryFees"),
        "pricing_shipmentFees": pricing.get("shipmentFees"),
        "pricing_total": pricing.get("total"),
    }


def _analyze(label: str, tid: str) -> tuple[dict, dict]:
    raw = _fetch_raw(tid)
    unified = convert_bosta_order({"success": True, "data": raw})
    fin = unified.get("financial") or {}
    snap = _raw_financial_snapshot(raw)
    print(f"\n=== {label}: input={tid!r} ===")
    print("Raw (API fields used by converter):")
    print(json.dumps(snap, ensure_ascii=False, indent=2))
    print("Unified (same as app cards: financial.cod + fees net/gross):")
    print(json.dumps(fin, ensure_ascii=False, indent=2))
    return fin, snap


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__.strip())
        return 2

    a, b = sys.argv[1].strip(), sys.argv[2].strip()
    fin_a, _ = _analyze("Order A", a)
    fin_b, _ = _analyze("Order B", b)

    def fnum(x):
        try:
            return float(x) if x is not None and x != "" else 0.0
        except (TypeError, ValueError):
            return 0.0

    cod_a = fnum(fin_a.get("cod"))
    cod_b = fnum(fin_b.get("cod"))
    fee_a = fnum(fin_a.get("bostaFees"))
    fee_b = fnum(fin_b.get("bostaFees"))
    fee_net_a = fnum(fin_a.get("bostaFeesNet"))
    fee_net_b = fnum(fin_b.get("bostaFeesNet"))
    fee_gross_a = fnum(fin_a.get("bostaFeesGross") or fin_a.get("bostaFees"))
    fee_gross_b = fnum(fin_b.get("bostaFeesGross") or fin_b.get("bostaFees"))

    print("\n=== DIFFERENCE (B - A) ===")
    print(f"  COD:         {cod_b:,.2f} - {cod_a:,.2f} = {cod_b - cod_a:,.2f} EGP")
    print(f"  Bosta fees (legacy): {fee_b:,.2f} - {fee_a:,.2f} = {fee_b - fee_a:,.2f} EGP")
    print(f"  Bosta fees net:      {fee_net_b:,.2f} - {fee_net_a:,.2f} = {fee_net_b - fee_net_a:,.2f} EGP")
    print(f"  Bosta fees gross:    {fee_gross_b:,.2f} - {fee_gross_a:,.2f} = {fee_gross_b - fee_gross_a:,.2f} EGP")
    print(
        "\nNote: Negative COD on returns/exchanges means money direction (out vs in) "
        "in Bosta cash cycle; same sign rules as Hub."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
