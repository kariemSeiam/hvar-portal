#!/usr/bin/env python3
"""List COD and Bosta fees for one or more phones.

Usage:
  python scripts/bosta_cod_fees_report.py 01228013318
  python scripts/bosta_cod_fees_report.py 201003580830 201226635140
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

import requests


def normalize_phone(phone):
    digits = "".join(ch for ch in str(phone) if ch.isdigit())
    if digits.startswith("20") and len(digits) == 12:
        return "0" + digits[2:]
    return digits

def main():
    token = os.environ.get('BOSTA_TOKEN') or os.environ.get('BOSTA_API_KEY')
    if not token:
        print("BOSTA_TOKEN not set")
        return 1
    phones = sys.argv[1:] if len(sys.argv) > 1 else ['01228013318']

    BASE = 'https://app.bosta.co/api/v2'
    headers = {'Accept': 'application/json', 'Authorization': token, 'Content-Type': 'application/json'}

    for phone in phones:
        normalized_phone = normalize_phone(phone)
        resp = requests.post(
            f'{BASE}/deliveries/search',
            headers=headers,
            json={'mobilePhones': [normalized_phone], 'limit': 100, 'page': 1, 'sortBy': '-updatedAt'},
            timeout=15
        )
        if resp.status_code != 200:
            print(f"Phone: {phone} -> search failed: {resp.status_code}")
            continue

        data = resp.json()
        deliveries = data.get('data', {}).get('deliveries') or data.get('deliveries') or []
        print(f"\nPhone: {phone} -> {normalized_phone} - {len(deliveries)} orders\n")
        print("Tracking      | COD (EGP) | Fee Net | VAT 14% | Fee Total | Type")
        print("-" * 82)

        for d in deliveries:
            tr = d.get('trackingNumber', '-')
            cod_val = d.get('cod')
            fee_net_val = d.get('shipmentFees')
            vat_val = None
            fee_total_val = None
            typ = d.get('type', {})
            typ_val = typ.get('value', typ.get('code', '-')) if isinstance(typ, dict) else typ

            if tr:
                try:
                    biz = requests.get(f'{BASE}/deliveries/business/{tr}', headers=headers, timeout=8)
                    if biz.status_code == 200:
                        bd = biz.json().get('data', biz.json())
                        if isinstance(bd, dict):
                            cod_val = bd.get('cod', cod_val)
                            fee_net_val = bd.get('shipmentFees', fee_net_val)
                            w2 = bd.get('wallet', {}) or {}
                            cc2 = w2.get('cashCycle') if isinstance(w2, dict) else None
                            if isinstance(cc2, dict):
                                cod_val = cc2.get('cod') or cod_val
                                vat_val = cc2.get('vat')
                                fee_total_val = cc2.get('bosta_fees')
                except Exception:
                    pass

            try:
                fee_net_num = float(fee_net_val) if fee_net_val not in (None, '') else 0.0
            except (TypeError, ValueError):
                fee_net_num = 0.0
            try:
                vat_num = float(vat_val) if vat_val not in (None, '') else round(fee_net_num * 0.14, 2) if fee_net_num else 0.0
            except (TypeError, ValueError):
                vat_num = round(fee_net_num * 0.14, 2) if fee_net_num else 0.0
            try:
                fee_total_num = float(fee_total_val) if fee_total_val not in (None, '') else round(fee_net_num + vat_num, 2)
            except (TypeError, ValueError):
                fee_total_num = round(fee_net_num + vat_num, 2)
            try:
                cod_num = float(cod_val) if cod_val not in (None, '') else 0.0
            except (TypeError, ValueError):
                cod_num = 0.0

            print(
                f"{tr:13} | "
                f"{cod_num:>9.2f} | "
                f"{fee_net_num:>7.2f} | "
                f"{vat_num:>7.2f} | "
                f"{fee_total_num:>9.2f} | "
                f"{typ_val}"
            )

    return 0

if __name__ == '__main__':
    sys.exit(main())
